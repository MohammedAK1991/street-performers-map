import { logger } from "../../../shared/utils/logger";
import { type ITransaction, Transaction } from "../entities/Transaction";
import {
	type CreatePaymentIntentRequest,
	stripeService,
} from "./StripeService";

export interface CreateTipRequest {
	amount: number; // Amount in euros (e.g., 5.00)
	performanceId: string;
	performerId: string;
	tipperId?: string; // Optional for anonymous tips
	isAnonymous?: boolean;
	publicMessage?: string;
	currency?: string;
	location?: {
		coordinates: [number, number];
		city?: string;
		country?: string;
	};
}

export interface TipPaymentResult {
	transactionId: string;
	paymentIntentId: string;
	clientSecret: string;
	amount: number;
	processingFee: number;
	netAmount: number;
}

export class PaymentService {
	/**
	 * Create a tip payment intent
	 */
	async createTip(request: CreateTipRequest): Promise<TipPaymentResult> {
		const {
			amount,
			performanceId,
			performerId,
			tipperId,
			isAnonymous,
			publicMessage,
			currency = "EUR",
			location,
		} = request;

		// Convert euros to cents for Stripe
		const amountInCents = Math.round(amount * 100);

		// Validate amount
		if (amount < 0.5 || amount > 100) {
			throw new Error("Tip amount must be between €0.50 and €100.00");
		}

		try {
			// Get payment method types based on location
			const paymentMethodTypes = location?.country
				? stripeService.getPaymentMethodTypes(location.country)
				: ["card"];

			// Create Stripe payment intent
			const stripeRequest: CreatePaymentIntentRequest = {
				amount: amountInCents,
				currency,
				performanceId,
				performerId,
				tipperId,
				isAnonymous,
				publicMessage,
				paymentMethodTypes,
			};

			const paymentResult =
				await stripeService.createTipPaymentIntent(stripeRequest);

			// Create transaction record in database
			// NOTE: We don't store clientSecret for security - it's ephemeral and only used client-side
			const transactionData: Partial<ITransaction> = {
				amount: amountInCents,
				currency,
				fromUserId: tipperId,
				toUserId: performerId,
				performanceId,
				stripePaymentIntentId: paymentResult.paymentIntentId,
				// stripeClientSecret: removed for security - don't store ephemeral tokens
				paymentMethod: "card", // Will be updated when payment is confirmed
				status: "pending",
				isAnonymous: isAnonymous || false,
				publicMessage,
				processingFee: paymentResult.processingFee,
				netAmount: paymentResult.netAmount,
				location,
				retryCount: 0,
				payoutStatus: "pending",
			};

			const transaction = new Transaction(transactionData);
			await transaction.save();

			logger.info(
				`💰 Created tip transaction: ${transaction._id} for €${amount.toFixed(2)}`,
			);

			return {
				transactionId: transaction._id.toString(),
				paymentIntentId: paymentResult.paymentIntentId,
				clientSecret: paymentResult.clientSecret,
				amount: amountInCents,
				processingFee: paymentResult.processingFee,
				netAmount: paymentResult.netAmount,
			};
		} catch (error: any) {
			logger.error("❌ Failed to create tip payment:", error);
			throw new Error(`Tip payment creation failed: ${error.message}`);
		}
	}

	/**
	 * Get transaction by ID
	 */
	async getTransaction(transactionId: string): Promise<any | null> {
		try {
			const transaction = await Transaction.findById(transactionId);
			return transaction;
		} catch (error) {
			logger.error(`❌ Failed to get transaction ${transactionId}:`, error);
			return null;
		}
	}

	/**
	 * Get transactions for a performer
	 */
	async getPerformerTransactions(
		performerId: string,
		status?: string,
	): Promise<any[]> {
		try {
			const transactions = await Transaction.findByPerformer(
				performerId,
				status,
			);
			return transactions;
		} catch (error) {
			logger.error(
				`❌ Failed to get transactions for performer ${performerId}:`,
				error,
			);
			return [];
		}
	}

	/**
	 * Get transactions for a performance
	 */
	async getPerformanceTransactions(performanceId: string): Promise<any[]> {
		try {
			const transactions = await Transaction.findByPerformance(performanceId);
			return transactions;
		} catch (error) {
			logger.error(
				`❌ Failed to get transactions for performance ${performanceId}:`,
				error,
			);
			return [];
		}
	}

