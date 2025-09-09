import type { OnboardingData } from "../OnboardingWizard";

interface WelcomeStepProps {
	data: OnboardingData;
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	user: any;
}

export function WelcomeStep({ nextStep, user }: WelcomeStepProps) {
	return (
		<div className="text-center space-y-8">
			{/* Hero Icon */}
			<div className="flex justify-center">
				<div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-6xl">
					🎪
				</div>
			</div>

			{/* Welcome Message */}
			<div className="space-y-4">
				<h2 className="text-3xl font-bold text-white">
					Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
				</h2>
				<p className="text-lg text-gray-300 max-w-lg mx-auto">
					Join thousands of street performers earning tips and connecting with
					audiences worldwide.
				</p>
			</div>

			{/* Features Preview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
				<div className="text-center p-4">
					<div className="text-3xl mb-3">🗺️</div>
					<h3 className="font-semibold text-white mb-2">Get Discovered</h3>
					<p className="text-sm text-gray-300">
						Show up on our live map when you're performing
					</p>
				</div>

				<div className="text-center p-4">
					<div className="text-3xl mb-3">💰</div>
					<h3 className="font-semibold text-white mb-2">Receive Tips</h3>
					<p className="text-sm text-gray-300">
						Contactless tips directly to your bank account
					</p>
				</div>

				<div className="text-center p-4">
					<div className="text-3xl mb-3">📱</div>
					<h3 className="font-semibold text-white mb-2">Share Videos</h3>
					<p className="text-sm text-gray-300">
						Upload performance clips to attract more audience
					</p>
				</div>
			</div>

			{/* Statistics */}
			<div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/30">
				<div className="grid grid-cols-3 gap-4 text-center">
					<div>
						<div className="text-2xl font-bold text-blue-400">1,200+</div>
						<div className="text-sm text-gray-300">Active Performers</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-green-400">€25,000+</div>
						<div className="text-sm text-gray-300">Tips Earned</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-purple-400">50+</div>
						<div className="text-sm text-gray-300">Cities Worldwide</div>
					</div>
				</div>
			</div>

			{/* CTA */}
			<div className="pt-4">
				<button
					type="button"
					onClick={nextStep}
					className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
				>
					Let's Get Started! 🚀
				</button>
			</div>

			{/* Fine Print */}
			<p className="text-xs text-gray-400">
				Takes 3 minutes • Free forever • Secure & GDPR compliant
			</p>
		</div>
	);
}
