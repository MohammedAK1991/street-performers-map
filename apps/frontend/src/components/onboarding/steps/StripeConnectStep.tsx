import { useState } from "react";
import type { OnboardingData } from "../OnboardingWizard";
import { api } from "@/utils/api";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

interface StripeConnectStepProps {
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	prevStep: () => void;
	skipStep: () => void;
	isLoading: boolean;
}

export function StripeConnectStep({
	updateData,
	nextStep,
	prevStep,
	skipStep,
	isLoading,
}: StripeConnectStepProps) {
	const [isConnecting, setIsConnecting] = useState(false);
	const [connectionError, setConnectionError] = useState<string | null>(null);

	const { user } = useUser();

	const handleConnectStripe = async () => {
		setIsConnecting(true);
		setConnectionError(null);

		try {
			if (!user?.primaryEmailAddress?.emailAddress) {
				throw new Error("Email address is required for Stripe Connect");
			}

			const emailToSend = user.primaryEmailAddress.emailAddress;
			console.log("🔍 Frontend sending email:", emailToSend);
			console.log("🔍 Email type:", typeof emailToSend);
			console.log("🔍 Email length:", emailToSend.length);

			// Step 1: Create Stripe Connect account
			console.log("Creating Stripe Connect account...");
			const response = await api.post("/payments/connect/account", {
				email: emailToSend,
				country: "ES", // TODO: Get from user location or let them select
				businessType: "individual"
			});

			const connectAccount = response.data.data;
			
			// Step 2: Redirect to Stripe for onboarding
			if (connectAccount.loginUrl) {
				// In a real app, this would redirect the user to Stripe
				// For now, we'll show a success message and continue
				toast.success("Stripe Connect account created! In production, you'd be redirected to complete setup.");
				
				updateData({
					stripeConnected: true,
					stripeAccountId: connectAccount.accountId,
				});

				// Complete onboarding
				nextStep();
			} else {
				throw new Error("Failed to get Stripe onboarding URL");
			}
		} catch (error: any) {
			console.error("Stripe Connect error:", error);
			const errorMessage = error?.response?.data?.error?.message || error.message || "Failed to connect Stripe account. Please try again.";
			setConnectionError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleSkip = () => {
		updateData({ stripeConnected: false });
		skipStep();
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<div className="w-20 h-20 mx-auto bg-green-900/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
					<span className="text-3xl">🏦</span>
				</div>
				<h3 className="text-xl font-bold text-white mb-2">
					Connect Your Bank Account
				</h3>
				<p className="text-gray-300">
					Set up secure payments so you can receive tips directly to your bank
					account.
				</p>
			</div>

			{/* Stripe Info */}
			<div className="bg-blue-900/20 rounded-lg p-6 border border-blue-500/30">
				<div className="flex items-start space-x-4">
					<div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-600">
						<img
							src="/api/placeholder/stripe-logo"
							alt="Stripe"
							className="w-8 h-8"
							onError={(e) => {
								(e.target as HTMLImageElement).src =
									'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%236772E5" viewBox="0 0 100 42"><path d="M6 18c0-5 2-8 7-8 3 0 5 1 6 3v-2h5v15h-5v-2c-1 2-3 3-6 3-5 0-7-3-7-8v-1zm12-4c-1-1-2-2-4-2-2 0-4 1-4 4v1c0 3 2 4 4 4 2 0 3-1 4-2V14z"/></svg>';
							}}
						/>
					</div>
					<div className="flex-1">
						<h4 className="font-semibold text-blue-300 mb-2">
							Secure payments powered by Stripe
						</h4>
						<p className="text-sm text-blue-200">
							Stripe is a secure, trusted payment platform used by millions of
							businesses worldwide. Your bank details are encrypted and never
							stored by us.
						</p>
					</div>
				</div>
			</div>

			{/* Benefits */}
			<div className="space-y-4">
				<h4 className="font-semibold text-white">
					💰 What you get with connected payments:
				</h4>

				<div className="space-y-3">
					<div className="flex items-start space-x-3">
						<div className="w-6 h-6 bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
							<span className="text-green-400 text-sm">✓</span>
						</div>
						<div>
							<p className="font-medium text-white">Instant tips</p>
							<p className="text-sm text-gray-300">
								Receive contactless tips from Apple Pay, Google Pay, and cards
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<div className="w-6 h-6 bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
							<span className="text-green-400 text-sm">✓</span>
						</div>
						<div>
							<p className="font-medium text-white">Direct to your bank</p>
							<p className="text-sm text-gray-300">
								Tips go straight to your bank account (usually within 1-2 days)
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<div className="w-6 h-6 bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
							<span className="text-green-400 text-sm">✓</span>
						</div>
						<div>
							<p className="font-medium text-white">Earnings dashboard</p>
							<p className="text-sm text-gray-300">
								Track your tips, see analytics, and manage payouts
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<div className="w-6 h-6 bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-500/30">
							<span className="text-green-400 text-sm">✓</span>
						</div>
						<div>
							<p className="font-medium text-white">Low fees</p>
							<p className="text-sm text-gray-300">
								Only 2.9% + €0.30 per transaction (standard Stripe rates)
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Fee Transparency */}
			<div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
				<h4 className="font-semibold text-yellow-300 mb-2">💡 Fee Example</h4>
				<div className="text-sm text-yellow-200 space-y-1">
					<div className="flex justify-between">
						<span>€5.00 tip from fan</span>
						<span>€5.00</span>
					</div>
					<div className="flex justify-between text-gray-300">
						<span>Processing fee (2.9% + €0.30)</span>
						<span>-€0.45</span>
					</div>
					<div className="flex justify-between font-semibold border-t border-yellow-500/30 pt-1">
						<span>You receive</span>
						<span className="text-green-400">€4.55</span>
					</div>
				</div>
			</div>

			{/* Error Display */}
			{connectionError && (
				<div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
					<p className="text-red-400 text-sm">{connectionError}</p>
				</div>
			)}

			{/* Connect Button */}
			<div className="space-y-4">
				<button
					type="button"
					onClick={handleConnectStripe}
					disabled={isConnecting || isLoading}
					className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
				>
					{isConnecting ? (
						<>
							<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
							Connecting to Stripe...
						</>
					) : (
						<>
							<span className="mr-2">🔗</span>
							Connect Bank Account with Stripe
						</>
					)}
				</button>

				<div className="flex space-x-4">
					<button
						type="button"
						onClick={prevStep}
						disabled={isConnecting || isLoading}
						className="flex-1 bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
					>
						← Back
					</button>

					<button
						type="button"
						onClick={handleSkip}
						disabled={isConnecting || isLoading}
						className="flex-1 bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
					>
						Set up Later
					</button>
				</div>
			</div>

			{/* Security Note */}
			<div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
				<h4 className="font-semibold text-white mb-2">
					🔒 Your security is our priority
				</h4>
				<ul className="text-sm text-gray-300 space-y-1">
					<li>
						• Your bank details are encrypted and stored securely by Stripe
					</li>
					<li>• We never see or store your banking information</li>
					<li>• You can disconnect or change banks anytime</li>
					<li>
						• Full compliance with PCI DSS and European banking regulations
					</li>
				</ul>
			</div>

			{/* Skip Notice */}
			<div className="text-center">
				<p className="text-sm text-gray-500">
					You can set up payments later in your profile settings.
					<br />
					<span className="font-medium">
						Without connected payments, you won't receive tips.
					</span>
				</p>
			</div>

			{/* Important Note */}
			<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<h4 className="font-semibold text-blue-900 mb-2">
					🔗 Next Steps
				</h4>
				<p className="text-sm text-blue-800">
					After clicking "Connect", you'll be redirected to Stripe's secure 
					platform to provide your banking details and complete identity verification. 
					This process is required to receive payments.
				</p>
			</div>
		</div>
	);
}
