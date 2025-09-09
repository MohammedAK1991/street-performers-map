import { ApiClient, api } from "@/utils/api";
import type { Performance } from "@spm/shared-types";

export interface GetNearbyPerformancesParams {
	lat: number;
	lng: number;
	radius?: number; // in km, default 10
	genre?: string;
	status?: "scheduled" | "live" | "completed";
}

export interface CreatePerformanceData {
	title: string;
	description?: string;
	genre: string;
	route: {
		stops: {
			location: {
				coordinates: [number, number];
				address: string;
				name?: string;
			};
			startTime: string; // ISO string
			endTime: string; // ISO string
		}[];
	};
}

export class PerformanceApiService {
	/**
	 * Get nearby performances
	 */
	static async getNearbyPerformances(
		params: GetNearbyPerformancesParams,
	): Promise<Performance[]> {
		const queryParams = new URLSearchParams({
			lat: params.lat.toString(),
			lng: params.lng.toString(),
			radius: (params.radius || 10).toString(),
			...(params.genre && { genre: params.genre }),
			...(params.status && { status: params.status }),
		});

		return ApiClient.call<Performance[]>(
			api.get(`/performances/nearby?${queryParams}`),
		);
	}

	/**
	 * Get a specific performance by ID
	 */
	static async getPerformance(id: string): Promise<Performance> {
		return ApiClient.call<Performance>(api.get(`/performances/${id}`));
	}

	/**
	 * Create a new performance (performer only)
	 */
	static async createPerformance(
		data: CreatePerformanceData,
	): Promise<Performance> {
		return ApiClient.call<Performance>(api.post("/performances", data));
	}

	/**
	 * Like/unlike a performance
	 */
	static async toggleLike(
		performanceId: string,
	): Promise<{ liked: boolean; totalLikes: number }> {
		return ApiClient.call<{ liked: boolean; totalLikes: number }>(
			api.post(`/performances/${performanceId}/like`),
		);
	}

	/**
	 * Get performer's own performances
	 */
	static async getMyPerformances(): Promise<Performance[]> {
		return ApiClient.call<Performance[]>(
			api.get("/performances/my/performances"),
		);
	}

	/**
	 * Update a performance (performer only)
	 */
	static async updatePerformance(
		id: string,
		data: Partial<CreatePerformanceData>,
	): Promise<Performance> {
		return ApiClient.call<Performance>(api.put(`/performances/${id}`, data));
	}

	/**
	 * Delete a performance (performer only)
	 */
	static async deletePerformance(id: string): Promise<void> {
		return ApiClient.call<void>(api.delete(`/performances/${id}`));
	}

	/**
	 * Start a performance (go live)
	 */
	static async startPerformance(id: string): Promise<Performance> {
		return ApiClient.call<Performance>(api.post(`/performances/${id}/start`));
	}

	/**
	 * End a performance
	 */
	static async endPerformance(id: string): Promise<Performance> {
		return ApiClient.call<Performance>(api.post(`/performances/${id}/end`));
	}
}

// Export individual methods for convenience
export const performanceApi = PerformanceApiService;
