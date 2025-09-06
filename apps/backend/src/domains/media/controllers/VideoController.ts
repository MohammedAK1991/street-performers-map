import { Request, Response, NextFunction } from 'express';
import { VideoService } from '../services/VideoService';
// Define authenticated request interface
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export class VideoController {
  private videoService: VideoService;

  constructor() {
    this.videoService = new VideoService();
  }

  /**
   * Upload a video
   */
  uploadVideo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { performanceId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No video file provided' },
        });
      }

      const result = await this.videoService.uploadVideo({
        userId,
        performanceId,
        file,
      });

      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's videos
   */
  getUserVideos = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 20;

      const videos = await this.videoService.getUserVideos(userId, limit);

      res.status(200).json({
        success: true,
        data: videos,
        meta: { 
          count: videos.length,
          limit,
          timestamp: new Date().toISOString() 
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get videos for a specific performance
   */
  getPerformanceVideos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { performanceId } = req.params;

      const videos = await this.videoService.getPerformanceVideos(performanceId);

      res.status(200).json({
        success: true,
        data: videos,
        meta: { 
          count: videos.length,
          timestamp: new Date().toISOString() 
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific video
   */
  getVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;

      const video = await this.videoService.getVideo(videoId);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: { message: 'Video not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: video,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record a video view
   */
  recordView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;

      const video = await this.videoService.recordView(videoId);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: { message: 'Video not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: { views: video.views },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Record watch time
   */
  recordWatchTime = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;
      const { seconds } = req.body;

      if (!seconds || seconds < 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Valid seconds value is required' },
        });
      }

      const video = await this.videoService.recordWatchTime(videoId, seconds);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: { message: 'Video not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: { totalWatchTime: video.totalWatchTime },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user's video
   */
  deleteVideo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { videoId } = req.params;

      await this.videoService.deleteVideo(videoId, userId);

      res.status(200).json({
        success: true,
        data: { message: 'Video deleted successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check upload eligibility
   */
  checkUploadEligibility = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const [canUpload, todayCount] = await Promise.all([
        this.videoService.canUserUploadToday(userId),
        this.videoService.getUserTodayUploadCount(userId),
      ]);

      res.status(200).json({
        success: true,
        data: {
          canUpload,
          todayCount,
          dailyLimit: 1,
          remainingUploads: Math.max(0, 1 - todayCount),
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's video analytics
   */
  getVideoAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const analytics = await this.videoService.getUserVideoAnalytics(userId);

      res.status(200).json({
        success: true,
        data: analytics,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's latest video
   */
  getLatestVideo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const video = await this.videoService.getUserLatestVideo(userId);

      res.status(200).json({
        success: true,
        data: video,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin/Moderation endpoints (would need admin middleware)
  
  /**
   * Get videos for moderation
   */
  getVideosForModeration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const videos = await this.videoService.getVideosForModeration(limit);

      res.status(200).json({
        success: true,
        data: videos,
        meta: { 
          count: videos.length,
          limit,
          timestamp: new Date().toISOString() 
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve video
   */
  approveVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;

      const video = await this.videoService.approveVideo(videoId);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: { message: 'Video not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: video,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject video
   */
  rejectVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: { message: 'Rejection reason is required' },
        });
      }

      const video = await this.videoService.rejectVideo(videoId, reason);

      if (!video) {
        return res.status(404).json({
          success: false,
          error: { message: 'Video not found' },
        });
      }

      res.status(200).json({
        success: true,
        data: video,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}