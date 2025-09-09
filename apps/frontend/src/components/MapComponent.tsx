import type { Performance } from "@spm/shared-types";
import {
	APIProvider,
	AdvancedMarker,
	Map,
	useMap,
} from "@vis.gl/react-google-maps";
import { useCallback, useRef, useEffect } from "react";

interface MapComponentProps {
	userLocation: [number, number];
	performances: Performance[];
	filters: {
		genre: string;
		timeRange: string;
		distance: number;
		popularity: string;
	};
	onPerformanceClick: (performance: Performance) => void;
	onMapRef?: (
		mapRef: any,
		panToPerformance: (performance: Performance) => void,
	) => void;
}

interface PerformanceStopMarkerProps {
	performance: Performance;
	stop: any;
	stopIndex: number;
	totalStops: number;
	onClick: () => void;
}

function PerformanceStopMarker({
	performance,
	stop,
	stopIndex: _stopIndex,
	totalStops: _totalStops,
	onClick,
}: PerformanceStopMarkerProps) {
	const position = {
		lat: stop.location.coordinates[1],
		lng: stop.location.coordinates[0],
	};

	const getStopColor = () => {
		if (stop.status === "active") return "#ef4444"; // red
		if (stop.status === "completed") return "#6b7280"; // gray
		return "#3b82f6"; // blue for scheduled
	};

	const getGenreIcon = () => {
		switch (performance.genre) {
			case "jazz":
				return "🎷";
			case "rock":
				return "🎸";
			case "folk":
				return "🪕";
			case "pop":
				return "🎤";
			case "classical":
				return "🎻";
			case "blues":
				return "🎵";
			case "country":
				return "🤠";
			case "electronic":
				return "🎧";
			case "hip-hop":
				return "🎤";
			case "reggae":
				return "🌴";
			default:
				return "🎵";
		}
	};

	return (
		<AdvancedMarker position={position} onClick={onClick}>
			<div
				className="bg-white rounded-full p-1 shadow-lg border-2 cursor-pointer hover:scale-110 transition-transform"
				style={{ borderColor: getStopColor() }}
			>
				<div className="text-lg">{getGenreIcon()}</div>
			</div>
		</AdvancedMarker>
	);
}

// PerformanceRouteLine component removed - not used

// Inner component that has access to the map instance
function MapController({
	onMapRef,
	panToPerformance,
}: {
	onMapRef?: (
		mapRef: any,
		panToPerformance: (performance: Performance) => void,
	) => void;
	panToPerformance: (performance: Performance) => void;
}) {
	const map = useMap();

	useEffect(() => {
		if (map && onMapRef) {
			onMapRef(map, panToPerformance);
		}
	}, [map, onMapRef, panToPerformance]);

	return null;
}

export function MapComponent({
	userLocation,
	performances,
	filters,
	onPerformanceClick,
	onMapRef,
}: MapComponentProps) {
	const mapRef = useRef<any>(null);

	const panToPerformance = useCallback((performance: Performance) => {
		const currentStop =
			performance.route.stops.find((stop) => stop.status === "active") ||
			performance.route.stops[0];

		const newCenter = {
			lat: currentStop.location.coordinates[1],
			lng: currentStop.location.coordinates[0],
		};

		// Use the map instance for smooth animation
		if (mapRef.current) {
			// Pan to the location with smooth animation
			mapRef.current.panTo(newCenter);

			// Set zoom with slower animation
			setTimeout(() => {
				if (mapRef.current) {
					mapRef.current.setZoom(16);
				}
			}, 500); // Slower zoom animation
		}
	}, []);

	// Update the map ref when it's available
	const handleMapRef = useCallback(
		(map: any, panFn: (performance: Performance) => void) => {
			mapRef.current = map;
			if (onMapRef) {
				onMapRef(map, panFn);
			}
		},
		[onMapRef],
	);

	const handleMarkerClick = useCallback(
		(performance: Performance) => {
			panToPerformance(performance);
			onPerformanceClick(performance);
		},
		[onPerformanceClick, panToPerformance],
	);

	// Filter performances based on current filters
	const filteredPerformances = performances.filter((performance) => {
		if (filters.genre !== "all" && performance.genre !== filters.genre) {
			return false;
		}

		// Add more filtering logic here as needed
		return true;
	});

	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

	if (!apiKey) {
		console.error("Google Maps API key is missing!");
		return (
			<div className="w-full h-full flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="text-4xl mb-4">🗺️</div>
					<p className="text-gray-600">Google Maps API key is missing</p>
				</div>
			</div>
		);
	}

	return (
		<div style={{ width: "100%", height: "100%", position: "relative" }}>
			<APIProvider apiKey={apiKey}>
				<Map
					defaultCenter={{ lat: userLocation[1], lng: userLocation[0] }}
					defaultZoom={14}
					gestureHandling="greedy"
					disableDefaultUI={false}
					mapId="street-performers-map"
					zoomControl={true}
					mapTypeControl={false}
					streetViewControl={false}
					fullscreenControl={true}
					clickableIcons={true}
					style={{ width: "100%", height: "100%" }}
				>
					<MapController
						onMapRef={handleMapRef}
						panToPerformance={panToPerformance}
					/>
					{/* User location marker */}
					<AdvancedMarker
						position={{ lat: userLocation[1], lng: userLocation[0] }}
					>
						<div className="bg-blue-600 rounded-full p-1 shadow-lg border-2 border-white">
							<div className="text-white text-lg">📍</div>
						</div>
					</AdvancedMarker>

					{/* Performance markers */}
					{filteredPerformances.map((performance) =>
						performance.route.stops.map((stop, stopIndex) => (
							<PerformanceStopMarker
								key={`${performance._id}-${stopIndex}`}
								performance={performance}
								stop={stop}
								stopIndex={stopIndex}
								totalStops={performance.route.stops.length}
								onClick={() => handleMarkerClick(performance)}
							/>
						)),
					)}
				</Map>
			</APIProvider>
		</div>
	);
}
