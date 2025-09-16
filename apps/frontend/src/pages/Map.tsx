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
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

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
							<Button
								onClick={() => setUserLocation([-73.9712, 40.7831])}
								size="sm"
							>
								📍 Continue with New York City
							</Button>
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
								<Button
									variant={showFilters ? "default" : "ghost"}
									size="sm"
									onClick={() => setShowFilters(!showFilters)}
									title="Filters"
								>
									<Filter className="w-4 h-4" />
								</Button>

								<Button
									variant={showList ? "default" : "ghost"}
									size="sm"
									onClick={() => setShowList(!showList)}
									title="List View"
								>
									<List className="w-4 h-4" />
								</Button>
							</div>

							{/* User Menu */}
							{isSignedIn ? (
								<div className="flex items-center space-x-2">
									<Button
										variant="outline"
										size="sm"
										asChild
										className="hidden md:flex"
									>
										<Link to="/profile">
											<span>👤</span>
											<span className="hidden lg:block ml-2">Profile</span>
										</Link>
									</Button>

									<Button
										size="sm"
										asChild
									>
										<Link to="/create-performance">
											<Plus className="w-4 h-4" />
											<span className="hidden sm:block ml-2">Create</span>
										</Link>
									</Button>
								</div>
							) : (
								<Button asChild>
									<Link to="/">
										Sign In
									</Link>
								</Button>
							)}
						</div>

						{/* Mobile Hamburger Menu */}
						<div className="md:hidden">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowMobileMenu(!showMobileMenu)}
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</Button>
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
									<Button
										variant={showFilters ? "default" : "outline"}
										size="sm"
										className="flex-1"
										onClick={() => {
											setShowFilters(!showFilters);
											setShowMobileMenu(false);
										}}
									>
										<Filter className="w-4 h-4" />
										<span className="ml-2">Filters</span>
									</Button>

									<Button
										variant={showList ? "default" : "outline"}
										size="sm"
										className="flex-1"
										onClick={() => {
											setShowList(!showList);
											setShowMobileMenu(false);
										}}
									>
										<List className="w-4 h-4" />
										<span className="ml-2">List</span>
									</Button>
								</div>

								{/* User Actions */}
								{isSignedIn ? (
									<div className="space-y-2">
										<div className="flex space-x-2">
											<Button
												variant="outline"
												size="sm"
												className="flex-1"
												asChild
											>
												<Link to="/profile" onClick={() => setShowMobileMenu(false)}>
													<span>👤</span>
													<span className="ml-2">Profile</span>
												</Link>
											</Button>
											<Button
												size="sm"
												className="flex-1"
												asChild
											>
												<Link to="/create-performance" onClick={() => setShowMobileMenu(false)}>
													<Plus className="w-4 h-4" />
													<span className="ml-2">Create</span>
												</Link>
											</Button>
										</div>
									</div>
								) : (
									<Button
										className="w-full"
										asChild
									>
										<Link to="/" onClick={() => setShowMobileMenu(false)}>
											Sign In
										</Link>
									</Button>
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

					{/* Performances Drawer */}
					<Drawer open={showList} onOpenChange={setShowList}>
						<DrawerContent className="max-h-[85vh]">
							<DrawerHeader className="pb-4">
								<DrawerTitle className="text-xl font-bold text-center">
									🎭 Nearby Performances
								</DrawerTitle>
								<DrawerDescription className="text-center text-muted-foreground">
									{performances.length} performance{performances.length !== 1 ? 's' : ''} found
								</DrawerDescription>
							</DrawerHeader>

							<div className="px-4 pb-8 overflow-y-auto">
								{performancesLoading ? (
									<div className="space-y-4">
										{Array.from({ length: 3 }).map((_, index) => (
											<PerformanceSkeleton key={index} />
										))}
									</div>
								) : performances.length === 0 ? (
									<div className="text-center py-12">
										<div className="text-6xl mb-4">🎭</div>
										<h3 className="text-lg font-semibold text-foreground mb-2">
											No performances found
										</h3>
										<p className="text-muted-foreground">
											Try adjusting your filters or check back later for live performances!
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{performances.map((performance, index) => (
											<div
												key={performance._id || index}
												className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-all duration-200 shadow-sm"
												onClick={() => {
													handlePerformanceClick(performance);
													setShowList(false);
												}}
											>
												<div className="flex items-start justify-between mb-3">
													<div className="flex-1 min-w-0">
														<h4 className="font-semibold text-foreground text-lg mb-1">
															{performance.title}
														</h4>
														<p className="text-muted-foreground text-sm capitalize mb-2">
															🎵 {performance.genre}
														</p>
													</div>
													<Badge
														variant={performance.status === "live" ? "destructive" : "default"}
														className="ml-2"
													>
														{performance.status === "live" ? "🔴 LIVE" : "📅 SCHEDULED"}
													</Badge>
												</div>

												{/* Performance Details */}
												<div className="space-y-2 mb-3">
													<div className="flex items-center text-sm text-muted-foreground">
														<span className="mr-2">📍</span>
														<span className="truncate">
															{performance.route.stops[0]?.location.name ||
															 performance.route.stops[0]?.location.address ||
															 'Location not specified'}
														</span>
													</div>
													<div className="flex items-center text-sm text-muted-foreground">
														<span className="mr-2">🕐</span>
														<span>
															{new Date(performance.scheduledFor).toLocaleDateString()} at{" "}
															{new Date(performance.scheduledFor).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</span>
													</div>
												</div>

												{/* Engagement Stats */}
												<div className="flex items-center justify-between pt-2 border-t border-border">
													<div className="flex items-center space-x-4">
														<span className="text-sm text-muted-foreground flex items-center">
															❤️ {performance.engagement?.likes || 0}
														</span>
														<span className="text-sm text-muted-foreground flex items-center">
															👀 {performance.engagement?.views || 0}
														</span>
													</div>
													<Button
														size="sm"
														variant="outline"
														onClick={(e) => {
															e.stopPropagation();
															const currentStop = performance.route.stops.find(
																(stop) => stop.status === "active",
															) || performance.route.stops[0];
															const url = `https://www.google.com/maps/dir/?api=1&destination=${currentStop.location.coordinates[1]},${currentStop.location.coordinates[0]}`;
															window.open(url, "_blank");
														}}
													>
														🧭 Directions
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</DrawerContent>
					</Drawer>
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
