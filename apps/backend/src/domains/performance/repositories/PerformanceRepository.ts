import {
	type PerformanceDocument,
	PerformanceModel,
} from "../entities/Performance";
import { logger } from "../../../shared/utils/logger";
import type { Performance } from "@spm/shared-types";

export class PerformanceRepository {
	private readonly logger = logger.child({ context: "PerformanceRepository" });

	async create(
		performanceData: Omit<Performance, "_id" | "createdAt" | "updatedAt">,
	): Promise<PerformanceDocument> {
		try {
			const performance = new PerformanceModel(performanceData);
			const savedPerformance = await performance.save();

			this.logger.info("Performance created", {
				performanceId: savedPerformance._id,
				performerId: savedPerformance.performerId,
				title: savedPerformance.title,
			});

			return savedPerformance;
		} catch (error) {
			this.logger.error("Failed to create performance", {
				error,
				performanceData,
			});
			throw error;
		}
	}

	async findById(id: string): Promise<PerformanceDocument | null> {
		try {
			const performance = await PerformanceModel.findById(id)
				.populate("performerId", "username profile.displayName profile.avatar")
				.lean();
			return performance;
		} catch (error) {
			this.logger.error("Failed to find performance by ID", {
				error,
				performanceId: id,
			});
			throw error;
		}
	}

	async findByPerformerId(
		performerId: string,
		limit = 10,
	): Promise<PerformanceDocument[]> {
		try {
			const performances = await PerformanceModel.find({ performerId })
				.sort({ createdAt: -1 })
				.limit(limit)
				.lean();
			return performances;
		} catch (error) {
			this.logger.error("Failed to find performances by performer", {
				error,
				performerId,
			});
			throw error;
		}
	}

	async findNearby(
		coordinates: [number, number],
		radiusInKm: number,
		filters?: {
			genre?: string;
			status?: string;
			timeRange?: "now" | "hour" | "today";
		},
	): Promise<PerformanceDocument[]> {
		try {
			const query: any = {
				"route.stops.location.coordinates": {
					$near: {
						$geometry: {
							type: "Point",
							coordinates,
						},
						$maxDistance: radiusInKm * 1000, // Convert km to meters
					},
				},
			};

			// Apply filters
			if (filters?.genre && filters.genre !== "all") {
				query.genre = filters.genre;
			}

			if (filters?.status && filters.status !== "all") {
				query.status = filters.status;
			}

			// Time range filters
			if (filters?.timeRange) {
				const now = new Date();
				switch (filters.timeRange) {
					case "now":
						query.status = "live";
						break;
					case "hour": {
						const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
						query.scheduledFor = { $lte: oneHourFromNow };
						break;
					}
					case "today": {
						const endOfDay = new Date(now);
						endOfDay.setHours(23, 59, 59, 999);
						query.scheduledFor = { $lte: endOfDay };
						break;
					}
				}
			}

			// Optimize query based on available filters
			let sortCriteria: any = { "engagement.likes": -1, scheduledFor: 1 };

			// If filtering by status, prioritize by scheduled time
			if (filters?.status) {
				sortCriteria = { scheduledFor: 1, "engagement.likes": -1 };
			}

			// If filtering by time range, prioritize by engagement
			if (filters?.timeRange) {
				sortCriteria = { "engagement.likes": -1, scheduledFor: 1 };
			}

			const performances = await PerformanceModel.find(query)
				.populate("performerId", "username profile.displayName profile.avatar")
				.sort(sortCriteria)
				.limit(50)
				.lean();

			return performances;
		} catch (error) {
			this.logger.error("Failed to find nearby performances", {
				error,
				coordinates,
				radiusInKm,
			});
			throw error;
		}
	}

	async updateById(
		id: string,
		updateData: Partial<Performance>,
	): Promise<PerformanceDocument | null> {
		try {
			const performance = await PerformanceModel.findByIdAndUpdate(
				id,
				{ $set: updateData, updatedAt: new Date() },
				{ new: true, runValidators: true },
			).lean();

			if (performance) {
				this.logger.info("Performance updated", { performanceId: id });
			}

			return performance;
		} catch (error) {
			this.logger.error("Failed to update performance", {
				error,
				performanceId: id,
			});
			throw error;
		}
	}

	async deleteById(id: string): Promise<boolean> {
		try {
			const result = await PerformanceModel.findByIdAndDelete(id);

			if (result) {
				this.logger.info("Performance deleted", { performanceId: id });
				return true;
			}

			return false;
		} catch (error) {
			this.logger.error("Failed to delete performance", {
				error,
				performanceId: id,
			});
			throw error;
		}
	}

	async likePerformance(
		performanceId: string,
		userId: string,
	): Promise<any | null> {
		try {
			const performance = await PerformanceModel.findByIdAndUpdate(
				performanceId,
				{
					$addToSet: { "engagement.likedBy": userId },
					$inc: { "engagement.likes": 1 },
				},
				{ new: true },
			).lean();

			if (performance) {
				this.logger.info("Performance liked", { performanceId, userId });
			}

			return performance;
		} catch (error) {
			this.logger.error("Failed to like performance", {
				error,
				performanceId,
				userId,
			});
			throw error;
		}
	}

	async unlikePerformance(
		performanceId: string,
		userId: string,
	): Promise<any | null> {
		try {
			const performance = await PerformanceModel.findByIdAndUpdate(
				performanceId,
				{
					$pull: { "engagement.likedBy": userId },
					$inc: { "engagement.likes": -1 },
				},
				{ new: true },
			).lean();

			if (performance) {
				this.logger.info("Performance unliked", { performanceId, userId });
			}

			return performance;
		} catch (error) {
			this.logger.error("Failed to unlike performance", {
				error,
				performanceId,
				userId,
			});
			throw error;
		}
	}

	async incrementViews(performanceId: string): Promise<void> {
		try {
			await PerformanceModel.findByIdAndUpdate(performanceId, {
				$inc: { "engagement.views": 1 },
			});

			this.logger.debug("Performance view incremented", { performanceId });
		} catch (error) {
			this.logger.error("Failed to increment performance views", {
				error,
				performanceId,
			});
			throw error;
		}
	}

	async findTodaysPerformances(): Promise<PerformanceDocument[]> {
		try {
			const today = new Date();
			const startOfDay = new Date(today);
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date(today);
			endOfDay.setHours(23, 59, 59, 999);

			const performances = await PerformanceModel.find({
				scheduledFor: {
					$gte: startOfDay,
					$lte: endOfDay,
				},
			})
				.populate("performerId", "username profile.displayName profile.avatar")
				.sort({ scheduledFor: 1 })
				.lean();

			return performances;
		} catch (error) {
			this.logger.error("Failed to find today's performances", { error });
			throw error;
		}
	}

	async findLivePerformances(): Promise<PerformanceDocument[]> {
		try {
			const performances = await PerformanceModel.find({ status: "live" })
				.populate("performerId", "username profile.displayName profile.avatar")
				.sort({ "engagement.likes": -1 })
				.lean();

			return performances;
		} catch (error) {
			this.logger.error("Failed to find live performances", { error });
			throw error;
		}
	}
}
