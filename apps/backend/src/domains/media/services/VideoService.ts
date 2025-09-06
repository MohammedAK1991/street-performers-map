import { VideoRepository, CreateVideoData } from '../repositories/VideoRepository';
import { cloudinaryService, VideoUploadResult } from '../../../shared/services/cloudinary.service';
import { VideoDocument } from '../entities/Video';

export interface UploadVideoRequest {
  userId: string;
  performanceId?: string;
  file: Express.Multer.File;
}

export interface UploadVideoResponse {
  video: VideoDocument;
  message: string;
}

export class VideoService {
  private videoRepository: VideoRepository;

  constructor() {
    this.videoRepository = new VideoRepository();
  }

  /**
   * Upload video to Cloudinary and save record
   */
  async uploadVideo(request: UploadVideoRequest): Promise<UploadVideoResponse> {
    const { userId, performanceId, file } = request;
    
    // Check daily upload limit
    const canUpload = await this.videoRepository.canUserUploadToday(userId);
    console.log('canUpload', canUpload);
    // if (!canUpload) {
    //   throw new Error('Daily upload limit reached. You can only upload 1 video per day.');
    // }

    // Validate file
    const validation = this.validateVideoFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error!);
    }

    try {
      // Upload to Cloudinary
      const uploadResult: VideoUploadResult = await cloudinaryService.uploadVideo(
        file.buffer,
        {
          userId,
          performanceId,
          filename: file.originalname,
        }
      );

      // Get thumbnail URL
      const thumbnailUrl = cloudinaryService.getThumbnailUrl(uploadResult.public_id);

      // Save video record to database
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const videoData: CreateVideoData = {
        userId,
        performanceId,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        thumbnailUrl,
        filename: file.originalname,
        format: uploadResult.format,
        duration: uploadResult.duration,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        uploadDate: today,
      };

      const video = await this.videoRepository.create(videoData);

      // Update status to ready (Cloudinary processing is complete)
      await this.videoRepository.updateStatus((video._id as any).toString(), 'ready');

      // Auto-approve for now (you can implement moderation later)
      await this.videoRepository.approve((video._id as any).toString());

      const updatedVideo = await this.videoRepository.findById((video._id as any).toString());

      return {
        video: updatedVideo!,
        message: 'Video uploaded successfully! It will be available for 24 hours.',
      };
    } catch (error) {
      console.error('Video upload error:', error);
      
      if (error instanceof Error) {
        throw new Error(`Video upload failed: ${error.message}`);
      }
      
      throw new Error('Video upload failed due to an unexpected error');
    }
  }

  /**
   * Get user's videos
   */
  async getUserVideos(userId: string, limit: number = 20): Promise<VideoDocument[]> {
    return await this.videoRepository.findByUserId(userId, limit);
  }

  /**
   * Get videos for a performance
   */
  async getPerformanceVideos(performanceId: string): Promise<VideoDocument[]> {
    return await this.videoRepository.findByPerformanceId(performanceId);
  }

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<VideoDocument | null> {
    return await this.videoRepository.findById(videoId);
  }

  /**
   * Increment video view count
   */
  async recordView(videoId: string): Promise<VideoDocument | null> {
    return await this.videoRepository.incrementViews(videoId);
  }

  /**
   * Record watch time
   */
  async recordWatchTime(videoId: string, seconds: number): Promise<VideoDocument | null> {
    return await this.videoRepository.updateWatchTime(videoId, seconds);
  }

  /**
   * Delete video
   */
  async deleteVideo(videoId: string, userId: string): Promise<void> {
    const video = await this.videoRepository.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }

    if (video.userId !== userId) {
      throw new Error('You can only delete your own videos');
    }

    try {
      // Delete from Cloudinary
      await cloudinaryService.deleteVideo(video.cloudinaryPublicId);
      
      // Delete from database
      await this.videoRepository.delete(videoId);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw new Error('Failed to delete video');
    }
  }

  /**
   * Link video to performance (user can only link their own videos)
   */
  async linkVideoToPerformance(videoId: string, performanceId: string, userId: string): Promise<VideoDocument | null> {
    const video = await this.videoRepository.findById(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    if (video.userId !== userId) {
      throw new Error('You can only link your own videos');
    }
    
    try {
      return await this.videoRepository.update(videoId, { performanceId });
    } catch (error) {
      console.error('Error linking video to performance:', error);
      throw new Error('Failed to link video to performance');
    }
  }

  /**
   * Check if user can upload today
   */
  async canUserUploadToday(userId: string): Promise<boolean> {
    return await this.videoRepository.canUserUploadToday(userId);
  }

  /**
   * Get user's upload count for today
   */
  async getUserTodayUploadCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return await this.videoRepository.getDailyUploadCount(userId, today);
  }

  /**
   * Get user's latest video
   */
  async getUserLatestVideo(userId: string): Promise<VideoDocument | null> {
    return await this.videoRepository.getUserLatestVideo(userId);
  }

  /**
   * Get user video analytics
   */
  async getUserVideoAnalytics(userId: string) {
    return await this.videoRepository.getUserVideoAnalytics(userId);
  }

  /**
   * Get videos pending moderation
   */
  async getVideosForModeration(limit: number = 50): Promise<VideoDocument[]> {
    return await this.videoRepository.findPendingModeration(limit);
  }

  /**
   * Approve video for moderation
   */
  async approveVideo(videoId: string): Promise<VideoDocument | null> {
    return await this.videoRepository.approve(videoId);
  }

  /**
   * Reject video for moderation
   */
  async rejectVideo(videoId: string, reason: string): Promise<VideoDocument | null> {
    return await this.videoRepository.reject(videoId, reason);
  }

  /**
   * Clean up expired videos (background job)
   */
  async cleanupExpiredVideos(): Promise<number> {
    const expiredVideos = await this.videoRepository.findExpiredVideos();
    let cleanedCount = 0;

    for (const video of expiredVideos) {
      try {
        // Delete from Cloudinary
        await cloudinaryService.deleteVideo(video.cloudinaryPublicId);
        
        // Delete from database
        await this.videoRepository.delete((video._id as any).toString());
        
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to cleanup video ${video._id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Validate video file
   */
  private validateVideoFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
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

    // Check if file has content
    if (file.size === 0) {
      return { isValid: false, error: 'Video file is empty' };
    }

    return { isValid: true };
  }
}