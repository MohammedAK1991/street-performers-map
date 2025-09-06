import type { Performance, CreatePerformanceDto, UpdatePerformanceDto } from '@spm/shared-types';
import { PerformanceRepository } from '@/domains/performance/repositories/PerformanceRepository';
import { logger } from '@/shared/utils/logger';
import { ApiError, ValidationError } from '@/shared/utils/errors';

export class PerformanceService {
  private readonly performanceRepository = new PerformanceRepository();
  private readonly logger = logger.child({ context: 'PerformanceService' });

  async createPerformance(data: CreatePerformanceDto, performerId: string): Promise<Performance> {
    try {
      // Validate route stops
      if (!data.route.stops || data.route.stops.length === 0) {
        throw new ValidationError('At least one route stop is required');
      }

      if (data.route.stops.length > 5) {
        throw new ValidationError('Maximum 5 route stops allowed');
      }

      // Validate time sequence
      for (let i = 0; i < data.route.stops.length; i++) {
        const stop = data.route.stops[i];
        const startTime = new Date(stop.startTime);
        const endTime = new Date(stop.endTime);

        if (startTime >= endTime) {
          throw new ValidationError(`Stop ${i + 1}: Start time must be before end time`);
        }

        // Check for overlap with next stop
        if (i < data.route.stops.length - 1) {
          const nextStop = data.route.stops[i + 1];
          const nextStartTime = new Date(nextStop.startTime);
          
          if (endTime > nextStartTime) {
            throw new ValidationError(`Stop ${i + 1} overlaps with stop ${i + 2}`);
          }
        }
      }

      // Check if performer already has a performance today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const existingPerformances = await this.performanceRepository.findByPerformerId(performerId);
      const todayPerformances = existingPerformances.filter(perf => {
        const perfDate = new Date(perf.scheduledFor);
        return perfDate >= startOfDay && perfDate <= endOfDay;
      });

      // if (todayPerformances.length >= 2) {
      //   throw new ValidationError('Maximum 2 performances per day allowed');
      // }

      // Create performance with auto-expiry (24 hours)
      const scheduledFor = new Date(data.scheduledFor);
      const expiresAt = new Date(scheduledFor.getTime() + 24 * 60 * 60 * 1000);

      const performanceData: Omit<Performance, '_id' | 'createdAt' | 'updatedAt'> = {
        performerId,
        title: data.title,
        description: data.description,
        genre: data.genre,
        route: {
          stops: data.route.stops.map(stop => ({
            location: stop.location,
            startTime: new Date(stop.startTime),
            endTime: new Date(stop.endTime),
            status: 'scheduled' as const,
          })),
        },
        videoUrl: data.videoUrl,
        videoThumbnail: data.videoThumbnail,
        engagement: {
          likes: 0,
          views: 0,
          tips: 0,
          likedBy: [],
        },
        status: 'scheduled',
        scheduledFor,
        expiresAt,
      };

      const performance = await this.performanceRepository.create(performanceData);
      
      this.logger.info('Performance created successfully', {
        performanceId: performance._id,
        performerId,
        title: data.title,
        stopsCount: data.route.stops.length
      });

      return performance as Performance;
    } catch (error) {
      this.logger.error('Failed to create performance', { error, performerId });
      throw error;
    }
  }

