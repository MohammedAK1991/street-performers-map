import { logger } from "../utils/logger";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

export function setupMiddleware(app: express.Application): void {
	// Security middleware
	app.use(
		helmet({
			crossOriginEmbedderPolicy: false, // Allow embedding for maps
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"],
					styleSrc: [
						"'self'",
						"'unsafe-inline'",
						"https://fonts.googleapis.com",
						"https://unpkg.com",
					],
					fontSrc: ["'self'", "https://fonts.gstatic.com"],
					scriptSrc: [
						"'self'", 
						"https:",
						"http:",
						"'unsafe-eval'",
						"'unsafe-inline'",
					],
					imgSrc: ["'self'", "data:", "https:", "blob:"],
					connectSrc: [
						"'self'", 
						"ws:", 
						"wss:",
						"https://maps.googleapis.com",
						"https://*.googleapis.com",
						"https://maps.google.com",
						"https://*.google.com",
						"https://api.stripe.com",
						"https://*.stripe.com",
						"https://*.clerk.accounts.dev",
						"https://clerk.accounts.dev",
						"https://ample-tuna-37.clerk.accounts.dev",
					],
					frameSrc: [
						"'self'",
						"https:",
						"http:",
					],
					workerSrc: [
						"'self'",
						"blob:",
						"https://maps.googleapis.com",
					],
				},
			},
		}),
	);

	// CORS configuration
	app.use(
		cors({
			origin: process.env.FRONTEND_URL || "http://localhost:3000",
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	);

	// Rate limiting
	const limiter = rateLimit({
		windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
		max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
		message: {
			error: "Too many requests from this IP, please try again later.",
		},
		standardHeaders: true,
		legacyHeaders: false,
	});
	app.use("/api", limiter);

	// Body parsing middleware
	app.use(express.json({ limit: "10mb" }));
	app.use(express.urlencoded({ extended: true, limit: "10mb" }));

	// Request logging middleware
	app.use((req, res, next) => {
		const start = Date.now();

		res.on("finish", () => {
			const duration = Date.now() - start;
			logger.info("HTTP Request", {
				method: req.method,
				url: req.url,
				statusCode: res.statusCode,
				duration: `${duration}ms`,
				userAgent: req.get("User-Agent"),
				ip: req.ip,
			});
		});

		next();
	});

	// Error handling middleware
	app.use(
		(
			err: any,
			req: express.Request,
			res: express.Response,
			_next: express.NextFunction,
		) => {
			logger.error("Unhandled error", {
				error: err.message,
				stack: err.stack,
				url: req.url,
				method: req.method,
			});

			const statusCode = err.statusCode || 500;
			const message =
				process.env.NODE_ENV === "production" && statusCode === 500
					? "Internal server error"
					: err.message;

			res.status(statusCode).json({
				success: false,
				error: {
					message,
					...(process.env.NODE_ENV === "development" && { stack: err.stack }),
				},
			});
		},
	);
}

// 404 handler
export function setup404Handler(app: express.Application): void {
	app.use("*", (req, res) => {
		res.status(404).json({
			success: false,
			error: {
				message: "Route not found",
				path: req.originalUrl,
			},
		});
	});
}
