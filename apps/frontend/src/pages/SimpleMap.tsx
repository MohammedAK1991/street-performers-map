import { GoogleMap } from "@/components/GoogleMap";
import { PerformanceDetailModal } from "@/components/PerformanceDetailModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
	useLikePerformance,
	useNearbyPerformances,
} from "@/hooks/usePerformances";
import { useUser } from "@clerk/clerk-react";
import type { Performance } from "@spm/shared-types";
import { useState } from "react";
import { Link } from "react-router-dom";

export function SimpleMap() {
	const { user: clerkUser, isSignedIn } = useUser();
	const [showFilters, setShowFilters] = useState(false);
	const [selectedGenre, setSelectedGenre] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPerformance, setSelectedPerformance] =
		useState<Performance | null>(null);

	// Get user's actual location
	const {
		location: userLocation,
		loading: locationLoading,
		error: locationError,
		requestLocation,
	} = useGeolocation();

	// Default location (Madrid) - fallback if geolocation fails
	const defaultLocation = { lat: 40.4168, lng: -3.7038 };

	// Use user's location if available, otherwise fallback to default
	const mapCenter = userLocation || defaultLocation;

	// TanStack Query hooks
	const {
		data: performances = [],
		isLoading,
		error,
		refetch,
	} = useNearbyPerformances(mapCenter, 10, {
		genre: selectedGenre === "all" ? undefined : selectedGenre,
		search: searchTerm || undefined,
	});

	// Debug logging
	console.log("Filter state:", { selectedGenre, searchTerm });
	console.log("Performances:", performances.length, "items");

	const likePerformanceMutation = useLikePerformance();

	// Filter performances based on search term
	const filteredPerformances = performances.filter((perf) => {
		if (!searchTerm) return true;
		const searchLower = searchTerm.toLowerCase();
		return (
			perf.title.toLowerCase().includes(searchLower) ||
			perf.genre.toLowerCase().includes(searchLower) ||
			perf.route.stops.some((stop) =>
				stop.location.address.toLowerCase().includes(searchLower),
			)
		);
	});

	const handlePerformanceClick = (performance: Performance) => {
		setSelectedPerformance(performance);
	};

	const handleLike = async (performanceId: string) => {
		if (!isSignedIn) {
			alert("Please login to like performances");
			return;
		}

		try {
			await likePerformanceMutation.mutateAsync({ performanceId });
		} catch (error) {
			console.error("Failed to like performance:", error);
		}
	};

	const formatTime = (date: Date | string) => {
		return new Date(date).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-4">
							<Link to="/" className="text-xl font-bold text-purple-600">
								🎵 StreetPerformersMap
							</Link>

							<input
								type="text"
								placeholder="Search performances..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="hidden md:block w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
							/>
						</div>

						<div className="flex items-center space-x-4">
							<button
								type="button"
								onClick={() => setShowFilters(!showFilters)}
								className="btn-secondary"
							>
								🎭 Filters
							</button>

							{isSignedIn ? (
								<div className="flex items-center space-x-2">
									<span className="text-sm text-gray-600">
										Welcome,{" "}
										{clerkUser?.fullName || clerkUser?.username || "User"}!
									</span>
									<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
										<span className="text-white text-sm font-medium">
											{(clerkUser?.fullName ||
												clerkUser?.username ||
												"U")?.[0]?.toUpperCase()}
										</span>
									</div>
									<button
										onClick={() => {
											// Clerk handles logout automatically
											window.location.href = "/";
										}}
										className="text-sm text-gray-500 hover:text-gray-700"
									>
										Logout
									</button>
								</div>
							) : (
								<div className="flex space-x-2">
									<Link to="/login" className="btn-secondary">
										Login
									</Link>
									<Link to="/signup" className="btn-primary">
										Sign Up
									</Link>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Filters */}
				{showFilters && (
					<div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
						<h3 className="font-semibold text-gray-900 mb-3">
							🎵 Filter by Genre
						</h3>
						<div className="flex flex-wrap gap-2">
							{["all", "jazz", "rock", "folk", "pop", "classical"].map(
								(genre) => (
									<button
										type="button"
										key={genre}
										onClick={() => setSelectedGenre(genre)}
										className={`px-3 py-1 rounded-full text-sm ${
											selectedGenre === genre
												? "bg-purple-600 text-white"
												: "bg-gray-100 text-gray-700 hover:bg-gray-200"
										}`}
									>
										{genre.charAt(0).toUpperCase() + genre.slice(1)}
									</button>
								),
							)}
						</div>
					</div>
				)}

				{/* Location Permission Request */}
				{!userLocation && !locationLoading && locationError && (
					<div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
						<div className="flex">
							<div className="ml-3">
								<p className="text-sm text-yellow-700">
									<strong>Location Access Required:</strong> {locationError}
								</p>
								<button
									type="button"
									onClick={requestLocation}
									className="mt-2 text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
								>
									Try Again
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Loading Location */}
				{locationLoading && (
					<div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
						<div className="flex">
							<div className="ml-3">
								<p className="text-sm text-blue-700">
									<strong>Getting your location...</strong> Please allow
									location access to see nearby performances.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Interactive Google Map */}
				<div className="bg-white rounded-lg shadow border border-gray-200 mb-8 p-4">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-bold text-gray-900">
							🗺️ Live Performance Map
						</h2>
						<div className="text-sm text-gray-600">
							📍 {userLocation ? "Your Location" : "Madrid (Default)"} • 🎭{" "}
							{filteredPerformances.length} performances nearby
						</div>
					</div>
					{isLoading ? (
						<div className="w-full h-96 rounded-lg bg-gray-100 flex items-center justify-center">
							<div className="text-center">
								<div className="animate-spin text-4xl mb-2">🔄</div>
								<p className="text-gray-600">Loading performances...</p>
							</div>
						</div>
					) : error ? (
						<div className="w-full h-96 rounded-lg bg-red-50 flex items-center justify-center">
							<div className="text-center">
								<div className="text-4xl mb-2">⚠️</div>
								<p className="text-red-600 mb-2">Failed to load performances</p>
								<p className="text-sm text-red-500">
									{error?.message || "Unknown error"}
								</p>
								<button
									type="button"
									onClick={() => refetch()}
									className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
								>
									Retry
								</button>
							</div>
						</div>
					) : (
						<GoogleMap
							performances={filteredPerformances}
							userLocation={userLocation}
							className="w-full h-96 rounded-lg"
							onPerformanceClick={handlePerformanceClick}
						/>
					)}
				</div>

				{/* Performance Cards */}
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredPerformances.map((performance) => {
						const firstStop = performance.route.stops[0];
						return (
							<button
								type="button"
								key={performance._id}
								className="w-full   bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer text-left"
								onClick={() => handlePerformanceClick(performance)}
								aria-label={`View details for ${performance.title}`}
							>
								<div className="p-6">
									{/* Status Badge */}
									<div className="flex justify-between items-start mb-4">
										<span
											className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${performance.status === "live" ? "bg-green-100 text-green-800" : ""}
                      ${performance.status === "scheduled" ? "bg-blue-100 text-blue-800" : ""}
                      ${performance.status === "completed" ? "bg-gray-100 text-gray-800" : ""}
                      ${performance.status === "cancelled" ? "bg-red-100 text-red-800" : ""}
                    `}
										>
											{performance.status === "live" && "🔴 LIVE NOW"}
											{performance.status === "scheduled" && "🔵 SCHEDULED"}
											{performance.status === "completed" && "⚫ COMPLETED"}
											{performance.status === "cancelled" && "🚫 CANCELLED"}
										</span>
										<div className="text-right">
											<p className="text-lg font-semibold text-gray-900">
												{performance.engagement.likes} ❤️
											</p>
										</div>
									</div>

									{/* Performance Info */}
									<h3 className="text-lg font-bold text-gray-900 mb-2">
										{performance.title}
									</h3>
									<p className="text-sm text-gray-600 mb-2">Performance</p>
									<p className="text-sm text-gray-500 mb-4">
										📍 {firstStop.location.address}
									</p>

									<div className="flex justify-between items-center text-sm text-gray-600 mb-4">
										<span>
											🎵{" "}
											{performance.genre.charAt(0).toUpperCase() +
												performance.genre.slice(1)}
										</span>
										<span>
											⏰ {formatTime(firstStop.startTime)} -{" "}
											{formatTime(firstStop.endTime)}
										</span>
									</div>

									{/* Action Buttons */}
									<div className="flex space-x-2">
										<button
											className="flex-1 btn-primary text-sm py-2"
											onClick={(e) => {
												e.stopPropagation();
												handleLike(performance._id);
											}}
										>
											❤️ Like
										</button>
										<button className="flex-1 btn-secondary text-sm py-2">
											🧭 Directions
										</button>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{/* Create Performance CTA */}
				{isSignedIn && (
					<div className="mt-12 text-center">
						<div className="bg-white rounded-lg shadow border border-gray-200 p-8">
							<div className="text-4xl mb-4">🎭</div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								Ready to perform?
							</h3>
							<p className="text-gray-600 mb-6">
								Share your music with the world and build your audience!
							</p>
							<Link to="/create-performance" className="btn-primary">
								➕ Create Your First Performance
							</Link>
						</div>
					</div>
				)}

				{/* Empty State for Audience */}
				{isSignedIn && filteredPerformances.length === 0 && (
					<div className="mt-12 text-center">
						<div className="bg-white rounded-lg shadow border border-gray-200 p-8">
							<div className="text-4xl mb-4">🎵</div>
							<h3 className="text-xl font-bold text-gray-900 mb-4">
								No performances found
							</h3>
							<p className="text-gray-600 mb-6">
								Try adjusting your filters or check back later for new
								performances!
							</p>
							<button
								onClick={() => setSelectedGenre("all")}
								className="btn-secondary"
							>
								Clear Filters
							</button>
						</div>
					</div>
				)}

				{/* Performance Detail Modal */}
				{selectedPerformance && (
					<PerformanceDetailModal
						performance={selectedPerformance}
						isOpen={!!selectedPerformance}
						onClose={() => setSelectedPerformance(null)}
					/>
				)}
			</div>
		</div>
	);
}
