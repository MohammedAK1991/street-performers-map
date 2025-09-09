import { useEffect, useState } from "react";
import type { OnboardingData } from "../OnboardingWizard";

interface EmailVerificationStepProps {
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	prevStep: () => void;
	skipStep: () => void;
	user: any;
}

export function EmailVerificationStep({
	updateData,
	nextStep,
	prevStep,
	skipStep,
	user,
}: EmailVerificationStepProps) {
	const [verificationCode, setVerificationCode] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [codeSent, setCodeSent] = useState(false);
	const [countdown, setCountdown] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
	const isEmailVerified =
		user?.emailAddresses?.[0]?.verification?.status === "verified";

	useEffect(() => {
		if (isEmailVerified) {
			updateData({ emailVerified: true });
		}
	}, [isEmailVerified, updateData]);

	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (countdown > 0) {
			timer = setTimeout(() => setCountdown(countdown - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [countdown]);

	const sendVerificationCode = async () => {
		if (!userEmail) return;

		setIsSending(true);
		setError(null);

		try {
			// In a real app, you'd call your backend or Clerk's verification API
			// For demo purposes, we'll simulate the process
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setCodeSent(true);
			setCountdown(60);
		} catch (err: any) {
			setError("Failed to send verification code. Please try again.");
		} finally {
			setIsSending(false);
		}
	};

	const verifyCode = async () => {
		if (!verificationCode.trim()) return;

		setIsVerifying(true);
		setError(null);

		try {
			// In a real app, you'd verify the code with your backend or Clerk
			// For demo purposes, we'll accept any 6-digit code
			if (verificationCode.length === 6) {
				updateData({ emailVerified: true });
				nextStep();
			} else {
				throw new Error("Please enter a 6-digit code");
			}
		} catch (err: any) {
			setError(err.message || "Invalid verification code. Please try again.");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleSkip = () => {
		updateData({ emailVerified: false });
		skipStep();
	};

	// If already verified through Clerk
	if (isEmailVerified) {
		return (
			<div className="text-center space-y-6">
				<div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
					<span className="text-4xl">✅</span>
				</div>

				<div>
					<h3 className="text-2xl font-bold text-green-900 mb-2">
						Email Already Verified!
					</h3>
					<p className="text-green-700">
						Your email {userEmail} is already verified.
					</p>
				</div>

				<button
					onClick={() => {
						updateData({ emailVerified: true });
						nextStep();
					}}
					className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
				>
					Continue →
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
					<span className="text-2xl">📧</span>
				</div>
				<p className="text-gray-600 mb-2">
					We need to verify your email address for security and notifications.
				</p>
				<p className="text-sm text-gray-500">
					You'll receive tips notifications and important updates here.
				</p>
			</div>

			{/* Email Display */}
			<div className="text-center">
				<div className="inline-flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
					<span className="text-lg">📧</span>
					<span className="font-medium text-gray-900">{userEmail}</span>
				</div>
			</div>

			{!codeSent ? (
				/* Send Code Step */
				<div className="space-y-6">
					<div className="text-center">
						<p className="text-gray-700 mb-4">
							We'll send a 6-digit verification code to this email address.
						</p>
					</div>

					<button
						onClick={sendVerificationCode}
						disabled={isSending || !userEmail}
						className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
					>
						{isSending ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Sending Code...
							</>
						) : (
							"Send Verification Code"
						)}
					</button>

					<div className="flex space-x-4">
						<button
							onClick={prevStep}
							className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
						>
							← Back
						</button>

						<button
							onClick={handleSkip}
							className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
						>
							Skip for Now
						</button>
					</div>
				</div>
			) : (
				/* Verify Code Step */
				<div className="space-y-6">
					<div className="text-center">
						<p className="text-gray-700 mb-4">
							Enter the 6-digit code we sent to <strong>{userEmail}</strong>
						</p>
					</div>

					<div>
						<input
							type="text"
							value={verificationCode}
							onChange={(e) => {
								const value = e.target.value.replace(/\D/g, "").slice(0, 6);
								setVerificationCode(value);
								setError(null);
							}}
							placeholder="000000"
							maxLength={6}
							className="w-full p-4 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
						/>
						{error && (
							<p className="text-red-600 text-sm mt-2 text-center">{error}</p>
						)}
					</div>

					<button
						onClick={verifyCode}
						disabled={isVerifying || verificationCode.length !== 6}
						className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
					>
						{isVerifying ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
								Verifying...
							</>
						) : (
							"Verify Email"
						)}
					</button>

					{/* Resend Code */}
					<div className="text-center">
						{countdown > 0 ? (
							<p className="text-gray-500 text-sm">
								Resend code in {countdown} seconds
							</p>
						) : (
							<button
								onClick={sendVerificationCode}
								disabled={isSending}
								className="text-blue-600 hover:text-blue-800 text-sm underline"
							>
								{isSending
									? "Sending..."
									: "Didn't receive the code? Send again"}
							</button>
						)}
					</div>

					<div className="flex space-x-4">
						<button
							onClick={prevStep}
							className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
						>
							← Back
						</button>

						<button
							onClick={handleSkip}
							className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
						>
							Skip for Now
						</button>
					</div>
				</div>
			)}

			{/* Benefits */}
			<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
				<h4 className="font-semibold text-blue-900 mb-2">
					✨ Why Verify Your Email?
				</h4>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>• Get notified when you receive tips</li>
					<li>• Recover your account if needed</li>
					<li>• Receive weekly earnings summaries</li>
					<li>• Stay updated on new features</li>
				</ul>
			</div>
		</div>
	);
}
