import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { RegisterData, LoginCredentials, User } from '@spm/shared-types';
import { UserService } from '@/domains/user/services/UserService';
import { logger } from '@/shared/utils/logger';
import { ApiError, ValidationError } from '@/shared/utils/errors';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  role: z.enum(['performer', 'audience'], { required_error: 'Role is required' }),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  profile: z.object({
    displayName: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
    genres: z.array(z.string()).optional(),
    socialLinks: z.object({
      instagram: z.string().url().optional(),
      spotify: z.string().url().optional(),
      youtube: z.string().url().optional(),
    }).optional(),
  }).optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    genres: z.array(z.string()).optional(),
    radius: z.number().min(1).max(50).optional(),
  }).optional(),
}).partial();

const updateLocationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  coordinates: z.tuple([z.number(), z.number()], {
    required_error: 'Coordinates are required',
  }),
});

export class UserController {
  private readonly userService = new UserService();
  private readonly logger = logger.child({ context: 'UserController' });

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const userData: RegisterData = validation.data;
      const result = await this.userService.register(userData);

      res.status(201).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const credentials: LoginCredentials = validation.data;
      const result = await this.userService.login(credentials);

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const validation = updateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const updateData = validation.data;
      const updatedUser = await this.userService.updateUser(userId, updateData as Partial<User>);

      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const validation = updateLocationSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ValidationError(validation.error.errors[0].message);
      }

      const locationData = validation.data;
      const updatedUser = await this.userService.updateUserLocation(userId, locationData);

      if (!updatedUser) {
        throw new ApiError(404, 'User not found');
      }

      res.json({
        success: true,
        data: updatedUser,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  getNearbyPerformers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lat, lng, radius = 5 } = req.query;

      if (!lat || !lng) {
        throw new ValidationError('Latitude and longitude are required');
      }

      const coordinates: [number, number] = [parseFloat(lng as string), parseFloat(lat as string)];
      const radiusInKm = parseFloat(radius as string);

      const performers = await this.userService.getNearbyPerformers(coordinates, radiusInKm);

      res.json({
        success: true,
        data: performers,
        meta: { 
          timestamp: new Date().toISOString(),
          location: { coordinates, radius: radiusInKm }
        },
      });
    } catch (error) {
      next(error);
    }
  };

  syncClerkUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clerkId, email, username, displayName, avatar } = req.body;

      if (!clerkId || !email) {
        throw new ValidationError('Clerk ID and email are required');
      }

      // Check if user already exists by clerkId
      let user = await this.userService.getUserByClerkId(clerkId);
      
      if (user) {
        // Update existing user
        const updateData = {
          email,
          username: username || user.username,
          'profile.displayName': displayName || user.profile.displayName,
          'profile.avatar': avatar || user.profile.avatar,
        };
        
        user = await this.userService.updateUser(user._id, updateData);
      } else {
        // Create new user
        const newUserData = {
          clerkId,
          email,
          username: username || email.split('@')[0],
          password: 'clerk-user', // Will be ignored since we have clerkId
          role: 'audience',
          profile: {
            displayName: displayName || username || email.split('@')[0],
            avatar: avatar || '',
          },
          location: {
            city: 'Unknown',
            country: 'Unknown',
            coordinates: [0, 0],
          },
        };

        const authResponse = await this.userService.register(newUserData);
        user = authResponse.user;
      }

      res.json({
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}
