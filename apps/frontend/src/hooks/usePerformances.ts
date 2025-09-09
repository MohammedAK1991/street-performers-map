import { api } from "@/utils/api";
import type {
	CreatePerformanceData,
	Performance,
	PerformanceFilters,
} from "@spm/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const performanceKeys = {
	all: ["performances"] as const,
	lists: () => [...performanceKeys.all, "list"] as const,
	list: (filters: PerformanceFilters) =>
		[...performanceKeys.lists(), filters] as const,
	details: () => [...performanceKeys.all, "detail"] as const,
	detail: (id: string) => [...performanceKeys.details(), id] as const,
	nearby: (
		location: { lat: number; lng: number },
		radius: number,
		filters?: PerformanceFilters,
	) => [...performanceKeys.all, "nearby", location, radius, filters] as const,
};

// Fetch nearby performances
export function useNearbyPerformances(
	location: { lat: number; lng: number },
	radius = 10,
	filters?: PerformanceFilters,
) {
	return useQuery({
		queryKey: performanceKeys.nearby(location, radius, filters),
		queryFn: async () => {
			const params = new URLSearchParams({
				lat: location.lat.toString(),
				lng: location.lng.toString(),
				radius: radius.toString(),
				...(filters?.genre && { genre: filters.genre }),
				...(filters?.search && { search: filters.search }),
				...(filters?.status && { status: filters.status }),
				// timeRange filter removed - not implemented in backend
			});

			const response = await api.get(`/performances/nearby?${params}`);
			return response.data.data as Performance[];
		},
		staleTime: 1000 * 60 * 5, // 5 minutes - increased for better caching
		gcTime: 1000 * 60 * 10, // 10 minutes - keep in cache longer
		refetchInterval: 1000 * 60, // Refetch every 1 minute instead of 30 seconds
		refetchOnWindowFocus: false, // Don't refetch on window focus
		retry: 2, // Retry failed requests twice
	});
}

// Fetch all performances with filters
export function usePerformances(filters?: PerformanceFilters) {
	return useQuery({
		queryKey: performanceKeys.list(filters || {}),
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.genre) params.append("genre", filters.genre);
			if (filters?.search) params.append("search", filters.search);
			if (filters?.status) params.append("status", filters.status);
			// timeRange filter removed - not implemented in backend

			const response = await api.get(`/performances?${params}`);
			return response.data.data as Performance[];
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 10, // 10 minutes
		refetchOnWindowFocus: false,
		retry: 2,
	});
}

// Fetch single performance
export function usePerformance(id: string) {
	return useQuery({
		queryKey: performanceKeys.detail(id),
		queryFn: async () => {
			const response = await api.get(`/performances/${id}`);
			return response.data.data as Performance;
		},
		enabled: !!id,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes - keep individual performances longer
		refetchOnWindowFocus: false,
		retry: 2,
	});
}

// Create performance mutation
export function useCreatePerformance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (data: CreatePerformanceData) => {
			const response = await api.post("/performances", data);
			return response.data.data as Performance;
		},
		onSuccess: (newPerformance) => {
			// Invalidate and refetch nearby performances
			queryClient.invalidateQueries({ queryKey: performanceKeys.lists() });
			queryClient.invalidateQueries({ queryKey: performanceKeys.all });

			// Add the new performance to the cache
			queryClient.setQueryData(
				performanceKeys.detail(newPerformance._id),
				newPerformance,
			);
		},
	});
}

