import { FilterPanel } from "@/components/FilterPanel";
import { MapComponent } from "@/components/MapComponent";
import { PerformanceModal } from "@/components/PerformanceModal";
import {
	FilterSkeleton,
	PerformanceSkeleton,
} from "@/components/PerformanceSkeleton";
import { useDebouncedFilters } from "@/hooks/useDebouncedFilters";
import { useNearbyPerformances } from "@/hooks/usePerformances";
import {
	filterPerformancesClientSide,
	shouldUseClientSideFiltering,
} from "@/utils/performanceFilters";
import { useUser } from "@clerk/clerk-react";
import type { Performance } from "@spm/shared-types";
import { Filter, List, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Map() {
	const { isSignedIn } = useUser();
	const [userLocation, setUserLocation] = useState<[number, number] | null>(
		null,
	);
	const [locationPermission, setLocationPermission] = useState<
		"granted" | "denied" | "prompt"
	>("prompt");
	const [showFilters, setShowFilters] = useState(false);
	const [showList, setShowList] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [selectedPerformance, setSelectedPerformance] =
		useState<Performance | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [mapPanToPerformance, setMapPanToPerformance] = useState<
		((performance: Performance) => void) | null
	>(null);

	// Use debounced filters to prevent excessive API calls
	const { filters, apiFilters, setFilters, isDebouncing } = useDebouncedFilters(
		{
			genre: "all",
			timeRange: "all",
			distance: 25,
			popularity: "all",
		},
	);

	// Determine if we should use client-side filtering
	const useClientSideFiltering = shouldUseClientSideFiltering({
		genre: filters.genre,
		popularity: filters.popularity,
		distance: filters.distance,
	});

	// Fetch nearby performances using real API
	const {
		data: nearbyPerformances = [],
		isLoading: performancesLoading,
		error: performancesError,
	} = useNearbyPerformances(
		userLocation
			? { lat: userLocation[1], lng: userLocation[0] }
			: { lat: 40.7831, lng: -73.9712 }, // Default NYC
		useClientSideFiltering ? 25 : filters.distance, // Use max distance for client-side filtering
		useClientSideFiltering ? {} : apiFilters, // Only send server-side filters
	);

	// Apply client-side filtering if needed
	const filteredPerformances = useClientSideFiltering
		? filterPerformancesClientSide(
				nearbyPerformances,
				{
					genre: filters.genre,
					popularity: filters.popularity,
					distance: filters.distance,
				},
				userLocation || undefined,
			)
		: nearbyPerformances;

	// Use filtered performances directly
	const performances = filteredPerformances;

	// Modal handlers
	const handlePerformanceClick = (performance: Performance) => {
		// Pan and zoom to the performance location first
		if (mapPanToPerformance) {
			mapPanToPerformance(performance);
		}

		// Then open the modal
		setSelectedPerformance(performance);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedPerformance(null);
	};

	// Request location permission
	useEffect(() => {
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setUserLocation([
						position.coords.longitude,
						position.coords.latitude,
					]);
					setLocationPermission("granted");
				},
				(error) => {
					console.error("Location error:", error);
					setLocationPermission("denied");
					// Default to NYC for demo
					setUserLocation([-73.9712, 40.7831]);
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000, // 5 minutes
				},
			);
		} else {
			setLocationPermission("denied");
			setUserLocation([-73.9712, 40.7831]); // Default to NYC
		}
	}, []);

	// Enhanced loading state with performance feedback
	if (!userLocation || performancesLoading || isDebouncing) {
		const loadingSteps = [
			{ step: 1, label: "Getting your location...", complete: !!userLocation },
			{
				step: 2,
				label: isDebouncing
					? "Applying filters..."
					: "Loading nearby performances...",
				complete: !performancesLoading && !!userLocation && !isDebouncing,
			},
			{
				step: 3,
				label: "Preparing map...",
				complete: !performancesLoading && !!userLocation && !isDebouncing,
			},
		];

		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="text-6xl mb-6 animate-bounce">🎵</div>
					<h2 className="text-3xl font-bold text-foreground mb-6">
						Loading StreetPerformersMap
					</h2>

					{/* Loading steps */}
					<div className="space-y-4 mb-6">
						{loadingSteps.map(({ step, label, complete }) => (
							<div
								key={step}
								className="flex items-center justify-center space-x-3"
							>
								<div
									className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
										complete
											? "bg-green-500 border-green-500 text-white"
											: step <= 2
												? "border-primary text-primary"
												: "border-muted text-muted-foreground"
									}`}
								>
									{complete ? "✓" : step}
								</div>
								<span
									className={`text-sm ${complete ? "text-green-600" : "text-muted-foreground"}`}
								>
									{label}
								</span>
							</div>
						))}
					</div>

					{/* Error handling */}
					{performancesError && (
						<div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
							<p className="text-yellow-400 text-sm">
								Unable to load live performances. Showing demo data.
							</p>
						</div>
					)}

					{locationPermission === "denied" && (
						<div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
							<p className="text-primary text-sm mb-3">
								Location access denied. You can still browse the map!
							</p>
							<button
								onClick={() => setUserLocation([-73.9712, 40.7831])}
								className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm transition-colors"
							>
								📍 Continue with New York City
							</button>
						</div>
					)}

					{/* Quick stats during loading */}
					<div className="mt-8 text-sm text-muted-foreground">
						<p>🎭 Connecting street performers worldwide</p>
						<p>🌍 Real-time performance discovery</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex flex-col overflow-hidden bg-background">
			{/* Header */}
			<header className="bg-background/95 backdrop-blur-sm shadow-lg border-b border-border z-20">
				<div className="px-4 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Logo */}
						<div className="flex items-center flex-shrink-0">
							<Link
								to="/"
								className="flex items-center space-x-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
							>
								<span className="text-3xl">🎵</span>
								<span className="hidden sm:block">StreetPerformersMap</span>
							</Link>
						</div>

						{/* Center Navigation */}
						<div className="hidden md:flex items-center space-x-6">
							<Link
								to="/map"
								className="text-sm font-medium text-foreground hover:text-primary transition-colors"
							>
								Map
							</Link>
							<Link
								to="/artists"
								className="text-sm font-medium text-foreground hover:text-primary transition-colors"
							>
								Artists
							</Link>
						</div>

						{/* Right Side Actions */}
						<div className="flex items-center space-x-3">

							{/* Controls */}
							<div className="hidden md:flex items-center space-x-2">
								<button
									type="button"
									onClick={() => setShowFilters(!showFilters)}
									className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
										showFilters
											? "bg-primary text-primary-foreground"
											: "text-foreground hover:bg-muted"
									}`}
									title="Filters"
								>
									<Filter className="w-4 h-4" />
								</button>

								<button
									type="button"
									onClick={() => setShowList(!showList)}
									className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
										showList
											? "bg-primary text-primary-foreground"
											: "text-foreground hover:bg-muted"
									}`}
									title="List View"
								>
									<List className="w-4 h-4" />
								</button>
							</div>

							{/* User Menu */}
							{isSignedIn ? (
								<div className="flex items-center space-x-2">
									<Link
										to="/profile"
										className="hidden md:flex bg-card hover:bg-muted text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-2"
									>
										<span>👤</span>
										<span className="hidden lg:block">Profile</span>
									</Link>

									<Link
										to="/create-performance"
										className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
									>
										<Plus className="w-4 h-4" />
										<span className="hidden sm:block">Create</span>
									</Link>
								</div>
							) : (
								<Link
									to="/"
									className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
								>
									Sign In
								</Link>
							)}
						</div>

						{/* Mobile Hamburger Menu */}
						<div className="md:hidden">
							<button
								type="button"
								onClick={() => setShowMobileMenu(!showMobileMenu)}
								className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>
					</div>

					{/* Mobile Menu Dropdown */}
					{showMobileMenu && (
						<div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
							<div className="px-4 py-4 space-y-4">
								{/* Navigation Links */}
								<div className="space-y-2">
									<Link
										to="/map"
										onClick={() => setShowMobileMenu(false)}
										className="block text-foreground hover:text-primary transition-colors py-2"
									>
										Map
									</Link>
									<Link
										to="/artists"
										onClick={() => setShowMobileMenu(false)}
										className="block text-foreground hover:text-primary transition-colors py-2"
									>
										Artists
									</Link>
								</div>


								{/* Filter and List Toggles */}
								<div className="flex space-x-2">
									<button
										type="button"
										onClick={() => {
											setShowFilters(!showFilters);
											setShowMobileMenu(false);
										}}
										className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
											showFilters
												? "bg-primary text-primary-foreground"
												: "bg-card text-foreground border border-border hover:bg-muted"
										}`}
									>
										<Filter className="w-4 h-4" />
										<span>Filters</span>
									</button>

									<button
										type="button"
										onClick={() => {
											setShowList(!showList);
											setShowMobileMenu(false);
										}}
										className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
											showList
												? "bg-primary text-primary-foreground"
												: "bg-card text-foreground border border-border hover:bg-muted"
										}`}
									>
										<List className="w-4 h-4" />
										<span>List</span>
									</button>
								</div>

								{/* User Actions */}
								{isSignedIn ? (
									<div className="space-y-2">
										<div className="flex space-x-2">
											<Link
												to="/profile"
												onClick={() => setShowMobileMenu(false)}
												className="flex-1 bg-card hover:bg-muted text-foreground border border-border px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
											>
												<span>👤</span>
												<span>Profile</span>
											</Link>
											<Link
												to="/create-performance"
												onClick={() => setShowMobileMenu(false)}
												className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
											>
												<Plus className="w-4 h-4" />
												<span>Create</span>
											</Link>
										</div>
									</div>
								) : (
									<Link
										to="/"
										onClick={() => setShowMobileMenu(false)}
										className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
									>
										Sign In
									</Link>
								)}
							</div>
						</div>
					)}
				</div>
			</header>

			{/* Main Content */}
			<div className="flex-1 relative overflow-hidden">
				{/* Map */}
				<div
					className="h-full w-full overflow-hidden relative"
					style={{ minHeight: "calc(100vh - 80px)" }}
				>
					<MapComponent
						userLocation={userLocation}
						performances={performances}
						filters={filters}
						onPerformanceClick={handlePerformanceClick}
						onMapRef={(_, panToPerformance) => {
							setMapPanToPerformance(() => panToPerformance);
						}}
					/>

					{/* Filter Panel (when showFilters is true) */}
					{showFilters && (
						<div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto sm:w-80 z-10 bg-card border border-border rounded-lg shadow-lg p-3 sm:p-4">
							{performancesLoading ? (
								<FilterSkeleton />
							) : (
								<FilterPanel
									filters={filters}
									onFiltersChange={setFilters}
									onClose={() => setShowFilters(false)}
								/>
							)}
						</div>
					)}

					{/* Performances Panel (when showList is true) */}
					{showList && (
						<div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-auto sm:right-4 sm:w-80 z-10 bg-card border border-border rounded-lg shadow-lg p-3 sm:p-4">
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-base sm:text-lg font-semibold text-foreground">
									Performances
								</h3>
								<button
									type="button"
									onClick={() => setShowList(false)}
									className="text-muted-foreground hover:text-foreground p-1"
								>
									✕
								</button>
							</div>

							{performancesLoading ? (
								<div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
									{Array.from({ length: 3 }).map((_, index) => (
										<PerformanceSkeleton key={index} />
									))}
								</div>
							) : performances.length === 0 ? (
								<div className="text-center py-6 sm:py-8">
									<div className="text-3xl sm:text-4xl mb-3">🎭</div>
									<p className="text-muted-foreground text-xs sm:text-sm">
										No performances found. Try adjusting your filters or check
										back later!
									</p>
								</div>
							) : (
								<div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
									{performances.slice(0, 5).map((performance, index) => (
										<div
											key={performance._id || index}
											className="p-2 sm:p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
											onClick={() => handlePerformanceClick(performance)}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													<h4 className="font-medium text-foreground text-xs sm:text-sm truncate">
														{performance.title}
													</h4>
													<p className="text-xs text-muted-foreground mt-1">
														{performance.genre}
													</p>
													<div className="flex items-center gap-1 sm:gap-2 mt-2">
														<span
															className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
																performance.status === "live"
																	? "bg-red-500/20 text-red-400"
																	: "bg-blue-500/20 text-blue-400"
															}`}
														>
															{performance.status === "live"
																? "LIVE"
																: "SCHEDULED"}
														</span>
														<span className="text-xs text-muted-foreground">
															{performance.engagement?.likes || 0} ❤️
														</span>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Performance Modal */}
			{selectedPerformance && (
				<PerformanceModal
					performance={selectedPerformance}
					isOpen={isModalOpen}
					onClose={handleCloseModal}
				/>
			)}
		</div>
	);
}
