import { Request, Response } from 'express';
import { config } from '../config/env.js';

export const getHealthStatus = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    message: 'Node.js Express backend service operating normally.',
  });
};

export const getServerInfo = (_req: Request, res: Response): void => {
  res.status(200).json({
    name: 'Fullstack Core API',
    version: '1.0.0',
    description: 'Node.js Express TypeScript REST API',
    endpoints: ['/api/health', '/api/info', '/api/items'],
  });
};
