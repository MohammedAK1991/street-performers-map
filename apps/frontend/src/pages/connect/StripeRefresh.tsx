import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

export function StripeRefresh() {
	const { accountId } = useParams<{ accountId: string }>();
	const navigate = useNavigate();
	const [status, setStatus] = useState<'loading' | 'error'>('loading');

	useEffect(() => {
		const refreshAccountLink = async () => {
			try {
				if (!accountId) {
					throw new Error("Missing account ID");
				}

				toast("Refreshing your Stripe account link...", { 
					icon: 'ℹ️'
				});

				// Create a new account link
				const response = await api.post("/payments/connect/link", {
					type: "account_onboarding"
				});

				const accountLink = response.data.data;
				
				if (accountLink.url) {
					// Redirect to the new account link
					window.location.href = accountLink.url;
				} else {
					throw new Error("Failed to create new account link");
				}
			} catch (error) {
				console.error("Refresh error:", error);
				toast.error("Failed to refresh account link. Please try again from your profile.");
				setStatus('error');
			}
		};

		refreshAccountLink();
	}, [accountId]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
			<div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
				{status === 'loading' && (
					<>
						<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Refreshing account link...</h2>
						<p className="text-gray-600">Creating a new setup link for your Stripe account.</p>
					</>
				)}
				
				{status === 'error' && (
					<>
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl">❌</span>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
						<p className="text-gray-600 mb-4">
							The account setup link has expired. You can create a new one from your profile.
						</p>
						<button
							onClick={() => navigate('/profile')}
							className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
						>
							Go to Profile
						</button>
					</>
				)}
			</div>
		</div>
	);
}