// Client-side Cloudinary upload service
export interface CloudinaryUploadResult {
	public_id: string;
	url: string;
	secure_url: string;
	format: string;
	resource_type: string;
	duration?: number;
	bytes: number;
	width?: number;
	height?: number;
	created_at: string;
}

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
}

export class CloudinaryService {
	private cloudName: string;
	private uploadPreset: string;

	constructor() {
		// Load from environment variables
		this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
		this.uploadPreset =
			import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
	}

	/**
	 * Upload video directly to Cloudinary from the browser
	 */
	async uploadVideo(
		file: File,
		options: {
			onProgress?: (progress: UploadProgress) => void;
			userId?: string;
			performanceId?: string;
		} = {},
	): Promise<CloudinaryUploadResult> {
		const { onProgress, userId, performanceId } = options;

		// Check if Cloudinary is configured
		if (this.cloudName === "demo" || !this.cloudName || !this.uploadPreset) {
			console.warn(
				"⚠️ Cloudinary not configured for client-side upload. Using mock response.",
			);

			// Simulate upload progress for better UX
			if (onProgress) {
				for (let i = 0; i <= 100; i += 10) {
					await new Promise((resolve) => setTimeout(resolve, 100));
					onProgress({
						loaded: (file.size * i) / 100,
						total: file.size,
						percentage: i,
					});
				}
			}

			// Return mock result
			return {
				public_id: `mock_video_${Date.now()}`,
				url: "https://via.placeholder.com/400x300/purple/white?text=Mock+Video",
				secure_url:
					"https://via.placeholder.com/400x300/purple/white?text=Mock+Video",
				format: "mp4",
				resource_type: "video",
				duration: 30,
				bytes: file.size,
				width: 720,
				height: 720,
				created_at: new Date().toISOString(),
			};
		}

		return new Promise((resolve, reject) => {
			const formData = new FormData();

			// Required fields
			formData.append("file", file);
			formData.append("upload_preset", this.uploadPreset);
			formData.append("resource_type", "video");

			// Optional fields
			if (userId) {
				formData.append("folder", `street-performers/${userId}/videos`);
			}

			// Add tags for easier management
			const tags = ["street-performer", "video"];
			if (performanceId) {
				tags.push(`performance-${performanceId}`);
			}
			formData.append("tags", tags.join(","));

			// Create XMLHttpRequest for progress tracking
			const xhr = new XMLHttpRequest();

			// Track upload progress
			if (onProgress) {
				xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable) {
						const progress: UploadProgress = {
							loaded: event.loaded,
							total: event.total,
							percentage: Math.round((event.loaded / event.total) * 100),
						};
						onProgress(progress);
					}
				});
			}

			// Handle response
			xhr.addEventListener("load", () => {
				if (xhr.status === 200) {
					try {
						const result = JSON.parse(xhr.responseText);
						resolve(result);
					} catch (error) {
						reject(new Error("Failed to parse Cloudinary response"));
					}
				} else {
					reject(
						new Error(
							`Upload failed with status ${xhr.status}: ${xhr.responseText}`,
						),
					);
				}
			});

			// Handle errors
			xhr.addEventListener("error", () => {
				reject(new Error("Network error during upload"));
			});

			xhr.addEventListener("abort", () => {
				reject(new Error("Upload was aborted"));
			});

			// Send the request
			xhr.open(
				"POST",
				`https://api.cloudinary.com/v1_1/${this.cloudName}/video/upload`,
			);
			xhr.send(formData);
		});
	}

	/**
	 * Get optimized video URL
	 */
	getOptimizedVideoUrl(publicId: string): string {
		if (publicId.startsWith("mock_video_")) {
			return "https://via.placeholder.com/720x720/purple/white?text=Mock+Video";
		}

		return `https://res.cloudinary.com/${this.cloudName}/video/upload/q_auto:good,w_720,h_720,c_limit/${publicId}`;
	}

	/**
	 * Get video thumbnail URL
	 */
	getThumbnailUrl(publicId: string): string {
		if (publicId.startsWith("mock_video_")) {
			return "https://via.placeholder.com/400x400/purple/white?text=Video+Thumbnail";
		}

		return `https://res.cloudinary.com/${this.cloudName}/video/upload/w_400,h_400,c_fill,q_auto,f_jpg/${publicId}.jpg`;
	}
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
