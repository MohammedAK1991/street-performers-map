import type { FilterQuery } from "mongoose";
import { logger } from "../../../shared/utils/logger";
import type {
	ITransaction,
	TransactionDocument,
} from "../entities/Transaction";
import { Transaction } from "../entities/Transaction";

export interface TransactionFilters {
	performerId?: string;
	performanceId?: string;
	tipperId?: string;
	status?: "pending" | "completed" | "failed" | "refunded";
	isAnonymous?: boolean;
	dateFrom?: Date;
	dateTo?: Date;
}

export interface TransactionSummary {
	totalTips: number;
	totalAmount: number;
	netAmount: number;
	processingFees: number;
	averageTip: number;
	tipCount: number;
}

export class TransactionRepository {
	/**
	 * Create a new transaction
	 */
	async create(
		transactionData: Partial<ITransaction>,
	): Promise<TransactionDocument> {
		try {
			const transaction = new Transaction(transactionData);
			await transaction.save();

			logger.info(
				`💰 Created tip transaction: ${transaction._id} for €${(transaction.amount / 100).toFixed(2)}`,
				{
					context: "TransactionRepository",
				},
			);

			return transaction;
		} catch (error: any) {
			logger.error("❌ Failed to create transaction:", error, {
				context: "TransactionRepository",
			});
			throw new Error(`Transaction creation failed: ${error.message}`);
		}
	}

	/**
	 * Find transaction by ID
	 */
	async findById(id: string): Promise<TransactionDocument | null> {
		try {
			return await Transaction.findById(id);
		} catch (error: any) {
			logger.error(`❌ Failed to find transaction ${id}:`, error, {
				context: "TransactionRepository",
			});
			return null;
		}
	}

	/**
	 * Find transaction by payment intent ID
	 */
	async findByPaymentIntentId(
		paymentIntentId: string,
	): Promise<TransactionDocument | null> {
		try {
			return await Transaction.findOne({ paymentIntentId });
		} catch (error: any) {
			logger.error(
				`❌ Failed to find transaction by payment intent ${paymentIntentId}:`,
				error,
				{
					context: "TransactionRepository",
				},
			);
			return null;
		}
	}

	/**
	 * Get tips for a performer
	 */
	async getPerformerTips(
		performerId: string,
		filters: TransactionFilters = {},
		limit = 50,
		offset = 0,
	): Promise<TransactionDocument[]> {
		try {
			const query: FilterQuery<TransactionDocument> = {
				performerId,
				status: "completed",
			};

			// Apply filters
			if (filters.performanceId) {
				query.performanceId = filters.performanceId;
			}

			if (filters.isAnonymous !== undefined) {
				query.isAnonymous = filters.isAnonymous;
			}

			if (filters.dateFrom || filters.dateTo) {
				query.createdAt = {};
				if (filters.dateFrom) {
					query.createdAt.$gte = filters.dateFrom;
				}
				if (filters.dateTo) {
					query.createdAt.$lte = filters.dateTo;
				}
			}

			return await Transaction.find(query)
				.sort({ createdAt: -1 })
				.limit(limit)
				.skip(offset)
				.populate("performanceId", "title location")
				.exec();
		} catch (error: any) {
			logger.error(
				`❌ Failed to get tips for performer ${performerId}:`,
				error,
				{
					context: "TransactionRepository",
				},
			);
			throw new Error(`Failed to get performer tips: ${error.message}`);
		}
	}

	/**
	 * Get tips summary for a performer
	 */
	async getPerformerTipsSummary(
		performerId: string,
		filters: TransactionFilters = {},
	): Promise<TransactionSummary> {
		try {
			const matchQuery: any = {
				performerId,
				status: "completed",
			};

			// Apply filters
			if (filters.performanceId) {
				matchQuery.performanceId = filters.performanceId;
			}

			if (filters.dateFrom || filters.dateTo) {
				matchQuery.createdAt = {};
				if (filters.dateFrom) {
					matchQuery.createdAt.$gte = filters.dateFrom;
				}
				if (filters.dateTo) {
					matchQuery.createdAt.$lte = filters.dateTo;
				}
			}

			const result = await Transaction.aggregate([
				{ $match: matchQuery },
				{
					$group: {
						_id: null,
						totalAmount: { $sum: "$amount" },
						netAmount: { $sum: "$netAmount" },
						processingFees: { $sum: "$processingFee" },
						tipCount: { $sum: 1 },
						averageTip: { $avg: "$amount" },
					},
				},
			]);

			if (result.length === 0) {
				return {
					totalTips: 0,
					totalAmount: 0,
					netAmount: 0,
					processingFees: 0,
					averageTip: 0,
					tipCount: 0,
				};
			}

			const summary = result[0];
			return {
				totalTips: summary.tipCount,
				totalAmount: summary.totalAmount,
				netAmount: summary.netAmount,
				processingFees: summary.processingFees,
				averageTip: Math.round(summary.averageTip || 0),
				tipCount: summary.tipCount,
			};
		} catch (error: any) {
			logger.error(
				`❌ Failed to get tips summary for performer ${performerId}:`,
				error,
				{
					context: "TransactionRepository",
				},
			);
			throw new Error(`Failed to get tips summary: ${error.message}`);
		}
	}

	/**
	 * Get tips for a performance
	 */
	async getPerformanceTips(
		performanceId: string,
	): Promise<TransactionDocument[]> {
		try {
			return await Transaction.find({
				performanceId,
				status: "completed",
			})
				.sort({ createdAt: -1 })
				.exec();
		} catch (error: any) {
			logger.error(
				`❌ Failed to get tips for performance ${performanceId}:`,
				error,
				{
					context: "TransactionRepository",
				},
			);
			throw new Error(`Failed to get performance tips: ${error.message}`);
		}
	}

	/**
	 * Update transaction status
	 */
	async updateStatus(
		id: string,
		status: "pending" | "completed" | "failed" | "refunded",
		metadata?: any,
	): Promise<TransactionDocument | null> {
		try {
			const updateData: any = {
				status,
				updatedAt: new Date(),
			};

			if (metadata) {
				updateData.metadata = { ...updateData.metadata, ...metadata };
			}

			const transaction = await Transaction.findByIdAndUpdate(id, updateData, {
				new: true,
			});

			if (transaction) {
				logger.info(`✅ Updated transaction ${id} status to ${status}`, {
					context: "TransactionRepository",
				});
			}

			return transaction;
		} catch (error: any) {
			logger.error(`❌ Failed to update transaction ${id} status:`, error, {
				context: "TransactionRepository",
			});
			throw new Error(`Transaction status update failed: ${error.message}`);
		}
	}

	/**
	 * Get recent tips (for admin/analytics)
	 */
	async getRecentTips(limit = 20): Promise<TransactionDocument[]> {
		try {
			return await Transaction.find({ status: "completed" })
				.sort({ createdAt: -1 })
				.limit(limit)
				.populate("performanceId", "title location")
				.populate("performerId", "profile.displayName")
				.exec();
		} catch (error: any) {
			logger.error("❌ Failed to get recent tips:", error, {
				context: "TransactionRepository",
			});
			throw new Error(`Failed to get recent tips: ${error.message}`);
		}
	}
}

// Export singleton instance
export const transactionRepository = new TransactionRepository();
