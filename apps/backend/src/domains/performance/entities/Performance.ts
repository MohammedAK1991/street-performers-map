import type { Performance as IPerformance } from "@spm/shared-types";
import mongoose, { Schema, type Document } from "mongoose";

// Mongoose document interface
export interface PerformanceDocument
	extends Omit<IPerformance, "_id">,
		Document {
	_id: mongoose.Types.ObjectId;
}

// Performance schema
const performanceSchema = new Schema<PerformanceDocument>(
	{
		performerId: {
			type: String,
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		description: {
			type: String,
			maxlength: 500,
		},
		genre: {
			type: String,
			enum: [
				"rock",
				"jazz",
				"folk",
				"pop",
				"classical",
				"blues",
				"country",
				"electronic",
				"hip-hop",
				"reggae",
				"other",
			],
			required: true,
			index: true,
		},
		route: {
			stops: {
				type: [
					{
						location: {
							coordinates: {
								type: [Number, Number],
								required: true,
								index: "2dsphere",
							},
							address: {
								type: String,
								required: true,
							},
							name: String,
						},
						startTime: {
							type: Date,
							required: true,
						},
						endTime: {
							type: Date,
							required: true,
						},
						status: {
							type: String,
							enum: ["scheduled", "active", "completed", "cancelled"],
							default: "scheduled",
						},
					},
				],
				validate: {
					validator: (stops: unknown[]) =>
						stops.length >= 1 && stops.length <= 5,
					message: "Performance must have between 1 and 5 stops",
				},
			},
		},
		// Video URL and thumbnail from client-side uploads
		videoUrl: {
			type: String,
		},
		videoThumbnail: {
			type: String,
		},
		engagement: {
			likes: {
				type: Number,
				default: 0,
			},
			views: {
				type: Number,
				default: 0,
			},
			tips: {
				type: Number,
				default: 0,
			},
			likedBy: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
				},
			],
		},
		status: {
			type: String,
			enum: ["scheduled", "live", "completed", "cancelled"],
			default: "scheduled",
			index: true,
		},
		scheduledFor: {
			type: Date,
			required: true,
			index: true,
		},
		expiresAt: {
			type: Date,
			required: true,
			// TTL index defined below to avoid duplicates
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: (doc, ret: unknown) => {
				const result = ret as any;
				result._id = result._id.toString();
				result.performerId = result.performerId.toString();
				result.__v = undefined;
				return result;
			},
		},
	},
);

// Indexes for performance
performanceSchema.index({ performerId: 1, createdAt: -1 });
performanceSchema.index({ status: 1, scheduledFor: 1 });
performanceSchema.index({ genre: 1, status: 1 });
performanceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Compound indexes for optimized filtering queries
performanceSchema.index({
	"route.stops.location.coordinates": "2dsphere",
	status: 1,
	scheduledFor: 1,
});

// Compound index for genre + status filtering
performanceSchema.index({
	genre: 1,
	status: 1,
	scheduledFor: 1,
});

// Compound index for geospatial + genre filtering
performanceSchema.index({
	"route.stops.location.coordinates": "2dsphere",
	genre: 1,
	status: 1,
});

// Compound index for time-based queries
performanceSchema.index({
	status: 1,
	scheduledFor: 1,
	expiresAt: 1,
});

// Index for engagement sorting
performanceSchema.index({
	"engagement.likes": -1,
	scheduledFor: 1,
});

// Virtual for current active stop
performanceSchema.virtual("currentStop").get(function (
	this: PerformanceDocument,
) {
	const now = new Date();
	return (
		this.route.stops.find(
			(stop) =>
				stop.status === "active" ||
				(stop.startTime <= now && stop.endTime >= now),
		) || this.route.stops[0]
	);
});

// Method to check if performance is currently live
performanceSchema.methods.isLive = function (this: PerformanceDocument) {
	const now = new Date();
	return this.route.stops.some(
		(stop) => stop.startTime <= now && stop.endTime >= now,
	);
};

// Method to get next stop
performanceSchema.methods.getNextStop = function (this: PerformanceDocument) {
	const now = new Date();
	return this.route.stops.find((stop) => stop.startTime > now);
};

export const PerformanceModel = mongoose.model<PerformanceDocument>(
	"Performance",
	performanceSchema,
);
