import { ApiClient, api } from "@/utils/api";
import type { User } from "@spm/shared-types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ClerkAuthState {
	// State
	user: User | null;
	isLoading: boolean;
	error: string | null;

	// Actions
	setUser: (user: User | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	clearUser: () => void;
	syncUserWithBackend: (clerkUser: {
		id: string;
		email: string;
		username?: string | null;
		displayName?: string | null;
		avatar?: string | null;
		role?: "performer" | "audience";
	}) => Promise<void>;

	// Getters
	isAuthenticated: boolean;
	isPerformer: boolean;
	isAudience: boolean;
}

export const useClerkAuthStore = create<ClerkAuthState>()(
	persist(
		(set, get) => ({
			// Initial state
			user: null,
			isLoading: false,
			error: null,

			// Computed getters
			get isAuthenticated() {
				return !!get().user;
			},

			get isPerformer() {
				return get().user?.role === "performer";
			},

			get isAudience() {
				return get().user?.role === "audience";
			},

			// Actions
			setUser: (user: User | null) => {
				set({ user, error: null });
			},

			setLoading: (loading: boolean) => {
				set({ isLoading: loading });
			},

			setError: (error: string | null) => {
				set({ error });
			},

			clearError: () => {
				set({ error: null });
			},

			clearUser: () => {
				localStorage.removeItem("auth-token");
				set({
					user: null,
					isLoading: false,
					error: null,
				});
			},

			syncUserWithBackend: async (clerkUser) => {
				try {
					set({ isLoading: true, error: null });

					// Ensure we have a valid displayName
					const displayName =
						clerkUser.displayName || clerkUser.username || "User";

					const response = await ApiClient.call<{ user: User; token: string }>(
						api.post("/users/sync-clerk", {
							clerkId: clerkUser.id,
							email: clerkUser.email,
							username: clerkUser.username,
							displayName: displayName,
							avatar: clerkUser.avatar,
							role: clerkUser.role || "audience", // Default to audience if no role provided
						}),
					);

					console.log("Sync response:", response);
					console.log("Setting user:", response.user);
					console.log("Storing token: [REDACTED]");

					// Store the JWT token for API calls
					localStorage.setItem("auth-token", response.token);

					set({ user: response.user, isLoading: false });
				} catch (error) {
					console.error("Failed to sync Clerk user with backend:", error);
					set({
						error:
							error instanceof Error ? error.message : "Failed to sync user",
						isLoading: false,
					});
				}
			},
		}),
		{
			name: "clerk-auth-storage", // localStorage key
			partialize: (state) => ({
				user: state.user,
			}),
		},
	),
);
