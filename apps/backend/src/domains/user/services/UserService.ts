import jwt from 'jsonwebtoken';
import type { User, RegisterData, LoginCredentials, AuthResponse } from '@spm/shared-types';
import { UserRepository } from '@/domains/user/repositories/UserRepository';
import { logger } from '@/shared/utils/logger';
import { ApiError } from '@/shared/utils/errors';

export class UserService {
  private readonly userRepository = new UserRepository();
  private readonly logger = logger.child({ context: 'UserService' });

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Validate email and username uniqueness
      const emailExists = await this.userRepository.checkEmailExists(userData.email);
      if (emailExists) {
        throw new ApiError(400, 'Email already registered');
      }

      const usernameExists = await this.userRepository.checkUsernameExists(userData.username);
      if (usernameExists) {
        throw new ApiError(400, 'Username already taken');
      }

      // Create user with default values
      const newUser = await this.userRepository.create({
        email: userData.email,
        username: userData.username,
        password: userData.password, // Will be hashed by pre-save hook
        role: userData.role,
        profile: {
          displayName: userData.displayName,
          genres: [],
        },
        location: {
          city: 'Unknown',
          country: 'Unknown',
          coordinates: [0, 0], // Will be updated when user sets location
        },
        preferences: {
          notifications: true,
          genres: [],
          radius: 5,
        },
        statistics: {
          totalLikes: 0,
          totalTips: 0,
          performanceCount: 0,
        },
      });

      // Generate JWT token
      const token = this.generateToken(newUser._id.toString(), newUser.role);

      this.logger.info('User registered successfully', { 
        userId: newUser._id, 
        email: newUser.email,
        role: newUser.role 
      });

      return {
        user: newUser.toJSON() as User,
        token,
      };
    } catch (error) {
      this.logger.error('Registration failed', { error, email: userData.email });
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user._id.toString(), user.role);

      this.logger.info('User logged in successfully', { 
        userId: user._id, 
        email: user.email 
      });

      return {
        user: user.toJSON() as User,
        token,
      };
    } catch (error) {
      this.logger.error('Login failed', { error, email: credentials.email });
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findById(id);
      return user ? (user.toJSON() as User) : null;
    } catch (error) {
      this.logger.error('Failed to get user by ID', { error, userId: id });
      throw error;
    }
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findByClerkId(clerkId);
      return user ? (user.toJSON() as User) : null;
    } catch (error) {
      this.logger.error('Failed to get user by Clerk ID', { error, clerkId });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return user ? (user.toJSON() as User) : null;
    } catch (error) {
      this.logger.error('Failed to get user by email', { error, email });
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const { _id, createdAt: _createdAt, updatedAt: _updatedAt, statistics: _statistics, ...safeUpdateData } = updateData;

      const updatedUser = await this.userRepository.updateById(id, safeUpdateData);
      return updatedUser ? (updatedUser.toJSON() as User) : null;
    } catch (error) {
      this.logger.error('Failed to update user', { error, userId: id });
      throw error;
    }
  }

  async updateUserLocation(id: string, location: User['location']): Promise<User | null> {
    try {
      const updatedUser = await this.userRepository.updateById(id, { location });
      
      this.logger.info('User location updated', { 
        userId: id, 
        city: location.city,
        coordinates: location.coordinates 
      });

      return updatedUser ? (updatedUser.toJSON() as User) : null;
    } catch (error) {
      this.logger.error('Failed to update user location', { error, userId: id });
      throw error;
    }
  }

  async getNearbyPerformers(
    coordinates: [number, number],
    radiusInKm: number
  ): Promise<User[]> {
    try {
      const users = await this.userRepository.findNearbyUsers(coordinates, radiusInKm, 'performer');
      return users.map(user => user.toJSON() as User);
    } catch (error) {
      this.logger.error('Failed to get nearby performers', { error, coordinates, radiusInKm });
      throw error;
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        userId: decoded.sub,
        role: decoded.role,
      };
    } catch (error) {
      this.logger.debug('Token verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  private generateToken(userId: string, role: string): string {
    const payload = {
      sub: userId,
      role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as any);
  }

  async incrementUserStatistic(
    userId: string, 
    field: 'totalLikes' | 'totalTips' | 'performanceCount', 
    amount: number = 1
  ): Promise<void> {
    try {
      await this.userRepository.incrementStatistic(userId, field, amount);
      this.logger.debug('User statistic incremented', { userId, field, amount });
    } catch (error) {
      this.logger.error('Failed to increment user statistic', { error, userId, field });
      throw error;
    }
  }
}