// Like performance mutation
export function useLikePerformance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			performanceId,
		}: { performanceId: string; userId?: string }) => {
			const response = await api.post(`/performances/${performanceId}/like`);
			return response.data.data as Performance;
		},
		onMutate: async ({ performanceId, userId }) => {
			// Cancel any outgoing refetches
			await queryClient.cancelQueries({ queryKey: ["performances"] });

			// Snapshot the previous values
			const previousPerformances = queryClient.getQueryData([
				"performances",
				"nearby",
			]);
			const previousPerformance = queryClient.getQueryData(
				performanceKeys.detail(performanceId),
			);

			// Optimistically update the individual performance cache
			queryClient.setQueryData(
				performanceKeys.detail(performanceId),
				(oldData: Performance | undefined) => {
					if (!oldData) return oldData;
					const isCurrentlyLiked = userId
						? oldData.engagement.likedBy.includes(userId)
						: false;
					return {
						...oldData,
						engagement: {
							...oldData.engagement,
							likes: isCurrentlyLiked
								? oldData.engagement.likes - 1
								: oldData.engagement.likes + 1,
							likedBy: isCurrentlyLiked
								? oldData.engagement.likedBy.filter((id) => id !== userId)
								: userId
									? [...oldData.engagement.likedBy, userId]
									: oldData.engagement.likedBy,
						},
					};
				},
			);

			// Optimistically update the nearby performances cache
			queryClient.setQueriesData(
				{ queryKey: ["performances", "nearby"] },
				(oldData: Performance[] | undefined) => {
					if (!oldData || !Array.isArray(oldData)) return oldData;
					return oldData.map((perf) => {
						if (perf._id === performanceId) {
							// Toggle the like optimistically
							const isCurrentlyLiked = userId
								? perf.engagement.likedBy.includes(userId)
								: false;
							return {
								...perf,
								engagement: {
									...perf.engagement,
									likes: isCurrentlyLiked
										? perf.engagement.likes - 1
										: perf.engagement.likes + 1,
									likedBy: isCurrentlyLiked
										? perf.engagement.likedBy.filter((id) => id !== userId)
										: userId
											? [...perf.engagement.likedBy, userId]
											: perf.engagement.likedBy,
								},
							};
						}
						return perf;
					});
				},
			);

			// Return a context object with the snapshotted values
			return { previousPerformances, previousPerformance };
		},
		onError: (_err, { performanceId }, _context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (_context?.previousPerformances) {
				queryClient.setQueryData(
					["performances", "nearby"],
					_context.previousPerformances,
				);
			}
			if (_context?.previousPerformance) {
				queryClient.setQueryData(
					performanceKeys.detail(performanceId),
					_context.previousPerformance,
				);
			}
		},
		onSuccess: (updatedPerformance) => {
			// Update the performance in all relevant caches with real data
			queryClient.setQueryData(
				performanceKeys.detail(updatedPerformance._id),
				updatedPerformance,
			);

			// Update in nearby performances cache with real data
			queryClient.setQueriesData(
				{ queryKey: ["performances", "nearby"] },
				(oldData: Performance[] | undefined) => {
					if (!oldData || !Array.isArray(oldData)) return oldData;
					return oldData.map((perf) =>
						perf._id === updatedPerformance._id ? updatedPerformance : perf,
					);
				},
			);
		},
		onSettled: () => {
			// Always refetch after error or success to ensure we have the latest data
			queryClient.invalidateQueries({ queryKey: ["performances"] });
		},
	});
}

// Start performance mutation
export function useStartPerformance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (performanceId: string) => {
			const response = await api.post(`/performances/${performanceId}/start`);
			return response.data.data as Performance;
		},
		onSuccess: (updatedPerformance) => {
			// Update the performance in all relevant caches
			queryClient.setQueryData(
				performanceKeys.detail(updatedPerformance._id),
				updatedPerformance,
			);

			// Invalidate nearby performances to refetch with updated status
			queryClient.invalidateQueries({ queryKey: performanceKeys.all });
		},
	});
}

// End performance mutation
export function useEndPerformance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (performanceId: string) => {
			const response = await api.post(`/performances/${performanceId}/end`);
			return response.data.data as Performance;
		},
		onSuccess: (updatedPerformance) => {
			// Update the performance in all relevant caches
			queryClient.setQueryData(
				performanceKeys.detail(updatedPerformance._id),
				updatedPerformance,
			);

			// Invalidate nearby performances to refetch with updated status
			queryClient.invalidateQueries({ queryKey: performanceKeys.all });
		},
	});
}

// Delete performance mutation
export function useDeletePerformance() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (performanceId: string) => {
			await api.delete(`/performances/${performanceId}`);
		},
		onSuccess: (_, performanceId) => {
			// Remove from cache
			queryClient.removeQueries({
				queryKey: performanceKeys.detail(performanceId),
			});

			// Invalidate lists to refetch
			queryClient.invalidateQueries({ queryKey: performanceKeys.lists() });
		},
	});
}
