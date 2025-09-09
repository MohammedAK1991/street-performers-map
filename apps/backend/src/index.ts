import "dotenv/config";
import "module-alias/register.js";
import { createServer } from "node:http";
import { connectDatabase } from "@/shared/infrastructure/database";
import { setupRoutes } from "@/shared/infrastructure/routes";
import { setupMiddleware } from "@/shared/middleware";
import { logger } from "@/shared/utils/logger";
import { setupSwagger } from "@/shared/utils/swagger";
import express from "express";
import { Server as SocketServer } from "socket.io";
import path from "path";

async function startServer() {
	try {
		// Create Express app and HTTP server
		const app = express();
		const server = createServer(app);
		const io = new SocketServer(server, {
			cors: {
				origin: process.env.FRONTEND_URL || "http://localhost:3000",
				methods: ["GET", "POST"],
			},
		});

		// Setup middleware
		setupMiddleware(app);

		// Connect to database (optional for initial testing)
		try {
			await connectDatabase();
		} catch (error) {
			logger.warn(
				"MongoDB connection failed, starting without database",
				error,
			);
		}

		// Setup API documentation
		setupSwagger(app);

		// Setup routes
		setupRoutes(app);

		// Health check endpoint
		app.get("/health", (req, res) => {
			res.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				environment: process.env.NODE_ENV,
				version: "0.1.0",
			});
		});

		// Serve frontend in production
		if (process.env.NODE_ENV === "production") {
			const frontendPath = path.join(__dirname, "../dist");
			
			// Serve static files
			app.use(express.static(frontendPath));
			
			// Serve React app for all non-API routes
			app.get("*", (req, res) => {
				// Don't serve React app for API routes
				if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
					res.status(404).json({ error: "API endpoint not found" });
					return;
				}
				res.sendFile(path.join(frontendPath, "index.html"));
			});
		}

		// WebSocket connection handling
		io.on("connection", (socket) => {
			logger.info("Client connected", { socketId: socket.id });

			socket.on("disconnect", () => {
				logger.info("Client disconnected", { socketId: socket.id });
			});
		});

		// Start server
		const PORT = process.env.PORT || 3001;
		server.listen(PORT, () => {
			logger.info(`🚀 StreetPerformersMap API running on port ${PORT}`);
			logger.info(`📊 Health check: http://localhost:${PORT}/health`);
			logger.info(`📚 API docs: http://localhost:${PORT}/api/docs`);
			logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
		});

		// Graceful shutdown
		process.on("SIGTERM", () => {
			logger.info("SIGTERM received, shutting down gracefully");
			server.close(() => {
				logger.info("Process terminated");
				process.exit(0);
			});
		});

		process.on("SIGINT", () => {
			logger.info("SIGINT received, shutting down gracefully");
			server.close(() => {
				logger.info("Process terminated");
				process.exit(0);
			});
		});
	} catch (error) {
		logger.error("Failed to start server", error);
		process.exit(1);
	}
}

startServer();
