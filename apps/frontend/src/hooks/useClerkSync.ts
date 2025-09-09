import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export const useClerkSync = () => {
	const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
	const [isSyncing, setIsSyncing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const syncUser = async () => {
			if (!clerkLoaded || !clerkUser || isSyncing) return;

			try {
				setIsSyncing(true);
				setError(null);

				// Check if we already have a valid token
				const existingToken = localStorage.getItem("auth-token");
				if (existingToken) {
					// Token exists, skip sync
					return;
				}

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
				}
			} catch (err: any) {
				console.error("Failed to sync Clerk user:", err);
				setError(err.message || "Failed to sync user");
			} finally {
				setIsSyncing(false);
			}
		};

		syncUser();
	}, [clerkLoaded, clerkUser, isSyncing]);

	return {
		isLoaded: clerkLoaded,
		isLoading: !clerkLoaded || isSyncing,
		error,
	};
};
