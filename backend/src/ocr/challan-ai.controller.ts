// ─────────────────────────────────────────────────────────────
// Challan AI Controller — Dedicated Endpoint Handler for Gemini AI OCR
// Separate from the PaddleOCR challan.controller.ts
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { extractChallanWithAi, type ChallanAiExtractRequest } from './challan-ai.service.js';

/**
 * POST /api/ocr/challan-ai
 *
 * Accepts: { "fileUrl": "...", "customSchema": [...], "fileName": "..." }
 * Returns: { "success": true, "text": "...", "fields": { ... }, "takas": [...], ... }
 */
export const extractChallanAiOcr = async (req: Request, res: Response): Promise<void> => {
  const requestId = `challan-ai-${Date.now()}`;
  console.log(`[ChallanAiController] [${requestId}] Received Gemini AI OCR extraction request`);

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

  const request: ChallanAiExtractRequest = {
    fileUrl,
    customSchema,
    fileName,
  };

  const result = await extractChallanWithAi(request);

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);

  console.log(
    `[ChallanAiController] [${requestId}] Completed: success=${result.success}, ` +
    `fields=${Object.keys(result.fields).length}, time=${result.processingTimeMs}ms`,
  );
};