  async getPerformanceById(id: string): Promise<Performance | null> {
    try {
      const performance = await this.performanceRepository.findById(id);
      return performance ? (performance as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to get performance by ID', { error, performanceId: id });
      throw error;
    }
  }

  async getPerformancesByPerformer(performerId: string): Promise<Performance[]> {
    try {
      const performances = await this.performanceRepository.findByPerformerId(performerId);
      return performances as Performance[];
    } catch (error) {
      this.logger.error('Failed to get performances by performer', { error, performerId });
      throw error;
    }
  }

  async getNearbyPerformances(
    coordinates: [number, number],
    radiusInKm: number = 10,
    filters?: {
      genre?: string;
      status?: string;
      timeRange?: 'now' | 'hour' | 'today';
    }
  ): Promise<Performance[]> {
    try {
      const performances = await this.performanceRepository.findNearby(coordinates, radiusInKm, filters);
      return performances as Performance[];
    } catch (error) {
      this.logger.error('Failed to get nearby performances', { error, coordinates, radiusInKm });
      throw error;
    }
  }

  async updatePerformance(id: string, updateData: UpdatePerformanceDto, performerId: string): Promise<Performance | null> {
    try {
      // Verify ownership
      const existingPerformance = await this.performanceRepository.findById(id);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      if (existingPerformance.performerId.toString() !== performerId) {
        throw new ApiError(403, 'You can only update your own performances');
      }

      const updatedPerformance = await this.performanceRepository.updateById(id, updateData);
      return updatedPerformance ? (updatedPerformance.toJSON() as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to update performance', { error, performanceId: id, performerId });
      throw error;
    }
  }

  async deletePerformance(id: string, performerId: string): Promise<boolean> {
    try {
      // Verify ownership
      const existingPerformance = await this.performanceRepository.findById(id);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      if (existingPerformance.performerId.toString() !== performerId) {
        throw new ApiError(403, 'You can only delete your own performances');
      }

      return await this.performanceRepository.deleteById(id);
    } catch (error) {
      this.logger.error('Failed to delete performance', { error, performanceId: id, performerId });
      throw error;
    }
  }

  async toggleLikePerformance(performanceId: string, userId: string): Promise<Performance | null> {
    try {
      // Check if already liked
      const existingPerformance = await this.performanceRepository.findById(performanceId);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      const alreadyLiked = existingPerformance.engagement.likedBy.some(
        (id: any) => id.toString() === userId
      );

      let updatedPerformance;
      if (alreadyLiked) {
        // Unlike the performance
        updatedPerformance = await this.performanceRepository.unlikePerformance(performanceId, userId);
        this.logger.info('Performance unliked', { performanceId, userId });
      } else {
        // Like the performance
        updatedPerformance = await this.performanceRepository.likePerformance(performanceId, userId);
        this.logger.info('Performance liked', { performanceId, userId });
      }

      return updatedPerformance as Performance | null;
    } catch (error) {
      this.logger.error('Failed to toggle like performance', { error, performanceId, userId });
      throw error;
    }
  }

  async likePerformance(performanceId: string, userId: string): Promise<Performance | null> {
    try {
      // Check if already liked
      const existingPerformance = await this.performanceRepository.findById(performanceId);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      const alreadyLiked = existingPerformance.engagement.likedBy.some(
        (id: any) => id.toString() === userId
      );

      if (alreadyLiked) {
        throw new ApiError(400, 'Performance already liked');
      }

      const updatedPerformance = await this.performanceRepository.likePerformance(performanceId, userId);
      return updatedPerformance ? (updatedPerformance.toJSON() as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to like performance', { error, performanceId, userId });
      throw error;
    }
  }

  async unlikePerformance(performanceId: string, userId: string): Promise<Performance | null> {
    try {
      const updatedPerformance = await this.performanceRepository.unlikePerformance(performanceId, userId);
      return updatedPerformance ? (updatedPerformance.toJSON() as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to unlike performance', { error, performanceId, userId });
      throw error;
    }
  }

  async startPerformance(performanceId: string, performerId: string): Promise<Performance | null> {
    try {
      // Verify ownership
      const existingPerformance = await this.performanceRepository.findById(performanceId);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      if (existingPerformance.performerId.toString() !== performerId) {
        throw new ApiError(403, 'You can only start your own performances');
      }

      if (existingPerformance.status !== 'scheduled') {
        throw new ApiError(400, 'Performance is not in scheduled status');
      }

      // Update status and mark first stop as active
      const updateData = {
        status: 'live' as const,
        'route.stops.0.status': 'active' as const,
      };

      const updatedPerformance = await this.performanceRepository.updateById(performanceId, updateData);
      
      this.logger.info('Performance started', { performanceId, performerId });
      
      return updatedPerformance ? (updatedPerformance.toJSON() as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to start performance', { error, performanceId, performerId });
      throw error;
    }
  }

  async endPerformance(performanceId: string, performerId: string): Promise<Performance | null> {
    try {
      // Verify ownership
      const existingPerformance = await this.performanceRepository.findById(performanceId);
      if (!existingPerformance) {
        throw new ApiError(404, 'Performance not found');
      }

      if (existingPerformance.performerId.toString() !== performerId) {
        throw new ApiError(403, 'You can only end your own performances');
      }

      const updateData = {
        status: 'completed' as const,
      };

      const updatedPerformance = await this.performanceRepository.updateById(performanceId, updateData);
      
      this.logger.info('Performance ended', { performanceId, performerId });
      
      return updatedPerformance ? (updatedPerformance.toJSON() as Performance) : null;
    } catch (error) {
      this.logger.error('Failed to end performance', { error, performanceId, performerId });
      throw error;
    }
  }

  async getTodaysPerformances(): Promise<Performance[]> {
    try {
      const performances = await this.performanceRepository.findTodaysPerformances();
      return performances as Performance[];
    } catch (error) {
      this.logger.error('Failed to get today\'s performances', { error });
      throw error;
    }
  }

  async getLivePerformances(): Promise<Performance[]> {
    try {
      const performances = await this.performanceRepository.findLivePerformances();
      return performances as Performance[];
    } catch (error) {
      this.logger.error('Failed to get live performances', { error });
      throw error;
    }
  }
}
