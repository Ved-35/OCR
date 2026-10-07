import { Router } from 'express';
import { getHealthStatus, getServerInfo } from '../controllers/health.controller.js';
import { getSampleItems } from '../controllers/data.controller.js';
import ocrRoutes from '../ocr/ocr.routes.js';

const router = Router();

router.get('/health', getHealthStatus);
router.get('/info', getServerInfo);
router.get('/items', getSampleItems);

// OCR Microservice
router.use('/ocr', ocrRoutes);

export default router;
