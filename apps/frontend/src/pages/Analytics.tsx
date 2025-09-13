import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";

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
	const { isSignedIn, user } = useUser();
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
			{/* Header */}
			<header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<div className="flex items-center space-x-4 flex-shrink-0">
							<Link
								to="/"
								className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center space-x-2"
							>
								<span className="text-2xl">🎵</span>
								<span className="hidden sm:inline">StreetPerformersMap</span>
								<span className="sm:hidden">SPM</span>
							</Link>
						</div>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center space-x-2">
							<Link
								to="/map"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50"
							>
								Map
							</Link>
							<Link
								to="/analytics"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50 bg-gray-700/50"
							>
								Analytics
							</Link>
							<Link
								to="/create-performance"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50"
							>
								Create Performance
							</Link>
						</nav>

						{/* Right side - Notifications and User */}
						<div className="flex items-center space-x-2 flex-shrink-0">
							<NotificationCenter />
							<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white text-xs sm:text-sm font-medium">
									{user?.fullName?.[0] || user?.username?.[0] || "U"}
								</span>
							</div>
						</div>
					</div>

					{/* Mobile Navigation */}
					<div className="md:hidden border-t border-gray-700/50 py-2">
						<div className="flex flex-wrap gap-2">
							<Link
								to="/map"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm"
							>
								Map
							</Link>
							<Link
								to="/analytics"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm bg-gray-700/50"
							>
								Analytics
							</Link>
							<Link
								to="/create-performance"
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm"
							>
								Create Performance
							</Link>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation Breadcrumbs */}
				<div className="flex items-center gap-4 mb-6">
					<Link 
						to="/profile" 
						className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						Back to Profile
					</Link>
					<span className="text-gray-400">|</span>
					<Link 
						to="/map" 
						className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Map
					</Link>
				</div>
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