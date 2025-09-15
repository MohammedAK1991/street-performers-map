import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const useClerkSync = () => {
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const [isSyncing, setIsSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		const syncUser = async () => {
			if (!clerkLoaded || !clerkUser || isSyncing) return;

			// Check if we already have a valid token
			const existingToken = localStorage.getItem("auth-token");
			if (existingToken) {
				// Token exists, skip sync
				return;
			}

			// Max 3 retries with exponential backoff
			if (retryCount >= 3) {
				setError("Failed to sync user after multiple attempts");
				return;
			}

			try {
				setIsSyncing(true);
				setError(null);

				// Sync Clerk user with backend
				const response = await api.post("/users/sync-clerk", {
					clerkId: clerkUser.id,
					email: clerkUser.emailAddresses[0]?.emailAddress,
					username:
						clerkUser.username ||
						clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0],
					displayName:
						clerkUser.fullName ||
						clerkUser.username ||
						clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0],
					avatar: clerkUser.imageUrl,
				});

				// Store the JWT token
				if (response.data.data.token) {
					localStorage.setItem("auth-token", response.data.data.token);
					setRetryCount(0); // Reset retry count on success
				}
			} catch (err: any) {
				console.error("Failed to sync Clerk user:", err);
				setError(err.message || "Failed to sync user");

				// Increment retry count and add delay before next attempt
				setRetryCount(prev => prev + 1);

				// Don't retry immediately, let the component re-render handle it
				setTimeout(() => {
					setIsSyncing(false);
				}, Math.pow(2, retryCount) * 1000); // Exponential backoff
				return;
			} finally {
				setIsSyncing(false);
			}
		};

		syncUser();
	}, [clerkLoaded, clerkUser, isSyncing, retryCount]);

	return {
		isLoaded: clerkLoaded,
		isLoading: !clerkLoaded || isSyncing,
		error,
	};
};
