// ─────────────────────────────────────────────────────────────
// OCR Routes — Express router for the OCR module
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { extractOcr } from './ocr.controller.js';
import { extractChallanOcr } from './challan.controller.js';
import { extractChallanAiOcr } from './challan-ai.controller.js';

const router = Router();

/**
 * POST /api/ocr/extract
 *
 * Body: { "fileUrl": "https://…", "documentType": "PAN_CARD" }
 */
router.post('/extract', extractOcr);

/**
 * POST /api/ocr/challan
 *
 * Dedicated endpoint for Challan Bill OCR extraction (PaddleOCR)
 * Body: { "fileUrl": "https://…", "customSchema": [...] }
 */
router.post('/challan', extractChallanOcr);

/**
 * POST /api/ocr/challan-ai
 *
 * Dedicated endpoint for Gemini AI-powered Challan OCR extraction
 * Body: { "fileUrl": "https://…", "customSchema": [...], "fileName": "..." }
 */
router.post('/challan-ai', extractChallanAiOcr);

export default router;
