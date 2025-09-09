import { useAuthStore } from "@/stores/authStore";
import type { RegisterData } from "@spm/shared-types";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function Signup() {
	const navigate = useNavigate();
	const { register, isLoading, error, clearError } = useAuthStore();

	const [formData, setFormData] = useState<RegisterData>({
		email: "",
		password: "",
		username: "",
		role: "audience",
		displayName: "",
	});

	const [confirmPassword, setConfirmPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		if (formData.password !== confirmPassword) {
			// Handle password mismatch locally
			return;
		}

		try {
			await register(formData);
			navigate("/map"); // Redirect to map after successful registration
		} catch (error) {
			// Error is already handled by the store
			// Could add toast notification here
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<Link to="/" className="flex justify-center">
						<h1 className="text-3xl font-bold text-purple-600">
							🎵 StreetPerformersMap
						</h1>
					</Link>
					<h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
						Join StreetPerformersMap
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Connect with the street music community
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex">
								<div className="text-red-600 text-sm">{error}</div>
							</div>
						</div>
					)}

					{/* User Type Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							I want to:
						</label>
						<div className="grid grid-cols-2 gap-3">
							<label
								className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${
									formData.role === "performer"
										? "border-purple-500 bg-purple-50"
										: "border-gray-300 hover:border-gray-400"
								}`}
							>
								<input
									type="radio"
									name="role"
									value="performer"
									checked={formData.role === "performer"}
									onChange={handleChange}
									className="sr-only"
								/>
								<div className="text-2xl mb-2">🎭</div>
								<div className="font-medium text-gray-900">PERFORM</div>
								<div className="text-sm text-gray-600">Share my music</div>
							</label>

							<label
								className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${
									formData.role === "audience"
										? "border-purple-500 bg-purple-50"
										: "border-gray-300 hover:border-gray-400"
								}`}
							>
								<input
									type="radio"
									name="role"
									value="audience"
									checked={formData.role === "audience"}
									onChange={handleChange}
									className="sr-only"
								/>
								<div className="text-2xl mb-2">👥</div>
								<div className="font-medium text-gray-900">DISCOVER</div>
								<div className="text-sm text-gray-600">Find live music</div>
							</label>
						</div>
					</div>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="displayName"
								className="block text-sm font-medium text-gray-700"
							>
								👤 Display Name
							</label>
							<input
								id="displayName"
								name="displayName"
								type="text"
								required
								value={formData.displayName}
								onChange={handleChange}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
								placeholder="How should people know you?"
							/>
						</div>

						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-700"
							>
								🏷️ Username
							</label>
							<input
								id="username"
								name="username"
								type="text"
								required
								value={formData.username}
								onChange={handleChange}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
								placeholder="Choose a unique username"
							/>
						</div>

						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								📧 Email Address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={formData.email}
								onChange={handleChange}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
								placeholder="Enter your email"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								🔒 Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								value={formData.password}
								onChange={handleChange}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
								placeholder="Create a password (min 6 characters)"
								minLength={6}
							/>
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-gray-700"
							>
								🔒 Confirm Password
							</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
								placeholder="Confirm your password"
							/>
							{confirmPassword && formData.password !== confirmPassword && (
								<p className="mt-1 text-sm text-red-600">
									Passwords don't match
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center">
						<input
							id="agree-terms"
							name="agree-terms"
							type="checkbox"
							required
							className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
						/>
						<label
							htmlFor="agree-terms"
							className="ml-2 block text-sm text-gray-900"
						>
							I agree to the{" "}
							<a href="#" className="text-purple-600 hover:text-purple-500">
								Terms of Service
							</a>{" "}
							and{" "}
							<a href="#" className="text-purple-600 hover:text-purple-500">
								Privacy Policy
							</a>
						</label>
					</div>

					<div>
						<button
							type="submit"
							disabled={
								isLoading ||
								formData.password !== confirmPassword ||
								!formData.password
							}
							className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? (
								<>
									<svg
										className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Creating Account...
								</>
							) : (
								"Create Account"
							)}
						</button>
					</div>

					<div className="text-center">
						<span className="text-gray-600">Already have an account? </span>
						<Link
							to="/login"
							className="font-medium text-purple-600 hover:text-purple-500"
						>
							Sign in
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
