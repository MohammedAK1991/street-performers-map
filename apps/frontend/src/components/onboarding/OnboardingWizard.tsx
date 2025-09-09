import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailVerificationStep } from "./steps/EmailVerificationStep";
import { LocationStep } from "./steps/LocationStep";
import { PerformanceTypeStep } from "./steps/PerformanceTypeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { StripeConnectStep } from "./steps/StripeConnectStep";
import { WelcomeStep } from "./steps/WelcomeStep";

export interface OnboardingData {
	// Performance details
	performanceTypes: string[];
	primaryType: string;

	// Location
	city: string;
	country: string;
	coordinates: [number, number];
	performanceAreas: string[];

	// Profile
	stageName: string;
	bio: string;
	profileImage?: string;
	socialLinks: {
		instagram?: string;
		youtube?: string;
		spotify?: string;
		website?: string;
	};

	// Verification
	emailVerified: boolean;
	phoneVerified?: boolean;

	// Payment
	stripeConnected: boolean;
	stripeAccountId?: string;
}

export function OnboardingWizard() {
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { user } = useUser();
	const navigate = useNavigate();

	const [onboardingData, setOnboardingData] = useState<OnboardingData>({
		performanceTypes: [],
		primaryType: "",
		city: "",
		country: "",
		coordinates: [0, 0],
		performanceAreas: [],
		stageName: "",
		bio: "",
		socialLinks: {},
		emailVerified: false,
		stripeConnected: false,
	});

	const steps = [
		{
			id: "welcome",
			title: "Welcome to StreetPerformersMap",
			component: WelcomeStep,
		},
		{
			id: "performance-type",
			title: "What Type of Performer Are You?",
			component: PerformanceTypeStep,
		},
		{
			id: "location",
			title: "Where Do You Perform?",
			component: LocationStep,
		},
		{
			id: "profile",
			title: "Create Your Profile",
			component: ProfileStep,
		},
		{
			id: "email-verification",
			title: "Verify Your Email",
			component: EmailVerificationStep,
		},
		{
			id: "stripe-connect",
			title: "Connect Your Bank Account",
			component: StripeConnectStep,
		},
	];

	const currentStepData = steps[currentStep];
	const CurrentStepComponent = currentStepData.component;

	const updateData = (stepData: Partial<OnboardingData>) => {
		setOnboardingData((prev) => ({ ...prev, ...stepData }));
	};

	const nextStep = async () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep((prev) => prev + 1);
		} else {
			await completeOnboarding();
		}
	};

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const completeOnboarding = async () => {
		setIsLoading(true);
		setError(null);

		try {
			// TODO: Save onboarding data to backend
			console.log("🎉 Onboarding completed:", onboardingData);

			// Mark user as having completed onboarding in Clerk metadata
			if (user) {
				await user.update({
					unsafeMetadata: {
						...user.unsafeMetadata,
						onboardingCompleted: true,
						onboardingData: onboardingData,
					},
				});
			}

			// Navigate to create performance page
			navigate("/create-performance");
		} catch (err: any) {
			setError(err.message || "Failed to complete onboarding");
		} finally {
			setIsLoading(false);
		}
	};

	const skipStep = () => {
		// Allow skipping certain steps
		if (
			currentStepData.id === "email-verification" ||
			currentStepData.id === "stripe-connect"
		) {
			nextStep();
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full">
				{/* Progress Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center space-x-2">
							<div className="text-2xl font-bold text-blue-400">
								🎵 StreetPerformersMap
							</div>
						</div>
						<div className="text-sm text-gray-400">
							Step {currentStep + 1} of {steps.length}
						</div>
					</div>

					{/* Progress Bar */}
					<div className="w-full bg-gray-700 rounded-full h-2">
						<div
							className="bg-blue-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
						/>
					</div>

					{/* Step Dots */}
					<div className="flex justify-between mt-4">
						{steps.map((step, index) => (
							<div
								key={step.id}
								className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
									index <= currentStep
										? "bg-blue-500 border-blue-500 text-white"
										: "bg-gray-800 border-gray-600 text-gray-400"
								}`}
							>
								{index + 1}
							</div>
						))}
					</div>
				</div>

				{/* Main Content */}
				<div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-white mb-2">
							{currentStepData.title}
						</h1>
						{currentStep === 0 && (
							<p className="text-gray-300">
								Let's get you set up to receive tips and connect with your
								audience
							</p>
						)}
					</div>

					{/* Error Display */}
					{error && (
						<div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
							<p className="text-red-400 text-sm">{error}</p>
						</div>
					)}

					{/* Step Component */}
					<CurrentStepComponent
						data={onboardingData}
						updateData={updateData}
						nextStep={nextStep}
						prevStep={prevStep}
						skipStep={skipStep}
						isLoading={isLoading}
						user={user}
					/>
				</div>

				{/* Skip Option for Optional Steps */}
				{(currentStepData.id === "email-verification" ||
					currentStepData.id === "stripe-connect") && (
					<div className="text-center mt-4">
						<button
							onClick={skipStep}
							className="text-gray-400 hover:text-gray-300 text-sm underline"
						>
							Skip this step for now
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
