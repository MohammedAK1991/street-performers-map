import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupMiddleware } from '@/shared/middleware';
import { connectDatabase } from '@/shared/infrastructure/database';
import { setupRoutes } from '@/shared/infrastructure/routes';
import { logger } from '@/shared/utils/logger';

async function startServer() {
  try {
    // Create Express app and HTTP server
    const app = express();
    const server = createServer(app);
    const io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    // Setup middleware
    setupMiddleware(app);

    // Connect to database (optional for initial testing)
    try {
      await connectDatabase();
    } catch (error) {
      logger.warn('MongoDB connection failed, starting without database', error);
    }

    // Setup routes
    setupRoutes(app);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '0.1.0',
      });
    });

    // WebSocket connection handling
    io.on('connection', socket => {
      logger.info('Client connected', { socketId: socket.id });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      logger.info(`🚀 StreetPerformersMap API running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
