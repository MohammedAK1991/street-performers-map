import { SignedIn } from "@clerk/clerk-react";
import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useClerkSync } from "./hooks/useClerkSync";
import { Home } from "./pages/Home"; // Keep Home as regular import for faster initial load

// Lazy load components
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const CreatePerformance = lazy(() => import("./pages/CreatePerformance").then(m => ({ default: m.CreatePerformance })));
const MapPage = lazy(() => import("./pages/Map").then(m => ({ default: m.Map })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const OnboardingWizard = lazy(() => import("./components/onboarding/OnboardingWizard").then(m => ({ default: m.OnboardingWizard })));

// Loading component
const PageLoader = () => (
	<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
		<div className="text-center">
			<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p className="text-white text-lg">Loading...</p>
		</div>
	</div>
);

export function App() {
	// Sync Clerk user with our database
	useClerkSync();

	return (
		<ErrorBoundary>
			<div className="min-h-screen bg-white">
				<Suspense fallback={<PageLoader />}>
					<Routes>
					<Route path="/" element={<Home />} />
					<Route
						path="/map"
						element={
							<SignedIn>
								<MapPage />
							</SignedIn>
						}
					/>
					<Route
						path="/create-performance"
						element={
							<SignedIn>
								<CreatePerformance />
							</SignedIn>
						}
					/>
					<Route
						path="/onboarding"
						element={
							<SignedIn>
								<OnboardingWizard />
							</SignedIn>
						}
					/>
					<Route
						path="/profile"
						element={
							<SignedIn>
								<Profile />
							</SignedIn>
						}
					/>
					<Route
						path="/analytics"
						element={
							<SignedIn>
								<Analytics />
							</SignedIn>
						}
					/>
					</Routes>
				</Suspense>
				<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000,
					style: {
						background: "#1f2937",
						color: "#fff",
						border: "1px solid #374151",
					},
					success: {
						iconTheme: {
							primary: "#10b981",
							secondary: "#fff",
						},
					},
					error: {
						iconTheme: {
							primary: "#ef4444",
							secondary: "#fff",
						},
					},
				}}
				/>
			</div>
		</ErrorBoundary>
	);
}
