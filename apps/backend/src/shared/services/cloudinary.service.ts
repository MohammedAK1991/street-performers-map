import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    }
  ): Promise<VideoUploadResult> {
    const { userId, performanceId, filename } = options;
    
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'video' as const,
        folder: `street-performers/${userId}/videos`,
        public_id: performanceId ? `performance_${performanceId}` : undefined,
        transformation: [
          { quality: 'auto' },
          { format: 'mp4' },
          { duration: '30' }, // Limit to 30 seconds max
        ],
        eager: [
          { 
            format: 'mp4', 
            quality: 'auto:good',
            transformation: [
              { width: 720, height: 720, crop: 'limit' }
            ]
          },
          {
            format: 'jpg',
            quality: 'auto:good',
            transformation: [
              { width: 400, height: 400, crop: 'fill' }
            ]
          }
        ],
        overwrite: true,
        invalidate: true,
        tags: ['street-performance', 'user-upload'],
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Video upload failed: ${error.message}`));
          } else if (result) {
            resolve(result as VideoUploadResult);
          } else {
            reject(new Error('Video upload failed: No result returned'));
          }
        }
      ).end(buffer);
    });
  }

  /**
   * Delete video from Cloudinary
   */
  async deleteVideo(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
      console.error('Error deleting video from Cloudinary:', error);
      throw new Error('Failed to delete video');
    }
  }

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [
        { width: 400, height: 400, crop: 'fill', quality: 'auto' }
      ]
    });
  }

  /**
   * Get optimized video URL
   */
  getOptimizedVideoUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'mp4',
      quality: 'auto:good',
      transformation: [
        { width: 720, height: 720, crop: 'limit' }
      ]
    });
  }

  /**
   * Validate video file
   */
  static validateVideo(file: Express.Multer.File): { isValid: boolean; error?: string } {
    // Check file size (30MB max)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Video file size must be less than 30MB' };
    }

    // Check file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { isValid: false, error: 'Only MP4, MOV, AVI, and WebM video files are allowed' };
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