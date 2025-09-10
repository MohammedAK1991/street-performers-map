import type { Request, Response } from "express";
import { ApiError } from "../../../shared/utils/errors";
import { logger } from "../../../shared/utils/logger";
import { Transaction } from "../../payment/entities/Transaction";
import { PerformanceModel } from "../entities/Performance";

export interface AnalyticsDateRange {
	startDate?: Date;
	endDate?: Date;
}

export interface PerformanceAnalytics {
	overview: {
		totalPerformances: number;
		totalViews: number;
		totalLikes: number;
		totalTips: number;
		totalEarnings: number;
		averageRating: number;
	};
	performanceBreakdown: {
		live: number;
		scheduled: number;
		completed: number;
		cancelled: number;
	};
	topPerformances: Array<{
		_id: string;
		title: string;
		views: number;
		likes: number;
		tips: number;
		earnings: number;
		date: Date;
	}>;
	revenueOverTime: Array<{
		date: string;
		earnings: number;
		tips: number;
	}>;
	genreBreakdown: Array<{
		genre: string;
		count: number;
		totalEarnings: number;
	}>;
	locationInsights: Array<{
		location: string;
		performances: number;
		averageEarnings: number;
	}>;
}

export class AnalyticsController {
	/**
	 * Get comprehensive analytics for a performer
	 * GET /api/performances/analytics
	 */
	getPerformerAnalytics = async (req: Request, res: Response): Promise<void> => {
		try {
			const userId = req.user?.userId;
			const { startDate, endDate, period = '30d' } = req.query;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			// Parse date range
			const dateRange = this.parseDateRange(startDate as string, endDate as string, period as string);

			const analytics = await this.buildPerformerAnalytics(userId, dateRange);

			res.json({
				success: true,
				data: analytics,
			});
		} catch (error: any) {
			logger.error("❌ Get performer analytics error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	};

	/**
	 * Get analytics for a specific performance
	 * GET /api/performances/:id/analytics
	 */
	getPerformanceAnalytics = async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const userId = req.user?.userId;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const performance = await PerformanceModel.findById(id);
			
			if (!performance) {
				throw new ApiError(404, "Performance not found");
			}

			// Check if user owns this performance  
			if (performance && performance.performerId !== userId) {
				throw new ApiError(403, "Access denied");
			}

			const analytics = await this.buildSinglePerformanceAnalytics(id);

			res.json({
				success: true,
				data: analytics,
			});
		} catch (error: any) {
			logger.error("❌ Get performance analytics error:", error);

			if (error instanceof ApiError) {
				res.status(error.statusCode).json({
					success: false,
					error: {
						message: error.message,
					},
				});
			} else {
				res.status(500).json({
					success: false,
					error: {
						message: "Internal server error",
					},
				});
			}
		}
	};

	/**
	 * Get real-time performance metrics
	 * GET /api/performances/:id/metrics/live
	 */
	getLiveMetrics = async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const userId = req.user?.userId;

			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const performance = await PerformanceModel.findById(id);
			
			if (!performance) {
				throw new ApiError(404, "Performance not found");
			}

			if (performance && performance.performerId !== userId) {
				throw new ApiError(403, "Access denied");
			}

			// Get recent tips (last 5 minutes)
			const recentTips = await Transaction.find({
				performanceId: id,
				status: 'completed',
				createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
			}).sort({ createdAt: -1 });

			const liveMetrics = {
				currentViewers: Math.floor(Math.random() * 50) + 10, // Mock live viewers
				recentTips: recentTips.map(tip => ({
					amount: tip.amount,
					isAnonymous: tip.isAnonymous,
					publicMessage: tip.publicMessage,
					createdAt: tip.createdAt
				})),
				totalEarningsToday: await this.calculateTodayEarnings(id),
				likesInLastHour: await this.calculateRecentLikes(id, 1),
				averageSessionTime: '4:32', // Mock data
				bounceRate: '23%' // Mock data
			};

			res.json({
				success: true,
				data: liveMetrics,
			});
		} catch (error: any) {
			logger.error("❌ Get live metrics error:", error);
			res.status(500).json({
				success: false,
				error: {
					message: "Internal server error",
				},
			});
		}
	};

	private async buildPerformerAnalytics(performerId: string, dateRange: AnalyticsDateRange): Promise<PerformanceAnalytics> {
		// Build date filter
		const dateFilter: any = { performerId };
		if (dateRange.startDate || dateRange.endDate) {
			dateFilter.createdAt = {};
			if (dateRange.startDate) dateFilter.createdAt.$gte = dateRange.startDate;
			if (dateRange.endDate) dateFilter.createdAt.$lte = dateRange.endDate;
		}

		// Get all performances for the performer
		const performances = await PerformanceModel.find(dateFilter).sort({ createdAt: -1 });

		// Get all transactions for the performer
		const transactions = await Transaction.find({
			toUserId: performerId,
			status: 'completed',
			...(dateRange.startDate || dateRange.endDate ? {
				createdAt: {
					...(dateRange.startDate ? { $gte: dateRange.startDate } : {}),
					...(dateRange.endDate ? { $lte: dateRange.endDate } : {})
				}
			} : {})
		});

		// Calculate overview metrics
		const totalViews = performances.reduce((sum: number, p: any) => sum + (p.engagement?.views || 0), 0);
		const totalLikes = performances.reduce((sum: number, p: any) => sum + (p.engagement?.likes || 0), 0);
		const totalTips = transactions.length;
		const totalEarnings = transactions.reduce((sum, t) => sum + t.netAmount, 0);

		// Performance status breakdown
		const performanceBreakdown = {
			live: performances.filter((p: any) => p.status === 'live').length,
			scheduled: performances.filter((p: any) => p.status === 'scheduled').length,
			completed: performances.filter((p: any) => p.status === 'completed').length,
			cancelled: performances.filter((p: any) => p.status === 'cancelled').length,
		};

		// Top performances (by earnings)
		const performanceEarnings = new Map<string, number>();
		transactions.forEach(t => {
			const current = performanceEarnings.get(t.performanceId) || 0;
			performanceEarnings.set(t.performanceId, current + t.netAmount);
		});

		const topPerformances = performances
			.map(p => ({
				_id: p._id.toString(),
				title: p.title,
				views: p.engagement?.views || 0,
				likes: p.engagement?.likes || 0,
				tips: transactions.filter(t => t.performanceId === p._id.toString()).length,
				earnings: performanceEarnings.get(p._id.toString()) || 0,
				date: p.createdAt
			}))
			.sort((a, b) => b.earnings - a.earnings)
			.slice(0, 10);

		// Revenue over time (last 30 days)
		const revenueOverTime = await this.calculateRevenueOverTime(performerId, 30);

		// Genre breakdown
		const genreMap = new Map<string, { count: number; totalEarnings: number }>();
		performances.forEach(p => {
			const genre = p.genre || 'Unknown';
			const current = genreMap.get(genre) || { count: 0, totalEarnings: 0 };
			const earnings = performanceEarnings.get(p._id.toString()) || 0;
			genreMap.set(genre, {
				count: current.count + 1,
				totalEarnings: current.totalEarnings + earnings
			});
		});

		const genreBreakdown = Array.from(genreMap.entries()).map(([genre, data]) => ({
			genre,
			count: data.count,
			totalEarnings: data.totalEarnings
		}));

		// Location insights
		const locationInsights = await this.calculateLocationInsights(performances, performanceEarnings);

		return {
			overview: {
				totalPerformances: performances.length,
				totalViews,
				totalLikes,
				totalTips,
				totalEarnings,
				averageRating: 4.2 // Mock rating data
			},
			performanceBreakdown,
			topPerformances,
			revenueOverTime,
			genreBreakdown,
			locationInsights
		};
	}

	private async buildSinglePerformanceAnalytics(performanceId: string) {
		const performance = await PerformanceModel.findById(performanceId);
		const transactions = await Transaction.find({
			performanceId,
			status: 'completed'
		}).sort({ createdAt: -1 });

		const hourlyMetrics = await this.calculateHourlyMetrics(performanceId);
		const tipTimeline = transactions.map(t => ({
			amount: t.amount,
			netAmount: t.netAmount,
			isAnonymous: t.isAnonymous,
			publicMessage: t.publicMessage,
			createdAt: t.createdAt
		}));

		const demographics = {
			countries: await this.calculateCountryBreakdown(transactions),
			timeZones: await this.calculateTimeZoneBreakdown(transactions),
		};

		return {
			performance: {
				title: performance?.title,
				status: performance?.status,
				startTime: performance?.scheduledFor,
				duration: performance?.status === 'completed' ? '2:15:30' : null, // Mock duration
				location: performance?.route?.stops?.[0]?.location
			},
			metrics: {
				totalViews: performance?.engagement?.views || 0,
				totalLikes: performance?.engagement?.likes || 0,
				totalTips: transactions.length,
				totalEarnings: transactions.reduce((sum, t) => sum + t.netAmount, 0),
				averageTipAmount: transactions.length > 0 
					? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
					: 0,
				peakViewers: 127, // Mock data
			},
			hourlyMetrics,
			tipTimeline,
			demographics
		};
	}

	private parseDateRange(startDate?: string, endDate?: string, period?: string): AnalyticsDateRange {
		if (startDate && endDate) {
			return {
				startDate: new Date(startDate),
				endDate: new Date(endDate)
			};
		}

		const now = new Date();
		const range: AnalyticsDateRange = {};

		switch (period) {
			case '7d':
				range.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case '30d':
				range.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case '90d':
				range.startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
				break;
			case '1y':
				range.startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
				break;
			default:
				range.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		}

		range.endDate = now;
		return range;
	}

	private async calculateRevenueOverTime(performerId: string, days: number) {
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
		
		const dailyRevenue = await Transaction.aggregate([
			{
				$match: {
					toUserId: performerId,
					status: 'completed',
					createdAt: { $gte: startDate }
				}
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$createdAt"
						}
					},
					earnings: { $sum: "$netAmount" },
					tips: { $sum: 1 }
				}
			},
			{ $sort: { _id: 1 } }
		]);

		return dailyRevenue.map(day => ({
			date: day._id,
			earnings: day.earnings,
			tips: day.tips
		}));
	}

	private async calculateLocationInsights(performances: any[], performanceEarnings: Map<string, number>) {
		const locationMap = new Map<string, { performances: number; totalEarnings: number }>();

		performances.forEach(p => {
			const location = p.route?.stops?.[0]?.location?.name || 'Unknown Location';
			const current = locationMap.get(location) || { performances: 0, totalEarnings: 0 };
			const earnings = performanceEarnings.get(p._id.toString()) || 0;
			
			locationMap.set(location, {
				performances: current.performances + 1,
				totalEarnings: current.totalEarnings + earnings
			});
		});

		return Array.from(locationMap.entries()).map(([location, data]) => ({
			location,
			performances: data.performances,
			averageEarnings: data.performances > 0 ? data.totalEarnings / data.performances : 0
		}));
	}

	private async calculateHourlyMetrics(_performanceId: string) {
		// Mock hourly data - in production, you'd track this in real-time
		return Array.from({ length: 24 }, (_, hour) => ({
			hour,
			views: Math.floor(Math.random() * 50),
			tips: Math.floor(Math.random() * 10),
			earnings: Math.floor(Math.random() * 5000) // in cents
		}));
	}

	private async calculateCountryBreakdown(transactions: any[]) {
		const countryMap = new Map<string, number>();
		
		transactions.forEach(t => {
			const country = t.location?.country || 'Unknown';
			countryMap.set(country, (countryMap.get(country) || 0) + 1);
		});

		return Array.from(countryMap.entries()).map(([country, count]) => ({
			country,
			count,
			percentage: (count / transactions.length) * 100
		}));
	}

	private async calculateTimeZoneBreakdown(transactions: any[]) {
		// Mock timezone data
		return [
			{ timezone: 'Europe/Amsterdam', count: Math.floor(transactions.length * 0.4) },
			{ timezone: 'Europe/London', count: Math.floor(transactions.length * 0.3) },
			{ timezone: 'America/New_York', count: Math.floor(transactions.length * 0.2) },
			{ timezone: 'Asia/Tokyo', count: Math.floor(transactions.length * 0.1) },
		];
	}

	private async calculateTodayEarnings(performanceId: string): Promise<number> {
		const startOfDay = new Date();
		startOfDay.setHours(0, 0, 0, 0);

		const result = await Transaction.aggregate([
			{
				$match: {
					performanceId,
					status: 'completed',
					createdAt: { $gte: startOfDay }
				}
			},
			{
				$group: {
					_id: null,
					totalEarnings: { $sum: '$netAmount' }
				}
			}
		]);

		return result.length > 0 ? result[0].totalEarnings : 0;
	}

	private async calculateRecentLikes(_performanceId: string, _hours: number): Promise<number> {
		// This would require tracking like timestamps in the Performance model
		// For now, return mock data
		return Math.floor(Math.random() * 20);
	}
}

export const analyticsController = new AnalyticsController();