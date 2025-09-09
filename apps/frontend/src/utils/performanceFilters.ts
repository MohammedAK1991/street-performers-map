import type { Performance } from "@spm/shared-types";

export interface ClientSideFilters {
	genre?: string;
	popularity?: string;
	distance?: number;
}

export function filterPerformancesClientSide(
	performances: Performance[],
	filters: ClientSideFilters,
	userLocation?: [number, number],
): Performance[] {
	let filtered = [...performances];

	// Filter by genre (client-side)
	if (filters.genre && filters.genre !== "all") {
		filtered = filtered.filter((perf) => perf.genre === filters.genre);
	}

	// Filter by popularity (client-side)
	if (filters.popularity && filters.popularity !== "all") {
		switch (filters.popularity) {
			case "trending":
				filtered = filtered.filter((perf) => perf.engagement.likes >= 10);
				break;
			case "popular":
				filtered = filtered.filter((perf) => perf.engagement.likes >= 5);
				break;
			case "new":
				filtered = filtered.filter((perf) => {
					const created = new Date(perf.createdAt);
					const now = new Date();
					const hoursDiff =
						(now.getTime() - created.getTime()) / (1000 * 60 * 60);
					return hoursDiff <= 24; // Created within last 24 hours
				});
				break;
		}
	}

	// Filter by distance (client-side if user location is available)
	if (filters.distance && userLocation && filters.distance < 25) {
		filtered = filtered.filter((perf) => {
			// Check if any stop is within the distance
			return perf.route.stops.some((stop) => {
				const distance = calculateDistance(
					userLocation,
					stop.location.coordinates,
				);
				return distance <= filters.distance!;
			});
		});
	}

	return filtered;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
	coord1: [number, number],
	coord2: [number, number],
): number {
	const R = 6371; // Earth's radius in kilometers
	const dLat = toRad(coord2[1] - coord1[1]);
	const dLon = toRad(coord2[0] - coord1[0]);
	const lat1 = toRad(coord1[1]);
	const lat2 = toRad(coord2[1]);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;

	return distance;
}

function toRad(deg: number): number {
	return deg * (Math.PI / 180);
}

// Determine which filters should be handled client-side vs server-side
export function shouldUseClientSideFiltering(
	filters: ClientSideFilters,
): boolean {
	// Use client-side filtering if only simple filters are applied
	const hasComplexFilters = false; // No complex filters for now

	return Boolean(
		!hasComplexFilters &&
			((filters.genre && filters.genre !== "all") ||
				(filters.popularity && filters.popularity !== "all") ||
				(filters.distance && filters.distance < 25)),
	);
}
