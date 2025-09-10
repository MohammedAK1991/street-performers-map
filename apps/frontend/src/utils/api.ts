import type { ApiResponse } from "@spm/shared-types";
import axios, { type AxiosInstance, type AxiosError } from "axios";

// Create axios instance
export const api: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "/api/v1", // Use environment variable or fallback to relative path
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("auth-token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor to handle errors
api.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		// Handle 401 errors by clearing token and redirecting to login
		if (error.response?.status === 401) {
			localStorage.removeItem("auth-token");
			localStorage.removeItem("user");
			window.location.href = "/login";
		}

		// Handle network errors
		if (!error.response) {
			// Network error - could be logged to external service
			// console.error('Network error:', error.message);
		}

		return Promise.reject(error);
	},
);

// API response wrapper
export class ApiClient {
	// Generic API call method
	static async call<T>(apiCall: Promise<{ data: ApiResponse<T> }>): Promise<T> {
		try {
			const response = await apiCall;
			const data: ApiResponse<T> = response.data;

			if (!data.success) {
				throw new Error(data.error?.message || "API call failed");
			}

			return data.data!;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const apiError = error.response?.data as ApiResponse<never>;
				throw new Error(apiError?.error?.message || error.message);
			}
			throw error;
		}
	}

	// Health check
	static async healthCheck(): Promise<{ status: string; timestamp: string }> {
		const response = await api.get("/health");
		return response.data;
	}
}

export default api;
