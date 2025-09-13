import { api } from "@/utils/api";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Tip {
	_id: string;
	amount: number;
	performanceId: string;
	performanceTitle: string;
	fromUserId?: string;
	fromUserName?: string;
	isAnonymous: boolean;
	publicMessage?: string;
	createdAt: string;
	status: "pending" | "completed" | "failed";
}

interface Earnings {
	totalAmount: number;
	totalNet: number;
	totalFees: number;
	transactionCount: number;
	averageAmount: number;
}

interface Performance {
	_id: string;
	title: string;
	description: string;
	genre: string;
	status: "scheduled" | "live" | "completed" | "cancelled";
	startTime: string;
	endTime?: string;
	location: {
		address: string;
		coordinates: [number, number];
	};
	likes: number;
	views: number;
	createdAt: string;
}

export function Profile() {
	const { user, isSignedIn } = useUser();
	const [tips, setTips] = useState<Tip[]>([]);
	const [earnings, setEarnings] = useState<Earnings | null>(null);
	const [performances, setPerformances] = useState<Performance[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isSignedIn && user) {
			fetchUserData();
		}
	}, [isSignedIn, user]);

	const fetchUserData = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Fetch user's tips and earnings using the api utility
			const earningsResponse = await api.get("/payments/earnings");
			setEarnings(earningsResponse.data.data.earnings);
			setTips(earningsResponse.data.data.transactions || []);

			// Fetch user performances
			const performancesResponse = await api.get(
				"/performances/my/performances",
			);
			setPerformances(performancesResponse.data.data || []);
		} catch (err: any) {
			setError(err.message || "Failed to load profile data");
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

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "scheduled":
				return "text-blue-400";
			case "live":
				return "text-green-400";
			case "completed":
				return "text-gray-400";
			case "cancelled":
				return "text-red-400";
			default:
				return "text-gray-400";
		}
	};

	if (!isSignedIn) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						Please sign in to view your profile
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
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50"
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
								className="text-gray-300 hover:text-white transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-sm"
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
				{/* Profile Header */}
				<div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
					<div className="flex items-center space-x-6">
						<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
							<span className="text-2xl font-bold text-white">
								{user?.fullName?.[0] || user?.username?.[0] || "U"}
							</span>
						</div>
						<div>
							<h1 className="text-2xl font-bold text-white">
								{user?.fullName || user?.username || "User"}
							</h1>
							<p className="text-gray-400">
								{user?.emailAddresses?.[0]?.emailAddress}
							</p>
							<div className="flex items-center space-x-4 mt-2">
								<span className="text-sm text-gray-500">
									Member since{" "}
									{new Date(user?.createdAt || "").toLocaleDateString()}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Earnings Summary */}
				{isLoading ? (
					<div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
						<div className="animate-pulse">
							<div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{Array.from({ length: 3 }).map((_, i) => (
									<div key={i} className="h-20 bg-gray-700 rounded"></div>
								))}
							</div>
						</div>
					</div>
				) : error ? (
					<div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-8">
						<p className="text-red-400">{error}</p>
						<button
							onClick={fetchUserData}
							className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
						>
							Retry
						</button>
					</div>
				) : earnings ? (
					<div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
						<h2 className="text-xl font-bold text-white mb-6">
							💰 Earnings Summary
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-gray-700/50 rounded-lg p-4">
								<div className="text-2xl font-bold text-green-400">
									{formatCurrency(earnings.totalNet || 0)}
								</div>
								<div className="text-sm text-gray-400">Net Earnings</div>
							</div>
							<div className="bg-gray-700/50 rounded-lg p-4">
								<div className="text-2xl font-bold text-blue-400">
									{formatCurrency(earnings.totalAmount)}
								</div>
								<div className="text-sm text-gray-400">Total Tips</div>
							</div>
							<div className="bg-gray-700/50 rounded-lg p-4">
								<div className="text-2xl font-bold text-purple-400">
									{earnings.transactionCount}
								</div>
								<div className="text-sm text-gray-400">Total Tips Received</div>
							</div>
						</div>
						<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="bg-gray-700/50 rounded-lg p-4">
								<div className="text-lg font-semibold text-yellow-400">
									{formatCurrency(earnings.averageAmount || 0)}
								</div>
								<div className="text-sm text-gray-400">Average Tip</div>
							</div>
							<div className="bg-gray-700/50 rounded-lg p-4">
								<div className="text-lg font-semibold text-red-400">
									{formatCurrency(earnings.totalFees || 0)}
								</div>
								<div className="text-sm text-gray-400">Processing Fees</div>
							</div>
						</div>
					</div>
				) : null}

				{/* Tips History */}
				<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<h2 className="text-xl font-bold text-white mb-6">🎭 Recent Tips</h2>

					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="animate-pulse">
									<div className="h-16 bg-gray-700 rounded"></div>
								</div>
							))}
						</div>
					) : tips.length === 0 ? (
						<div className="text-center py-8">
							<div className="text-4xl mb-4">💸</div>
							<h3 className="text-lg font-semibold text-white mb-2">
								No tips received yet
							</h3>
							<p className="text-gray-400 mb-4">
								Start performing to receive tips from your audience!
							</p>
							<Link to="/create-performance" className="btn-primary">
								Create Your First Performance
							</Link>
						</div>
					) : (
						<div className="space-y-4">
							{tips.map((tip) => (
								<div
									key={tip._id}
									className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center space-x-3 mb-2">
												<span className="text-lg font-bold text-green-400">
													{formatCurrency(tip.amount)}
												</span>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${
														tip.status === "completed"
															? "bg-green-900/20 text-green-400"
															: tip.status === "pending"
																? "bg-yellow-900/20 text-yellow-400"
																: "bg-red-900/20 text-red-400"
													}`}
												>
													{tip.status.toUpperCase()}
												</span>
											</div>
											<div className="text-white font-medium mb-1">
												Tip for: {tip.performanceTitle}
											</div>
											<div className="text-sm text-gray-400">
												From:{" "}
												{tip.isAnonymous
													? "Anonymous"
													: tip.fromUserName || "Unknown"}
											</div>
											{tip.publicMessage && (
												<div className="text-sm text-gray-300 mt-2 italic">
													"{tip.publicMessage}"
												</div>
											)}
											<div className="text-xs text-gray-500 mt-2">
												{formatDate(tip.createdAt)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* My Performances */}
				<div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-xl font-bold text-white">🎭 My Performances</h2>
						<Link
							to="/create-performance"
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
						>
							Create New Performance
						</Link>
					</div>

					{isLoading ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="animate-pulse">
									<div className="h-20 bg-gray-700 rounded"></div>
								</div>
							))}
						</div>
					) : performances.length === 0 ? (
						<div className="text-center py-8">
							<div className="text-4xl mb-4">🎪</div>
							<h3 className="text-lg font-semibold text-white mb-2">
								No performances yet
							</h3>
							<p className="text-gray-400 mb-4">
								Create your first performance to start earning tips!
							</p>
							<Link to="/create-performance" className="btn-primary">
								Create Your First Performance
							</Link>
						</div>
					) : (
						<div className="space-y-4">
							{performances.map((performance) => (
								<div
									key={performance._id}
									className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors duration-200"
								>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center space-x-3 mb-2">
												<h3 className="text-lg font-semibold text-white">
													{performance.title}
												</h3>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
														performance.status,
													)} bg-gray-800`}
												>
													{performance.status.toUpperCase()}
												</span>
											</div>
											<p className="text-gray-300 text-sm mb-2 line-clamp-2">
												{performance.description}
											</p>
											<div className="flex items-center space-x-4 text-sm text-gray-400">
												<span className="flex items-center space-x-1">
													<span>🎵</span>
													<span>{performance.genre || "Unknown"}</span>
												</span>
												{performance.location?.address && (
													<span className="flex items-center space-x-1">
														<span>📍</span>
														<span>{performance.location.address}</span>
													</span>
												)}
												<span className="flex items-center space-x-1">
													<span>👀</span>
													<span>{performance.views || 0} views</span>
												</span>
												<span className="flex items-center space-x-1">
													<span>❤️</span>
													<span>{performance.likes || 0} likes</span>
												</span>
											</div>
											<div className="text-xs text-gray-500 mt-2">
												{formatDate(performance.startTime)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
