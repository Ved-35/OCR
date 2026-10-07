// ─────────────────────────────────────────────────────────────
// Challan Controller — Dedicated Endpoint Handler for Challan Bill OCR
// Separate from generic OCR controller
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { extractChallanDocument, type ChallanExtractRequest } from './challan.service.js';

/**
 * POST /api/ocr/challan
 *
 * Accepts: { "fileUrl": "...", "customSchema": [...] }
 * Returns: { "success": true, "text": "...", "fields": { ... }, "pages": 1, ... }
 */
export const extractChallanOcr = async (req: Request, res: Response): Promise<void> => {
  const requestId = `challan-${Date.now()}`;
  console.log(`[ChallanController] [${requestId}] Received Challan Bill extraction request`);

  const { fileUrl, customSchema, fileName } = req.body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    res.status(400).json({
      success: false,
      text: '',
      fields: {},
      pages: 0,
      processingTimeMs: 0,
      error: 'Missing or invalid "fileUrl" — must be a non-empty string URL or data URL.',
    });
    return;
  }

  const request: ChallanExtractRequest = {
    fileUrl,
    customSchema,
    fileName,
  };

  const result = await extractChallanDocument(request);

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);

  console.log(
    `[ChallanController] [${requestId}] Completed: success=${result.success}, ` +
    `fields=${Object.keys(result.fields).length}, time=${result.processingTimeMs}ms`,
  );
};
