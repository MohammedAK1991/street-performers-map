import { Video, VideoDocument, IVideo } from '../entities/Video';

export interface CreateVideoData {
  userId: string;
  performanceId?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  secureUrl: string;
  thumbnailUrl: string;
  filename: string;
  format: string;
  duration?: number;
  size: number;
  width?: number;
  height?: number;
  uploadDate: string;
}

export interface UpdateVideoData {
  status?: 'processing' | 'ready' | 'failed';
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  views?: number;
  totalWatchTime?: number;
  performanceId?: string;
}

export class VideoRepository {
  /**
   * Create a new video record
   */
  async create(data: CreateVideoData): Promise<VideoDocument> {
    const video = new Video({
      ...data,
      uploadedAt: new Date(),
      status: 'processing',
      moderationStatus: 'pending',
      views: 0,
      totalWatchTime: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
    
    return await video.save();
  }

  /**
   * Find video by ID
   */
  async findById(videoId: string): Promise<VideoDocument | null> {
    return await Video.findById(videoId);
  }

  /**
   * Find video by Cloudinary public ID
   */
  async findByCloudinaryId(publicId: string): Promise<VideoDocument | null> {
    return await Video.findOne({ cloudinaryPublicId: publicId });
  }

  /**
   * Find videos by user ID
   */
  async findByUserId(userId: string, limit: number = 20): Promise<VideoDocument[]> {
    return await Video.find({ 
      userId, 
      status: 'ready', 
      moderationStatus: 'approved' 
    })
    .sort({ uploadedAt: -1 })
    .limit(limit);
  }

  /**
   * Find videos by performance ID
   */
  async findByPerformanceId(performanceId: string): Promise<VideoDocument[]> {
    return await Video.find({ 
      performanceId, 
      status: 'ready', 
      moderationStatus: 'approved' 
    })
    .sort({ uploadedAt: -1 });
  }

  /**
   * Check daily upload limit for user
   */
  async getDailyUploadCount(userId: string, date: string): Promise<number> {
    return await Video.countDocuments({ 
      userId, 
      uploadDate: date,
      status: { $ne: 'failed' } // Don't count failed uploads
    });
  }

  /**
   * Check if user can upload today (limit: 1 per day)
   */
  async canUserUploadToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const count = await this.getDailyUploadCount(userId, today);
    return count < 1; // Limit of 1 video per day
  }

  /**
   * Get user's upload count for today
   */
  async getUserTodayUploadCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return await this.getDailyUploadCount(userId, today);
  }

  /**
   * Update video
   */
  async update(videoId: string, data: UpdateVideoData): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId, 
      data, 
      { new: true }
    );
  }

  /**
   * Update video status
   */
  async updateStatus(videoId: string, status: 'processing' | 'ready' | 'failed'): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId,
      { status },
      { new: true }
    );
  }

  /**
   * Approve video
   */
  async approve(videoId: string): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId,
      { moderationStatus: 'approved' },
      { new: true }
    );
  }

  /**
   * Reject video
   */
  async reject(videoId: string, reason: string): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId,
      { 
        moderationStatus: 'rejected',
        moderationReason: reason 
      },
      { new: true }
    );
  }

  /**
   * Increment video views
   */
  async incrementViews(videoId: string): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  /**
   * Update watch time
   */
  async updateWatchTime(videoId: string, seconds: number): Promise<VideoDocument | null> {
    return await Video.findByIdAndUpdate(
      videoId,
      { $inc: { totalWatchTime: seconds } },
      { new: true }
    );
  }

  /**
   * Find videos pending moderation
   */
  async findPendingModeration(limit: number = 50): Promise<VideoDocument[]> {
    return await Video.find({ 
      moderationStatus: 'pending',
      status: 'ready' 
    })
    .sort({ uploadedAt: 1 }) // Oldest first
    .limit(limit);
  }

  /**
   * Find expired videos for cleanup
   */
  async findExpiredVideos(): Promise<VideoDocument[]> {
    return await Video.find({ 
      expiresAt: { $lt: new Date() },
      status: { $ne: 'failed' }
    });
  }

  /**
   * Delete video
   */
  async delete(videoId: string): Promise<boolean> {
    const result = await Video.findByIdAndDelete(videoId);
    return !!result;
  }

  /**
   * Delete videos by user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await Video.deleteMany({ userId });
    return result.deletedCount || 0;
  }

  /**
   * Delete videos by performance
   */
  async deleteByPerformanceId(performanceId: string): Promise<number> {
    const result = await Video.deleteMany({ performanceId });
    return result.deletedCount || 0;
  }

  /**
   * Get user's latest video for performance
   */
  async getUserLatestVideo(userId: string): Promise<VideoDocument | null> {
    return await Video.findOne({ 
      userId, 
      status: 'ready', 
      moderationStatus: 'approved' 
    })
    .sort({ uploadedAt: -1 });
  }

  /**
   * Get analytics for user's videos
   */
  async getUserVideoAnalytics(userId: string) {
    const result = await Video.aggregate([
      {
        $match: { 
          userId, 
          status: 'ready', 
          moderationStatus: 'approved' 
        }
      },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalWatchTime: { $sum: '$totalWatchTime' },
          averageViews: { $avg: '$views' },
          averageWatchTime: { $avg: '$totalWatchTime' }
        }
      }
    ]);

    return result[0] || {
      totalVideos: 0,
      totalViews: 0,
      totalWatchTime: 0,
      averageViews: 0,
      averageWatchTime: 0
    };
  }
}