import { type UserDocument, UserModel } from "../entities/User";
import { logger } from "../../../shared/utils/logger";
import type { User, UserWithPassword } from "@spm/shared-types";

export class UserRepository {
	private readonly logger = logger.child({ context: "UserRepository" });

	async create(
		userData: Omit<UserWithPassword, "_id" | "createdAt" | "updatedAt">,
	): Promise<UserDocument> {
		try {
			const user = new UserModel(userData);
			const savedUser = await user.save();

			this.logger.info("User created", {
				userId: savedUser._id,
				email: savedUser.email,
			});
			return savedUser;
		} catch (error) {
			this.logger.error("Failed to create user", {
				error,
				userData: { ...userData, password: "[REDACTED]" },
			});
			throw error;
		}
	}

	async findById(id: string): Promise<UserDocument | null> {
		try {
			const user = await UserModel.findById(id).lean();
			return user;
		} catch (error) {
			this.logger.error("Failed to find user by ID", { error, userId: id });
			throw error;
		}
	}

	async findByEmail(email: string): Promise<UserDocument | null> {
		try {
			const user = await UserModel.findOne({ email: email.toLowerCase() });
			return user;
		} catch (error) {
			this.logger.error("Failed to find user by email", { error, email });
			throw error;
		}
	}

	async findByUsername(username: string): Promise<UserDocument | null> {
		try {
			const user = await UserModel.findOne({ username }).lean();
			return user;
		} catch (error) {
			this.logger.error("Failed to find user by username", { error, username });
			throw error;
		}
	}

	async findByClerkId(clerkId: string): Promise<UserDocument | null> {
		try {
			const user = await UserModel.findOne({ clerkId });
			return user;
		} catch (error) {
			this.logger.error("Failed to find user by Clerk ID", { error, clerkId });
			throw error;
		}
	}

	async updateById(
		id: string,
		updateData: Partial<User>,
	): Promise<UserDocument | null> {
		try {
			const user = await UserModel.findByIdAndUpdate(
				id,
				{ $set: updateData, updatedAt: new Date() },
				{ new: true, runValidators: true },
			);

			if (user) {
				this.logger.info("User updated", { userId: id });
			}

			return user;
		} catch (error) {
			this.logger.error("Failed to update user", { error, userId: id });
			throw error;
		}
	}

	async deleteById(id: string): Promise<boolean> {
		try {
			const result = await UserModel.findByIdAndDelete(id);

			if (result) {
				this.logger.info("User deleted", { userId: id });
				return true;
			}

			return false;
		} catch (error) {
			this.logger.error("Failed to delete user", { error, userId: id });
			throw error;
		}
	}

	async findNearbyUsers(
		coordinates: [number, number],
		radiusInKm: number,
		role?: "performer" | "audience",
	): Promise<UserDocument[]> {
		try {
			const query: any = {
				"location.coordinates": {
					$near: {
						$geometry: {
							type: "Point",
							coordinates,
						},
						$maxDistance: radiusInKm * 1000, // Convert km to meters
					},
				},
			};

			if (role) {
				query.role = role;
			}

			const users = await UserModel.find(query).lean();
			return users;
		} catch (error) {
			this.logger.error("Failed to find nearby users", {
				error,
				coordinates,
				radiusInKm,
			});
			throw error;
		}
	}

	async checkEmailExists(email: string): Promise<boolean> {
		try {
			const count = await UserModel.countDocuments({
				email: email.toLowerCase(),
			});
			return count > 0;
		} catch (error) {
			this.logger.error("Failed to check email existence", { error, email });
			throw error;
		}
	}

	async checkUsernameExists(username: string): Promise<boolean> {
		try {
			const count = await UserModel.countDocuments({ username });
			return count > 0;
		} catch (error) {
			this.logger.error("Failed to check username existence", {
				error,
				username,
			});
			throw error;
		}
	}

	async incrementStatistic(
		userId: string,
		field: "totalLikes" | "totalTips" | "performanceCount",
		amount = 1,
	): Promise<void> {
		try {
			await UserModel.findByIdAndUpdate(userId, {
				$inc: { [`statistics.${field}`]: amount },
			});

			this.logger.debug("User statistic incremented", {
				userId,
				field,
				amount,
			});
		} catch (error) {
			this.logger.error("Failed to increment user statistic", {
				error,
				userId,
				field,
				amount,
			});
			throw error;
		}
	}

	async findNearby(params: {
		latitude: number;
		longitude: number;
		radius?: number;
		role?: "performer" | "audience";
		genre?: string;
		limit?: number;
	}): Promise<UserDocument[]> {
		try {
			const { latitude, longitude, radius = 25, role = "performer", genre, limit = 50 } = params;

			// Convert radius from km to radians (divide by Earth's radius in km)
			const radiusInRadians = radius / 6371;

			const query: any = {
				role,
				"location.coordinates": {
					$geoWithin: {
						$centerSphere: [[longitude, latitude], radiusInRadians]
					}
				}
			};

			// Filter by genre if specified
			if (genre) {
				query["profile.genres"] = { $in: [genre] };
			}

			const users = await UserModel.find(query)
				.limit(limit)
				.sort({ "statistics.totalTips": -1, "statistics.performanceCount": -1 }) // Sort by popularity
				.lean();

			this.logger.debug("Found nearby users", {
				count: users.length,
				query: JSON.stringify(query),
				latitude,
				longitude,
				radius
			});

			return users as UserDocument[];
		} catch (error) {
			this.logger.error("Failed to find nearby users", { error, params });
			throw error;
		}
	}
}
