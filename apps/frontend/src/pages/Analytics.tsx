import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface PerformanceAnalytics {
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

export function Analytics() {
	const { isSignedIn } = useUser();
	const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedPeriod] = useState('30d');

	useEffect(() => {
		if (isSignedIn) {
			fetchAnalytics();
		}
	}, [isSignedIn, selectedPeriod]);

	const fetchAnalytics = async () => {
		try {
			setIsLoading(true);
			setError(null);
			
			const response = await api.get(`/performances/analytics?period=${selectedPeriod}`);
			setAnalytics(response.data.data);
		} catch (err: any) {
			setError(err.message || "Failed to load analytics data");
		} finally {
			setIsLoading(false);
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-EU", {
			style: "currency",
			currency: "EUR",
		}).format(amount / 100);
	};

	const formatNumber = (num: number) => {
		if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	};

	if (!isSignedIn) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Please sign in to view analytics
					</h1>
					<Link to="/login" className="btn-primary">
						Sign In
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="text-3xl font-bold text-white mb-8">📊 Analytics Dashboard</h1>
				
				{isLoading ? (
					<div className="text-white">Loading analytics...</div>
				) : error ? (
					<div className="text-red-400">Error: {error}</div>
				) : analytics ? (
					<div className="space-y-8">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="bg-gray-800 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-white">Total Performances</h3>
								<p className="text-2xl text-blue-400">{analytics.overview.totalPerformances}</p>
							</div>
							<div className="bg-gray-800 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-white">Total Views</h3>
								<p className="text-2xl text-green-400">{formatNumber(analytics.overview.totalViews)}</p>
							</div>
							<div className="bg-gray-800 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-white">Total Tips</h3>
								<p className="text-2xl text-purple-400">{analytics.overview.totalTips}</p>
							</div>
							<div className="bg-gray-800 rounded-lg p-6">
								<h3 className="text-lg font-semibold text-white">Total Earnings</h3>
								<p className="text-2xl text-yellow-400">{formatCurrency(analytics.overview.totalEarnings)}</p>
							</div>
						</div>
						
						<div className="bg-gray-800 rounded-lg p-6">
							<h3 className="text-xl font-semibold text-white mb-4">Top Performances</h3>
							<div className="space-y-2">
								{analytics.topPerformances.slice(0, 5).map((performance) => (
									<div key={performance._id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
										<span className="text-white">{performance.title}</span>
										<span className="text-green-400">{formatCurrency(performance.earnings)}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				) : (
					<div className="text-white">No analytics data available</div>
				)}
			</div>
		</div>
	);
}