import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function StripeReturn() {
	const navigate = useNavigate();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

	useEffect(() => {
		const handleReturn = async () => {
			try {
				// In a real implementation, you might want to verify the account status
				// For now, we'll assume success and redirect to profile
				toast.success("Stripe account successfully connected!");
				setStatus('success');
				
				// Redirect to profile after a brief delay
				setTimeout(() => {
					navigate('/profile');
				}, 2000);
			} catch (error) {
				console.error("Return handling error:", error);
				toast.error("There was an issue completing your account setup.");
				setStatus('error');
			}
		};

		handleReturn();
	}, [navigate]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
			<div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
				{status === 'loading' && (
					<>
						<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Processing your account...</h2>
						<p className="text-gray-600">Please wait while we complete your setup.</p>
					</>
				)}
				
				{status === 'success' && (
					<>
						<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl">✅</span>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Account Connected!</h2>
						<p className="text-gray-600 mb-4">
							Your Stripe account has been successfully connected. You can now receive tips!
						</p>
						<p className="text-sm text-gray-500">Redirecting to your profile...</p>
					</>
				)}
				
				{status === 'error' && (
					<>
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl">❌</span>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Setup Incomplete</h2>
						<p className="text-gray-600 mb-4">
							There was an issue completing your account setup. Please try again.
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