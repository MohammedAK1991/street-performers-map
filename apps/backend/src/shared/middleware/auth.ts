import { UserService } from "../../domains/user/services/UserService";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { NextFunction, Request, Response } from "express";

// Extend Express Request type to include user
declare global {
	namespace Express {
		interface Request {
			user?: {
				userId: string;
				role: string;
			};
		}
	}
}

const userService = new UserService();

export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new AuthenticationError("No valid authorization header found");
		}

		const token = authHeader.substring(7); // Remove 'Bearer ' prefix
		const decoded = await userService.verifyToken(token);

		if (!decoded) {
			throw new AuthenticationError("Invalid or expired token");
		}

		req.user = decoded;
		next();
	} catch (error) {
		logger.warn("Authentication failed", {
			error: error instanceof Error ? error.message : "Unknown error",
			ip: req.ip,
			userAgent: req.get("User-Agent"),
		});
		next(error);
	}
};

export const authorize = (roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			if (!req.user) {
				throw new AuthenticationError("Authentication required");
			}

			if (!roles.includes(req.user.role)) {
				throw new AuthorizationError(
					`Access denied. Required roles: ${roles.join(", ")}`,
				);
			}

			next();
		} catch (error) {
			logger.warn("Authorization failed", {
				error: error instanceof Error ? error.message : "Unknown error",
				userId: req.user?.userId,
				userRole: req.user?.role,
				requiredRoles: roles,
			});
			next(error);
		}
	};
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.substring(7);
			const decoded = await userService.verifyToken(token);

			if (decoded) {
				req.user = decoded;
			}
		}

		next();
	} catch (error) {
		// Log but don't fail for optional auth
		logger.debug("Optional authentication failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
		next();
	}
};
