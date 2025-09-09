import { v2 as cloudinary } from "cloudinary";
import type { Request } from "express";
import multer from "multer";

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
const _validateCloudinaryConfig = () => {
	const { cloud_name, api_key, api_secret } = process.env;

	if (!cloud_name || !api_key || !api_secret) {
		throw new Error(
			"Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
		);
	}

	if (
		cloud_name === "your-cloudinary-cloud-name" ||
		api_key === "your-cloudinary-api-key" ||
		api_secret === "your-cloudinary-api-secret"
	) {
		throw new Error(
			"Cloudinary configuration contains placeholder values. Please set real Cloudinary credentials.",
		);
	}
};

export interface VideoUploadResult {
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

export class CloudinaryService {
	private static instance: CloudinaryService;

	public static getInstance(): CloudinaryService {
		if (!CloudinaryService.instance) {
			CloudinaryService.instance = new CloudinaryService();
		}
		return CloudinaryService.instance;
	}

	/**
	 * Upload video to Cloudinary
	 */
	async uploadVideo(
		buffer: Buffer,
		options: {
			userId: string;
			performanceId?: string;
			filename?: string;
		},
	): Promise<VideoUploadResult> {
		const { userId, performanceId, filename: _filename } = options;

		// Check if Cloudinary is configured
		const { cloud_name, api_key, api_secret } = process.env;
		const isConfigured =
			cloud_name &&
			api_key &&
			api_secret &&
			cloud_name !== "your-cloudinary-cloud-name" &&
			api_key !== "your-cloudinary-api-key" &&
			api_secret !== "your-cloudinary-api-secret";

		if (!isConfigured) {
			// Return mock result for development
			console.warn(
				"⚠️  Cloudinary not configured. Returning mock video upload result for development.",
			);
			return Promise.resolve({
				public_id: `mock_video_${Date.now()}`,
				url: "https://via.placeholder.com/400x300/purple/white?text=Mock+Video",
				secure_url:
					"https://via.placeholder.com/400x300/purple/white?text=Mock+Video",
				format: "mp4",
				resource_type: "video",
				duration: 30,
				bytes: buffer.length,
				width: 720,
				height: 720,
				created_at: new Date().toISOString(),
			});
		}

		return new Promise((resolve, reject) => {
			const uploadOptions = {
				resource_type: "video" as const,
				folder: `street-performers/${userId}/videos`,
				public_id: performanceId ? `performance_${performanceId}` : undefined,
				transformation: [
					{ quality: "auto" },
					{ format: "mp4" },
					{ duration: "30" }, // Limit to 30 seconds max
				],
				eager: [
					{
						format: "mp4",
						quality: "auto:good",
						transformation: [{ width: 720, height: 720, crop: "limit" }],
					},
					{
						format: "jpg",
						quality: "auto:good",
						transformation: [{ width: 400, height: 400, crop: "fill" }],
					},
				],
				overwrite: true,
				invalidate: true,
				tags: ["street-performance", "user-upload"],
			};

			cloudinary.uploader
				.upload_stream(uploadOptions, (error, result) => {
					if (error) {
						console.error("Cloudinary upload error:", error);
						reject(new Error(`Video upload failed: ${error.message}`));
					} else if (result) {
						resolve(result as VideoUploadResult);
					} else {
						reject(new Error("Video upload failed: No result returned"));
					}
				})
				.end(buffer);
		});
	}

	/**
	 * Delete video from Cloudinary
	 */
	async deleteVideo(publicId: string): Promise<void> {
		// Skip deletion for mock videos
		if (publicId.startsWith("mock_video_")) {
			console.log("Skipping deletion of mock video:", publicId);
			return;
		}

		try {
			await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
		} catch (error) {
			console.error("Error deleting video from Cloudinary:", error);
			throw new Error("Failed to delete video");
		}
	}

	/**
	 * Get video thumbnail URL
	 */
	getThumbnailUrl(publicId: string): string {
		// Return placeholder for mock videos
		if (publicId.startsWith("mock_video_")) {
			return "https://via.placeholder.com/400x400/purple/white?text=Video+Thumbnail";
		}

		return cloudinary.url(publicId, {
			resource_type: "video",
			format: "jpg",
			transformation: [
				{ width: 400, height: 400, crop: "fill", quality: "auto" },
			],
		});
	}

	/**
	 * Get optimized video URL
	 */
	getOptimizedVideoUrl(publicId: string): string {
		// Return placeholder for mock videos
		if (publicId.startsWith("mock_video_")) {
			return "https://via.placeholder.com/720x720/purple/white?text=Mock+Video";
		}

		return cloudinary.url(publicId, {
			resource_type: "video",
			format: "mp4",
			quality: "auto:good",
			transformation: [{ width: 720, height: 720, crop: "limit" }],
		});
	}

	/**
	 * Validate video file
	 */
	static validateVideo(file: Express.Multer.File): {
		isValid: boolean;
		error?: string;
	} {
		// Check file size (30MB max)
		const maxSize = 30 * 1024 * 1024; // 30MB
		if (file.size > maxSize) {
			return {
				isValid: false,
				error: "Video file size must be less than 30MB",
			};
		}

		// Check file type
		const allowedTypes = [
			"video/mp4",
			"video/quicktime",
			"video/x-msvideo",
			"video/webm",
		];
		if (!allowedTypes.includes(file.mimetype)) {
			return {
				isValid: false,
				error: "Only MP4, MOV, AVI, and WebM video files are allowed",
			};
		}

		return { isValid: true };
	}
}

// Multer configuration for memory storage
export const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 30 * 1024 * 1024, // 30MB limit
	},
	fileFilter: (req: Request, file: Express.Multer.File, cb) => {
		const validation = CloudinaryService.validateVideo(file);
		if (!validation.isValid) {
			cb(new Error(validation.error!));
		} else {
			cb(null, true);
		}
	},
});

export const cloudinaryService = CloudinaryService.getInstance();
