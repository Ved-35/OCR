import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/env.js';

export const createApp = (): Express => {
  const app = express();

  // Core Middleware
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://billocr.netlify.app',
    ...(config.clientOrigin ? config.clientOrigin.split(',').map((o) => o.trim()) : []),
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.netlify.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key', 'X-Requested-With'],
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(requestLogger);

  // API Routes
  app.use('/api', apiRoutes);

  // 404 Handler
  app.use((_req: Request, res: Response) => {
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
