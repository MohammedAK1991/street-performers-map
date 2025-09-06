import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { CreatePerformanceDto } from '@spm/shared-types';
import { PerformanceService } from '@/domains/performance/services/PerformanceService';
import { logger } from '@/shared/utils/logger';
import { ApiError, ValidationError } from '@/shared/utils/errors';

// Validation schemas
const createPerformanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  genre: z.enum(['rock', 'jazz', 'folk', 'pop', 'classical', 'blues', 'country', 'electronic', 'hip-hop', 'reggae', 'other']),
  route: z.object({
    stops: z.array(z.object({
      location: z.object({
        coordinates: z.tuple([z.number(), z.number()]),
        address: z.string().min(1, 'Address is required'),
        name: z.string().optional(),
      }),
      startTime: z.string().datetime('Invalid start time format'),
      endTime: z.string().datetime('Invalid end time format'),
    })).min(1, 'At least one stop is required').max(5, 'Maximum 5 stops allowed'),
  }),
  scheduledFor: z.string().datetime('Invalid scheduled date format'),
});

const nearbyPerformancesSchema = z.object({
  lat: z.string().transform(val => parseFloat(val)),
  lng: z.string().transform(val => parseFloat(val)),
  radius: z.string().transform(val => parseFloat(val)).optional(),
  genre: z.string().optional(),
  status: z.string().optional(),
  timeRange: z.enum(['now', 'hour', 'today']).optional(),
});

export class PerformanceController {
  private readonly performanceService = new PerformanceService();
  private readonly logger = logger.child({ context: 'PerformanceController' });

  createPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const validation = createPerformanceSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const performanceData: CreatePerformanceDto = validation.data;
      const performance = await this.performanceService.createPerformance(performanceData, userId);

      res.status(201).json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  getPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const performance = await this.performanceService.getPerformanceById(id);

      if (!performance) {
        throw new ApiError(404, 'Performance not found');
      }

      // Increment view count
      await this.performanceService.incrementViews(id);

      res.json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  getMyPerformances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const performances = await this.performanceService.getPerformancesByPerformer(userId);

      res.json({
        success: true,
        data: performances,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  getNearbyPerformances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = nearbyPerformancesSchema.safeParse(req.query);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const { lat, lng, radius = 10, genre, status, timeRange } = validation.data;
      const coordinates: [number, number] = [lng, lat];

      const performances = await this.performanceService.getNearbyPerformances(coordinates, radius, {
        genre,
        status,
        timeRange,
      });

      res.json({
        success: true,
        data: performances,
        meta: { 
          timestamp: new Date().toISOString(),
          location: { coordinates, radius },
          filters: { genre, status, timeRange }
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updatePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const updateData = req.body;
      const performance = await this.performanceService.updatePerformance(id, updateData, userId);

      if (!performance) {
        throw new ApiError(404, 'Performance not found');
      }

      res.json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  deletePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const deleted = await this.performanceService.deletePerformance(id, userId);

      if (!deleted) {
        throw new ApiError(404, 'Performance not found');
      }

      res.json({
        success: true,
        data: { deleted: true },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  likePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const performance = await this.performanceService.likePerformance(id, userId);

      if (!performance) {
        throw new ApiError(404, 'Performance not found');
      }

      res.json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  startPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const performance = await this.performanceService.startPerformance(id, userId);

      if (!performance) {
        throw new ApiError(404, 'Performance not found');
      }

      res.json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  endPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const performance = await this.performanceService.endPerformance(id, userId);

      if (!performance) {
        throw new ApiError(404, 'Performance not found');
      }

      res.json({
        success: true,
        data: performance,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}
