import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { UserService } from "../services/UserService";
import { ApiError, ValidationError } from "../../../shared/utils/errors";

// Validation schemas
const registerSchema = z.object({
	email: z.string().email("Invalid email address"),
	username: z.string().min(3, "Username must be at least 3 characters"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	displayName: z.string().min(1, "Display name is required"),
	role: z.enum(["performer", "audience"], {
		errorMap: () => ({ message: "Role must be either 'performer' or 'audience'" }),
	}),
	profile: z.object({
		displayName: z.string().min(1, "Display name is required"),
		bio: z.string().optional(),
		avatar: z.string().url().optional(),
		genres: z.array(z.string()).optional(),
		socialLinks: z.object({
			instagram: z.string().optional(),
			spotify: z.string().optional(),
			youtube: z.string().optional(),
		}).optional(),
	}).optional(),
	location: z.object({
		city: z.string().min(1, "City is required"),
		country: z.string().min(1, "Country is required"),
		coordinates: z.tuple([z.number(), z.number()]),
	}),
});

const loginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
	displayName: z.string().min(1, "Display name is required").optional(),
	bio: z.string().optional(),
	avatar: z.string().url().optional(),
	genres: z.array(z.string()).optional(),
	socialLinks: z.object({
		instagram: z.string().optional(),
		spotify: z.string().optional(),
		youtube: z.string().optional(),
	}).optional(),
});

const nearbyUsersSchema = z.object({
	lat: z.string().transform(Number),
	lng: z.string().transform(Number),
	radius: z.string().transform(Number).optional(),
	role: z.enum(["performer", "audience"]).optional(),
	genre: z.string().optional(),
	limit: z.string().transform(Number).optional(),
});

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterUserData {
	email: string;
	username: string;
	password: string;
	role: "performer" | "audience";
	displayName: string;
	profile?: {
		displayName: string;
		bio?: string;
		avatar?: string;
		genres?: string[];
		socialLinks?: {
			instagram?: string;
			spotify?: string;
			youtube?: string;
		};
	};
	location: {
		city: string;
		country: string;
		coordinates: [number, number];
	};
}

export class UserController {
	private userService: UserService;

	constructor() {
		this.userService = new UserService();
	}

	register = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const validation = registerSchema.safeParse(req.body);
			if (!validation.success) {
				throw new ValidationError(validation.error.errors[0].message);
			}

			const userData: RegisterUserData = validation.data;
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

	login = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
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

	getProfile = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = (req as any).user?.userId;
			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const user = await this.userService.getUserById(userId);
			if (!user) {
				throw new ApiError(404, "User not found");
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

	updateProfile = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = (req as any).user?.userId;
			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const validation = updateProfileSchema.safeParse(req.body);
			if (!validation.success) {
				throw new ValidationError(validation.error.errors[0].message);
			}

			const updateData = validation.data;
			const user = await this.userService.updateUser(userId, {
				profile: {
					displayName: updateData.displayName,
					bio: updateData.bio,
					avatar: updateData.avatar,
					genres: updateData.genres,
					socialLinks: updateData.socialLinks,
				}
			} as any);

			if (!user) {
				throw new ApiError(404, "User not found");
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

	deleteProfile = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = (req as any).user?.userId;
			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			// TODO: Implement delete method in UserService
			// const success = await this.userService.delete(userId);
			// if (!success) {
			// 	throw new ApiError(404, "User not found");
			// }
			throw new ApiError(501, "Delete user not implemented");

			res.json({
				success: true,
				data: { message: "User deleted successfully" },
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			next(error);
		}
	};

	getUserById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = req.params.id;
			if (!userId) {
				throw new ApiError(400, "User ID is required");
			}

			const user = await this.userService.getUserById(userId);
			if (!user) {
				throw new ApiError(404, "User not found");
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

	syncClerkUser = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const { clerkId, email, username, displayName, avatar } = req.body;

			if (!clerkId || !email) {
				throw new ValidationError("Clerk ID and email are required");
			}

			// Check if user already exists by clerkId
			let user = await this.userService.getUserByClerkId(clerkId);

			if (user) {
				// Update existing user
				const updateData = {
					email,
					username: username || user.username,
					"profile.displayName": displayName || user.profile.displayName,
					"profile.avatar": avatar || user.profile.avatar,
				};

				user = await this.userService.updateUser(user._id, updateData);
			} else {
				// Check if user exists by email (but without clerkId)
				const existingUserByEmail = await this.userService.getUserByEmail(email);

				if (existingUserByEmail) {
					// Update existing user with clerkId
					const updateData = {
						clerkId,
						username: username || existingUserByEmail.username,
						"profile.displayName": displayName || existingUserByEmail.profile.displayName,
						"profile.avatar": avatar || existingUserByEmail.profile.avatar,
					};
					user = await this.userService.updateUser(existingUserByEmail._id, updateData);
				} else {
					// Create new user
					const newUserData = {
						clerkId,
						email,
						username: username || email.split("@")[0],
						password: "clerk-user", // Will be ignored since we have clerkId
						role: "audience" as const,
						displayName: displayName || username || email.split("@")[0],
						profile: {
							displayName: displayName || username || email.split("@")[0],
							avatar: avatar || "",
						},
						location: {
							city: "Unknown",
							country: "Unknown",
							coordinates: [0, 0] as [number, number],
						},
					};

					const authResponse = await this.userService.register(newUserData);
					user = authResponse.user;
				}
			}

			// Generate JWT token for the user
			if (!user) {
				throw new Error("User not found after sync");
			}
			const token = this.userService.generateToken(user._id, user.role);

			res.json({
				success: true,
				data: {
					user,
					token,
				},
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			next(error);
		}
	};

	getNearbyUsers = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const validation = nearbyUsersSchema.safeParse(req.query);
			if (!validation.success) {
				throw new ValidationError(validation.error.errors[0].message);
			}

			const { lat, lng, radius = 25, role = "performer", genre, limit = 50 } = validation.data;

			const users = await this.userService.getNearbyUsers({
				latitude: lat,
				longitude: lng,
				radius,
				role,
				genre,
				limit
			});

			res.json({
				success: true,
				data: {
					users,
					total: users.length,
					location: { lat, lng },
					radius,
					filters: { role, genre }
				},
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			next(error);
		}
	};

	updateLocation = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const userId = (req as any).user?.userId;
			if (!userId) {
				throw new ApiError(401, "Authentication required");
			}

			const { city, country, coordinates } = req.body;
			if (!city || !country || !coordinates) {
				throw new ValidationError("City, country, and coordinates are required");
			}

			const user = await this.userService.updateUser(userId, {
				location: {
					city,
					country,
					coordinates,
				}
			} as any);

			if (!user) {
				throw new ApiError(404, "User not found");
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

	getNearbyPerformers = async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const validation = nearbyUsersSchema.safeParse(req.query);
			if (!validation.success) {
				throw new ValidationError(validation.error.errors[0].message);
			}

			const { lat, lng, radius = 25, genre, limit = 50 } = validation.data;

			const users = await this.userService.getNearbyUsers({
				latitude: lat,
				longitude: lng,
				radius,
				role: "performer",
				genre,
				limit
			});

			res.json({
				success: true,
				data: {
					users,
					total: users.length,
					location: { lat, lng },
					radius,
					filters: { role: "performer", genre }
				},
				meta: { timestamp: new Date().toISOString() },
			});
		} catch (error) {
			next(error);
		}
	};
}

export const userController = new UserController();