import { mediaRoutes } from "../../domains/media/routes/mediaRoutes";
import { paymentRoutes } from "../../domains/payment/routes/paymentRoutes";
import { performanceRoutes } from "../../domains/performance/routes/performanceRoutes";
import { userRoutes } from "../../domains/user/routes/userRoutes";
import { setup404Handler } from "../middleware";
import { logger } from "../utils/logger";
import express from "express";

export function setupRoutes(app: express.Application): void {
	const apiVersion = process.env.API_VERSION || "v1";

	logger.info(`Setting up API routes for version: ${apiVersion}`);

	// API versioning
	const apiRouter = express.Router();

	// Health check (outside versioned API)
	app.get("/health", (req, res) => {
		res.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,
			version: "0.1.0",
		});
	});

	// Domain routes
	apiRouter.use("/users", userRoutes);
	apiRouter.use("/performances", performanceRoutes);
	apiRouter.use("/media", mediaRoutes);
	apiRouter.use("/payments", paymentRoutes);

	// Mount API router
	app.use(`/api/${apiVersion}`, apiRouter);

	// 404 handler
	setup404Handler(app);

	logger.info("✅ Routes setup complete");
}
