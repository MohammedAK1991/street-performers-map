import { logger } from "../../../shared/utils/logger";
import type { TransactionDocument } from "../entities/Transaction";
import {
	type TransactionFilters,
	type TransactionSummary,
	transactionRepository,
} from "../repositories/TransactionRepository";

export interface CreateTransactionRequest {
	performerId: string;
	performanceId: string;
	amount: number; // in cents
	currency: string;
	paymentIntentId: string;
	tipperId?: string;
	isAnonymous?: boolean;
	publicMessage?: string;
	processingFee: number;
	netAmount: number;
}

export class TransactionService {
	/**
	 * Create a new tip transaction
	 */
	async createTipTransaction(
		request: CreateTransactionRequest,
	): Promise<TransactionDocument> {
		try {
			const transactionData = {
				...request,
				type: "tip" as const,
				status: "pending" as const,
				metadata: {
					publicMessage: request.publicMessage || "",
					isAnonymous: request.isAnonymous || false,
				},
			};

			const transaction = await transactionRepository.create(transactionData);

			logger.info(
				`💰 Created tip transaction: ${transaction._id} for €${(request.amount / 100).toFixed(2)}`,
			);

			return transaction;
		} catch (error: any) {
			logger.error("❌ Failed to create tip transaction:", error);
			throw new Error(`Tip transaction creation failed: ${error.message}`);
		}
	}

	/**
	 * Get performer's tips
	 */
	async getPerformerTips(
		performerId: string,
		filters: TransactionFilters = {},
		page = 1,
		limit = 20,
	): Promise<{ tips: TransactionDocument[]; total: number; hasMore: boolean }> {
		try {
			const offset = (page - 1) * limit;
			const tips = await transactionRepository.getPerformerTips(
				performerId,
				filters,
				limit + 1,
				offset,
			);

			const hasMore = tips.length > limit;
			if (hasMore) {
				tips.pop(); // Remove the extra item used for pagination
			}

			logger.debug(
				`📊 Retrieved ${tips.length} tips for performer ${performerId}`,
				{
					context: "TransactionService",
				},
			);

			return {
				tips,
				total: tips.length,
				hasMore,
			};
		} catch (error: any) {
			logger.error(
				`❌ Failed to get performer tips for ${performerId}:`,
				error,
			);
			throw new Error(`Failed to get performer tips: ${error.message}`);
		}
	}

	/**
	 * Get performer's tips summary
	 */
	async getPerformerTipsSummary(
		performerId: string,
		filters: TransactionFilters = {},
	): Promise<TransactionSummary> {
		try {
			const summary = await transactionRepository.getPerformerTipsSummary(
				performerId,
				filters,
			);

			logger.debug(`📊 Tips summary for performer ${performerId}:`, summary, {
				context: "TransactionService",
			});

			return summary;
		} catch (error: any) {
			logger.error(
				`❌ Failed to get tips summary for performer ${performerId}:`,
				error,
			);
			throw new Error(`Failed to get tips summary: ${error.message}`);
		}
	}

	/**
	 * Get tips for a specific performance
	 */
	async getPerformanceTips(
		performanceId: string,
	): Promise<TransactionDocument[]> {
		try {
			const tips =
				await transactionRepository.getPerformanceTips(performanceId);

			logger.debug(
				`📊 Retrieved ${tips.length} tips for performance ${performanceId}`,
				{
					context: "TransactionService",
				},
			);

			return tips;
		} catch (error: any) {
			logger.error(
				`❌ Failed to get performance tips for ${performanceId}:`,
				error,
			);
			throw new Error(`Failed to get performance tips: ${error.message}`);
		}
	}

	/**
	 * Complete a transaction (called when payment succeeds)
	 */
	async completeTransaction(
		paymentIntentId: string,
		metadata: any = {},
	): Promise<TransactionDocument | null> {
		try {
			const transaction =
				await transactionRepository.findByPaymentIntentId(paymentIntentId);

			if (!transaction) {
				logger.warn(
					`⚠️ Transaction not found for payment intent: ${paymentIntentId}`,
				);
				return null;
			}

			const completedTransaction = await transactionRepository.updateStatus(
				transaction._id.toString(),
				"completed",
				metadata,
			);

			if (completedTransaction) {
				logger.info(
					`✅ Completed transaction: ${completedTransaction._id} for €${(completedTransaction.amount / 100).toFixed(2)}`,
				);
			}

			return completedTransaction;
		} catch (error: any) {
			logger.error(
				`❌ Failed to complete transaction for payment intent ${paymentIntentId}:`,
				error,
			);
			throw new Error(`Transaction completion failed: ${error.message}`);
		}
	}

	/**
	 * Fail a transaction (called when payment fails)
	 */
	async failTransaction(
		paymentIntentId: string,
		reason = "",
	): Promise<TransactionDocument | null> {
		try {
			const transaction =
				await transactionRepository.findByPaymentIntentId(paymentIntentId);

			if (!transaction) {
				logger.warn(
					`⚠️ Transaction not found for payment intent: ${paymentIntentId}`,
				);
				return null;
			}

			const failedTransaction = await transactionRepository.updateStatus(
				transaction._id.toString(),
				"failed",
				{ failureReason: reason },
			);

			if (failedTransaction) {
				logger.info(
					`❌ Failed transaction: ${failedTransaction._id} - ${reason}`,
				);
			}

			return failedTransaction;
		} catch (error: any) {
			logger.error(
				`❌ Failed to mark transaction as failed for payment intent ${paymentIntentId}:`,
				error,
			);
			throw new Error(`Transaction failure update failed: ${error.message}`);
		}
	}

	/**
	 * Get recent tips (for admin dashboard)
	 */
	async getRecentTips(limit = 20): Promise<TransactionDocument[]> {
		try {
			const tips = await transactionRepository.getRecentTips(limit);

			logger.debug(`📊 Retrieved ${tips.length} recent tips`, {
				context: "TransactionService",
			});

			return tips;
		} catch (error: any) {
			logger.error("❌ Failed to get recent tips:", error);
			throw new Error(`Failed to get recent tips: ${error.message}`);
		}
	}
}

// Export singleton instance
export const transactionService = new TransactionService();
