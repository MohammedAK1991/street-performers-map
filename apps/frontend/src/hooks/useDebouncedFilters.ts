import type { PerformanceFilters } from "@spm/shared-types";
import { useEffect, useState } from "react";

interface FilterState {
	genre: string;
	timeRange: string;
	distance: number;
	popularity: string;
}

export function useDebouncedFilters(initialFilters: FilterState, delay = 500) {
	const [filters, setFilters] = useState<FilterState>(initialFilters);
	const [debouncedFilters, setDebouncedFilters] =
		useState<FilterState>(initialFilters);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedFilters(filters);
		}, delay);

		return () => clearTimeout(timer);
	}, [filters, delay]);

	// Convert to API filters format
	const apiFilters: PerformanceFilters = {
		...(debouncedFilters.genre !== "all" && { genre: debouncedFilters.genre }),
		...(debouncedFilters.timeRange === "now" && { status: "live" as const }),
		...(debouncedFilters.timeRange === "hour" && {
			timeRange: "hour" as const,
		}),
		...(debouncedFilters.timeRange === "today" && {
			timeRange: "today" as const,
		}),
	};

	return {
		filters,
		debouncedFilters,
		apiFilters,
		setFilters,
		isDebouncing: filters !== debouncedFilters,
	};
}
