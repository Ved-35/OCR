import express, { Express } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

export const createApp = (): Express => {
  const app = express();

  // Core Middleware
  app.use(cors({
    origin: config.clientOrigin,
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(requestLogger);

  // API Routes
  app.use('/api', apiRoutes);

  // 404 Handler
  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      statusCode: 404,
      message: 'Endpoint not found',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
