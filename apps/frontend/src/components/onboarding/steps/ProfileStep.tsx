import { useRef, useState } from "react";
import type { OnboardingData } from "../OnboardingWizard";

interface ProfileStepProps {
	data: OnboardingData;
	updateData: (data: Partial<OnboardingData>) => void;
	nextStep: () => void;
	prevStep: () => void;
	user: any;
}

export function ProfileStep({
	data,
	updateData,
	nextStep,
	prevStep,
	user,
}: ProfileStepProps) {
	const [stageName, setStageName] = useState<string>(
		data.stageName || user?.firstName || "",
	);
	const [bio, setBio] = useState<string>(data.bio || "");
	const [profileImage, setProfileImage] = useState<string>(
		data.profileImage || "",
	);
	const [socialLinks, setSocialLinks] = useState(
		data.socialLinks || {
			instagram: "",
			youtube: "",
			spotify: "",
			website: "",
		},
	);
	const [isUploading, setIsUploading] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = async (file: File) => {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			alert("Please select an image file");
			return;
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			alert("Image must be less than 5MB");
			return;
		}

		setIsUploading(true);

		try {
			// Upload to Cloudinary
			const formData = new FormData();
			formData.append('file', file);
			formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

			const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
			
			const response = await fetch(cloudinaryUrl, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			const data = await response.json();
			setProfileImage(data.secure_url);
		} catch (error) {
			console.error("Image upload failed:", error);
			alert("Failed to upload image. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleSocialLinkChange = (platform: string, value: string) => {
		setSocialLinks((prev) => ({
			...prev,
			[platform]: value.trim(),
		}));
	};

	const canContinue = stageName.trim().length > 0;

	const handleNext = () => {
		updateData({
			stageName: stageName.trim(),
			bio: bio.trim(),
			profileImage: profileImage,
			socialLinks: socialLinks,
		});
		nextStep();
	};

	return (
		<div className="space-y-8">
			{/* Instructions */}
			<div className="text-center">
				<p className="text-gray-300 mb-2">
					Create your performer profile that audiences will see.
				</p>
				<p className="text-sm text-gray-400">
					A good profile helps you get more tips and bookings!
				</p>
			</div>

			{/* Profile Image */}
			<div className="text-center">
				<h3 className="font-semibold text-white mb-4">
					📸 Upload Your Profile Photo
				</h3>

				<div className="inline-block relative">
					<div
						className={`w-32 h-32 rounded-full border-4 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors ${
							profileImage ? "border-solid border-blue-500" : ""
						}`}
						onClick={() => fileInputRef.current?.click()}
					>
						{profileImage ? (
							<img
								src={profileImage}
								alt="Profile preview"
								className="w-full h-full rounded-full object-cover"
							/>
						) : (
							<div className="text-center">
								{isUploading ? (
									<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
								) : (
									<div className="text-4xl text-gray-400 mb-2">📸</div>
								)}
								<div className="text-sm text-gray-400">
									{isUploading ? "Uploading..." : "Click to upload"}
								</div>
							</div>
						)}
					</div>

					{profileImage && (
						<button
							onClick={() => setProfileImage("")}
							className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
						>
							×
						</button>
					)}
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={(e) =>
						e.target.files?.[0] && handleImageUpload(e.target.files[0])
					}
					className="hidden"
				/>

				<p className="text-xs text-gray-400 mt-2">
					JPG, PNG or GIF • Max 5MB • Square images work best
				</p>
			</div>

			{/* Stage Name */}
			<div>
				<label className="block font-semibold text-white mb-2">
					🎭 Stage Name *
				</label>
				<input
					type="text"
					value={stageName}
					onChange={(e) => setStageName(e.target.value)}
					placeholder="What should audiences call you?"
					maxLength={50}
					className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<div className="flex justify-between text-xs text-gray-400 mt-1">
					<span>This is how you'll appear on the map</span>
					<span>{stageName.length}/50</span>
				</div>
			</div>

			{/* Bio */}
			<div>
				<label className="block font-semibold text-white mb-2">
					📝 Tell Your Story
				</label>
				<textarea
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					placeholder="Describe your performances, style, and what makes you unique..."
					maxLength={300}
					rows={4}
					className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
				/>
				<div className="flex justify-between text-xs text-gray-400 mt-1">
					<span>Help audiences know what to expect</span>
					<span>{bio.length}/300</span>
				</div>
			</div>

			{/* Social Links */}
			<div>
				<h3 className="font-semibold text-white mb-4">
					🔗 Social Media Links (Optional)
				</h3>
				<p className="text-sm text-gray-300 mb-4">
					Let audiences find more of your content and follow you online.
				</p>

				<div className="space-y-3">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							📷 Instagram
						</label>
						<div className="flex">
							<span className="inline-flex items-center px-3 text-sm text-gray-400 border border-r-0 border-gray-600 rounded-l-lg bg-gray-700">
								instagram.com/
							</span>
							<input
								type="text"
								value={socialLinks.instagram}
								onChange={(e) =>
									handleSocialLinkChange("instagram", e.target.value)
								}
								placeholder="your_username"
								className="flex-1 p-2 border border-gray-600 bg-gray-800 text-white rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							▶️ YouTube
						</label>
						<div className="flex">
							<span className="inline-flex items-center px-3 text-sm text-gray-400 border border-r-0 border-gray-600 rounded-l-lg bg-gray-700">
								youtube.com/
							</span>
							<input
								type="text"
								value={socialLinks.youtube}
								onChange={(e) =>
									handleSocialLinkChange("youtube", e.target.value)
								}
								placeholder="@yourchannel"
								className="flex-1 p-2 border border-gray-600 bg-gray-800 text-white rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							🎵 Spotify
						</label>
						<input
							type="url"
							value={socialLinks.spotify}
							onChange={(e) =>
								handleSocialLinkChange("spotify", e.target.value)
							}
							placeholder="https://open.spotify.com/artist/..."
							className="w-full p-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							🌐 Website
						</label>
						<input
							type="url"
							value={socialLinks.website}
							onChange={(e) =>
								handleSocialLinkChange("website", e.target.value)
							}
							placeholder="https://yourwebsite.com"
							className="w-full p-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
			</div>

			{/* Profile Preview */}
			{stageName && (
				<div className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
					<h4 className="font-semibold text-white mb-4">👀 Profile Preview</h4>

					<div className="flex items-start space-x-4">
						<div className="w-16 h-16 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
							{profileImage ? (
								<img
									src={profileImage}
									alt="Profile preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
									{stageName.charAt(0).toUpperCase()}
								</div>
							)}
						</div>

						<div className="flex-1">
							<h5 className="font-bold text-lg text-white">{stageName}</h5>
							<p className="text-sm text-gray-300 mt-1">
								{data.city && data.country
									? `${data.city}, ${data.country}`
									: "Location"}
							</p>
							{bio && (
								<p className="text-sm text-gray-300 mt-2 line-clamp-2">{bio}</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Navigation */}
			<div className="flex space-x-4 pt-4">
				<button
					onClick={prevStep}
					className="flex-1 bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
				>
					← Back
				</button>

				<button
					onClick={handleNext}
					disabled={!canContinue}
					className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
				>
					{canContinue ? "Continue →" : "Enter Stage Name"}
				</button>
			</div>
		</div>
	);
}
