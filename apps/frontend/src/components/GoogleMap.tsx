import {
	APIProvider,
	AdvancedMarker,
	InfoWindow,
	Map,
} from "@vis.gl/react-google-maps";
import { useCallback, useState } from "react";

import type { Performance } from "@spm/shared-types";

interface GoogleMapProps {
	performances: Performance[];
	userLocation?: { lat: number; lng: number } | null;
	center?: { lat: number; lng: number };
	zoom?: number;
	className?: string;
	onPerformanceClick?: (performance: Performance) => void;
}

const DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 }; // Madrid, Spain
const DEFAULT_ZOOM = 13;

export function GoogleMap({
	performances,
	userLocation,
	center = DEFAULT_CENTER,
	zoom = DEFAULT_ZOOM,
	className = "w-full h-96",
	onPerformanceClick,
}: GoogleMapProps) {
	const [selectedPerformance, setSelectedPerformance] =
		useState<Performance | null>(null);

	const apiKey =
		import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
		"AIzaSyBhmTGuHg2to9E4hJSuX-cJUkzgtVeYSuA";

	if (!apiKey) {
		return (
			<div
				className={`${className} bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center`}
			>
				<div className="text-center">
					<div className="text-6xl mb-4">🗺️</div>
					<h3 className="text-2xl font-bold text-gray-900 mb-2">
						Google Maps API Key Required
					</h3>
					<p className="text-gray-600">
						Please add your Google Maps API key to the .env file
					</p>
				</div>
			</div>
		);
	}

	const handleMarkerClick = useCallback(
		(performance: Performance) => {
			if (onPerformanceClick) {
				onPerformanceClick(performance);
			} else {
				setSelectedPerformance(performance);
			}
		},
		[onPerformanceClick],
	);

	const handleCloseInfoWindow = useCallback(() => {
		setSelectedPerformance(null);
	}, []);

	const getMarkerIcon = (status: Performance["status"]) => {
		switch (status) {
			case "live":
				return "🔴"; // Live marker
			case "scheduled":
				return "🔵"; // Scheduled marker
			case "completed":
				return "⚫"; // Completed marker
			case "cancelled":
				return "🚫"; // Cancelled marker
			default:
				return "🎵"; // Default marker
		}
	};

	// Get the first location from the performance route
	const getPerformanceLocation = (performance: Performance) => {
		const firstStop = performance.route.stops[0];
		return {
			lat: firstStop.location.coordinates[1], // lat is second element
			lng: firstStop.location.coordinates[0], // lng is first element
		};
	};

	const formatDateTime = (date: Date | string) => {
		return new Date(date).toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	// Use user location as center if available, otherwise use provided center
	const mapCenter = userLocation || center;

	return (
		<APIProvider apiKey={apiKey}>
			<Map
				defaultCenter={mapCenter}
				defaultZoom={zoom}
				gestureHandling="greedy"
				disableDefaultUI={false}
				className={className}
				style={{ borderRadius: "8px" }}
				mapId="streetperformers-map"
			>
				{performances.map((performance) => {
					const location = getPerformanceLocation(performance);
					return (
						<AdvancedMarker
							key={performance._id}
							position={location}
							onClick={() => handleMarkerClick(performance)}
						>
							<div className="text-2xl cursor-pointer hover:scale-110 transition-transform">
								{getMarkerIcon(performance.status)}
							</div>
						</AdvancedMarker>
					);
				})}

				{/* User Location Marker */}
				{userLocation && (
					<AdvancedMarker position={userLocation}>
						<div className="relative">
							<div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
								<div className="w-3 h-3 bg-blue-400 rounded-full" />
							</div>
							<div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
								You are here
							</div>
						</div>
					</AdvancedMarker>
				)}

				{selectedPerformance && !onPerformanceClick && (
					<InfoWindow
						position={getPerformanceLocation(selectedPerformance)}
						onCloseClick={handleCloseInfoWindow}
					>
						<div className="p-3 max-w-sm">
							<div className="flex justify-between items-start mb-2">
								<span
									className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${selectedPerformance.status === "live" ? "bg-green-100 text-green-800" : ""}
                  ${selectedPerformance.status === "scheduled" ? "bg-blue-100 text-blue-800" : ""}
                  ${selectedPerformance.status === "completed" ? "bg-gray-100 text-gray-800" : ""}
                  ${selectedPerformance.status === "cancelled" ? "bg-red-100 text-red-800" : ""}
                `}
								>
									{selectedPerformance.status === "live" && "🔴 LIVE NOW"}
									{selectedPerformance.status === "scheduled" && "🔵 SCHEDULED"}
									{selectedPerformance.status === "completed" && "⚫ COMPLETED"}
									{selectedPerformance.status === "cancelled" && "🚫 CANCELLED"}
								</span>
								<span className="text-sm font-semibold text-gray-900">
									{selectedPerformance.engagement.likes} ❤️
								</span>
							</div>

							<h3 className="font-bold text-gray-900 mb-1">
								{selectedPerformance.title}
							</h3>
							<p className="text-sm text-gray-600 mb-1">Performance</p>
							<p className="text-sm text-gray-500 mb-2">
								📍 {selectedPerformance.route.stops[0].location.address}
							</p>

							<div className="flex justify-between items-center text-sm text-gray-600 mb-3">
								<span>🎵 {selectedPerformance.genre}</span>
								<span>
									⏰{" "}
									{formatDateTime(selectedPerformance.route.stops[0].startTime)}
								</span>
							</div>

							<div className="flex space-x-2">
								<button className="flex-1 bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700 transition-colors">
									❤️ Interested
								</button>
								<button className="flex-1 bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded hover:bg-gray-200 transition-colors">
									🧭 Directions
								</button>
							</div>
						</div>
					</InfoWindow>
				)}
			</Map>
		</APIProvider>
	);
}
