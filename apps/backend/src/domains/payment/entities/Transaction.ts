import mongoose, { Schema, type Document } from "mongoose";

// Base entity interface
interface BaseEntity {
	_id: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface ITransaction extends BaseEntity {
	// Core transaction data
	amount: number; // Amount in cents (e.g., 500 = €5.00)
	currency: string; // EUR, USD, etc.

	// User relationships
	fromUserId?: string; // Tipper (optional for anonymous tips)
	toUserId: string; // Performer receiving the tip
	performanceId: string; // Performance being tipped

	// Payment processing
	stripePaymentIntentId: string;
	stripeChargeId?: string;
	paymentMethod: "card" | "apple_pay" | "google_pay" | "bizum";

	// Transaction status
	status: "pending" | "processing" | "completed" | "failed" | "refunded";

	// Privacy & Display
	isAnonymous: boolean; // Whether tip should be shown as anonymous
	publicMessage?: string; // Optional public message with tip

	// Processing metadata
	stripeClientSecret?: string;
	processingFee: number; // Stripe fees in cents
	netAmount: number; // Amount after fees

	// Geographic data (for analytics)
	location?: {
		coordinates: [number, number]; // [lng, lat]
		city?: string;
		country?: string;
	};

	// Failure handling
	failureReason?: string;
	retryCount: number;

	// Payout tracking
	payoutId?: string; // Reference to payout batch
	payoutDate?: Date;
	payoutStatus: "pending" | "processing" | "completed" | "failed";
}

export interface TransactionDocument
	extends Omit<ITransaction, "_id">,
		Document {
	_id: mongoose.Types.ObjectId;
	markCompleted(chargeId: string): Promise<TransactionDocument>;
	markFailed(reason: string): Promise<TransactionDocument>;
	canRetry(): boolean;
}

const TransactionSchema = new Schema<TransactionDocument>(
	{
		// Core transaction data
		amount: {
			type: Number,
			required: true,
			min: 50, // Minimum €0.50
			max: 10000, // Maximum €100.00
		},
		currency: {
			type: String,
			required: true,
			default: "EUR",
			enum: ["EUR", "USD", "GBP"],
		},

		// User relationships
		fromUserId: {
			type: String,
			index: true,
			// Not required for anonymous tips
		},
		toUserId: {
			type: String,
			required: true,
			index: true,
		},
		performanceId: {
			type: String,
			required: true,
			index: true,
		},

		// Payment processing
		stripePaymentIntentId: {
			type: String,
			required: true,
			unique: true,
		},
		stripeChargeId: {
			type: String,
			index: true,
		},
		paymentMethod: {
			type: String,
			required: true,
			enum: ["card", "apple_pay", "google_pay", "bizum"],
		},

		// Transaction status
		status: {
			type: String,
			required: true,
			default: "pending",
			enum: ["pending", "processing", "completed", "failed", "refunded"],
			index: true,
		},

		// Privacy & Display
		isAnonymous: {
			type: Boolean,
			default: false,
		},
		publicMessage: {
			type: String,
			maxlength: 200,
		},

		// Processing metadata
		stripeClientSecret: {
			type: String,
		},
		processingFee: {
			type: Number,
			required: true,
			default: 0,
		},
		netAmount: {
			type: Number,
			required: true,
		},

		// Geographic data
		location: {
			coordinates: {
				type: [Number, Number],
				index: "2dsphere",
			},
			city: String,
			country: String,
		},

		// Failure handling
		failureReason: {
			type: String,
		},
		retryCount: {
			type: Number,
			default: 0,
		},

		// Payout tracking
		payoutId: {
			type: String,
			index: true,
		},
		payoutDate: {
			type: Date,
		},
		payoutStatus: {
			type: String,
			default: "pending",
			enum: ["pending", "processing", "completed", "failed"],
			index: true,
		},
	},
	{
		timestamps: true,
		collection: "transactions",
	},
);

// Compound indexes for efficient queries
TransactionSchema.index({ toUserId: 1, status: 1, createdAt: -1 }); // Performer earnings
TransactionSchema.index({ fromUserId: 1, createdAt: -1 }); // User tip history
TransactionSchema.index({ performanceId: 1, status: 1 }); // Performance tips
TransactionSchema.index({ status: 1, payoutStatus: 1 }); // Payout processing
TransactionSchema.index({ createdAt: -1, status: 1 }); // Recent transactions

// Virtual for display amount (converts cents to euros)
TransactionSchema.virtual("displayAmount").get(function (
	this: TransactionDocument,
) {
	return (this.amount / 100).toFixed(2);
});

// Virtual for display net amount
TransactionSchema.virtual("displayNetAmount").get(function (
	this: TransactionDocument,
) {
	return (this.netAmount / 100).toFixed(2);
});

// Virtual for fee percentage
TransactionSchema.virtual("feePercentage").get(function (
	this: TransactionDocument,
) {
	return ((this.processingFee / this.amount) * 100).toFixed(2);
});

// Methods
TransactionSchema.methods.markCompleted = function (chargeId: string) {
	this.status = "completed";
	this.stripeChargeId = chargeId;
	return this.save();
};

TransactionSchema.methods.markFailed = function (reason: string) {
	this.status = "failed";
	this.failureReason = reason;
	this.retryCount += 1;
	return this.save();
};

TransactionSchema.methods.canRetry = function (): boolean {
	return this.status === "failed" && this.retryCount < 3;
};

// Static methods interface
interface TransactionModel extends mongoose.Model<TransactionDocument> {
	findByPerformer(
		performerId: string,
		status?: string,
	): Promise<TransactionDocument[]>;
	findByPerformance(performanceId: string): Promise<TransactionDocument[]>;
	getPerformerEarnings(
		performerId: string,
		startDate?: Date,
		endDate?: Date,
	): Promise<any[]>;
}

// Static methods
TransactionSchema.statics.findByPerformer = function (
	performerId: string,
	status?: string,
) {
	const query: any = { toUserId: performerId };
	if (status) query.status = status;
	return this.find(query).sort({ createdAt: -1 });
};

TransactionSchema.statics.findByPerformance = function (performanceId: string) {
	return this.find({
		performanceId,
		status: "completed",
	}).sort({ createdAt: -1 });
};

TransactionSchema.statics.getPerformerEarnings = function (
	performerId: string,
	startDate?: Date,
	endDate?: Date,
) {
	const match: any = {
		toUserId: performerId,
		status: "completed",
	};

	if (startDate || endDate) {
		match.createdAt = {};
		if (startDate) match.createdAt.$gte = startDate;
		if (endDate) match.createdAt.$lte = endDate;
	}

	return this.aggregate([
		{ $match: match },
		{
			$group: {
				_id: null,
				totalAmount: { $sum: "$amount" },
				totalNet: { $sum: "$netAmount" },
				totalFees: { $sum: "$processingFee" },
				transactionCount: { $sum: 1 },
				averageAmount: { $avg: "$amount" },
			},
		},
	]);
};

export const Transaction = mongoose.model<
	TransactionDocument,
	TransactionModel
>("Transaction", TransactionSchema);