	/**
	 * Get performer earnings summary
	 */
	async getPerformerEarnings(
		performerId: string,
		startDate?: Date,
		endDate?: Date,
	): Promise<{
		totalAmount: number;
		totalNet: number;
		totalFees: number;
		transactionCount: number;
		averageAmount: number;
	} | null> {
		try {
			const earnings = await Transaction.getPerformerEarnings(
				performerId,
				startDate,
				endDate,
			);

			if (!earnings || earnings.length === 0) {
				return {
					totalAmount: 0,
					totalNet: 0,
					totalFees: 0,
					transactionCount: 0,
					averageAmount: 0,
				};
			}

			return earnings[0];
		} catch (error) {
			logger.error(
				`❌ Failed to get earnings for performer ${performerId}:`,
				error,
			);
			return null;
		}
	}

	/**
	 * Update transaction status (called by webhook handler)
	 */
	async updateTransactionStatus(
		paymentIntentId: string,
		status: "completed" | "failed",
		chargeId?: string,
		failureReason?: string,
	): Promise<void> {
		try {
			const transaction = await Transaction.findOne({
				stripePaymentIntentId: paymentIntentId,
			});

			if (!transaction) {
				logger.error(
					`❌ Transaction not found for payment intent: ${paymentIntentId}`,
				);
				return;
			}

			if (status === "completed" && chargeId) {
				await transaction.markCompleted(chargeId);
				logger.info(`✅ Transaction ${transaction._id} marked as completed`);
				
				// Create transfer to performer's Connect account
				try {
					// Get performer's Connect account ID
					const UserModel = (await import('../../user/entities/User')).UserModel;
					const performer = await UserModel.findById(transaction.toUserId);
					
					if (performer?.stripe?.connectAccountId) {
						const transferId = await stripeService.createTransfer(
							transaction.netAmount, // Transfer the net amount after fees
							performer.stripe.connectAccountId,
							`tip_${transaction._id}` // Transfer group for tracking
						);
						
						logger.info(`💸 Created transfer ${transferId} to performer ${performer._id} (${performer.stripe.connectAccountId}) for €${(transaction.netAmount / 100).toFixed(2)}`);
					} else {
						logger.warn(`⚠️ Performer ${transaction.toUserId} has no Connect account - skipping transfer`);
					}
				} catch (transferError) {
					logger.error(`❌ Failed to create transfer for transaction ${transaction._id}:`, transferError);
					// Don't fail the whole operation if transfer fails
				}
			} else if (status === "failed") {
				await transaction.markFailed(failureReason || "Payment failed");
				logger.info(`❌ Transaction ${transaction._id} marked as failed`);
			}
		} catch (error) {
			logger.error(
				`❌ Failed to update transaction status for ${paymentIntentId}:`,
				error,
			);
		}
	}

	/**
	 * Get payment summary for a performance
	 */
	async getPerformancePaymentSummary(performanceId: string): Promise<{
		totalTips: number;
		totalAmount: number;
		tipCount: number;
		averageTip: number;
	}> {
		try {
			const transactions = await Transaction.find({
				performanceId,
				status: "completed",
			});

			const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
			const tipCount = transactions.length;
			const averageTip = tipCount > 0 ? totalAmount / tipCount : 0;

			return {
				totalTips: totalAmount, // For backwards compatibility
				totalAmount,
				tipCount,
				averageTip,
			};
		} catch (error) {
			logger.error(
				`❌ Failed to get payment summary for performance ${performanceId}:`,
				error,
			);
			return {
				totalTips: 0,
				totalAmount: 0,
				tipCount: 0,
				averageTip: 0,
			};
		}
	}

	/**
	 * Get recent tips for display (public tips only)
	 */
	async getRecentPublicTips(
		performanceId: string,
		limit = 10,
	): Promise<
		Array<{
			amount: number;
			fromUser: string;
			message?: string;
			createdAt: Date;
		}>
	> {
		try {
			const transactions = await Transaction.find({
				performanceId,
				status: "completed",
				isAnonymous: false,
			})
				.sort({ createdAt: -1 })
				.limit(limit);

			return transactions.map((t) => ({
				amount: t.amount,
				fromUser: t.fromUserId || "Anonymous",
				message: t.publicMessage,
				createdAt: t.createdAt,
			}));
		} catch (error) {
			logger.error(
				`❌ Failed to get recent tips for performance ${performanceId}:`,
				error,
			);
			return [];
		}
	}
}

// Export singleton instance
export const paymentService = new PaymentService();
