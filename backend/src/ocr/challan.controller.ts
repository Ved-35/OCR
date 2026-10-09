// ─────────────────────────────────────────────────────────────
// Challan Controller — Dedicated Endpoint Handler for Challan Bill OCR
// Separate from generic OCR controller
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { extractChallanWithAi, type ChallanAiExtractRequest } from './challan-ai.service.js';

/**
 * POST /api/ocr/challan
 *
 * Dedicated endpoint for Delivery Challan extraction.
 * On Render / Linux / Cloud (512MB RAM constraints), routes directly to Gemini AI
 * extraction (extractChallanWithAi) to avoid native onnxruntime-node SIGSEGV crashes
 * and 502 Bad Gateway errors.
 *
 * Accepts: { "fileUrl": "...", "customSchema": [...], "fileName": "...", "apiKey": "..." }
 * Returns: { "success": true, "text": "...", "fields": { ... }, "takas": [...], "pages": 1, ... }
 */
export const extractChallanOcr = async (req: Request, res: Response): Promise<void> => {
  const requestId = `challan-${Date.now()}`;
  console.log(`[ChallanController] [${requestId}] Received Challan Bill extraction request`);

  const { fileUrl, customSchema, fileName, apiKey } = req.body;
  const headerApiKey = req.headers['x-gemini-api-key'] as string | undefined;
  const effectiveApiKey = (typeof apiKey === 'string' && apiKey.trim())
    ? apiKey.trim()
    : (typeof headerApiKey === 'string' && headerApiKey.trim())
    ? headerApiKey.trim()
    : undefined;

  if (effectiveApiKey) {
    console.log(`[ChallanController] [${requestId}] Using frontend-supplied Gemini API key (prefix: ${effectiveApiKey.slice(0, 6)}...)`);
  }

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

  const isCloudOrLinux =
    Boolean(process.env.RENDER) ||
    process.platform === 'linux' ||
    process.env.NODE_ENV === 'production';
  const forceLocalPaddle = process.env.USE_LOCAL_PADDLE === 'true';

  let result;
  try {
    if (isCloudOrLinux && !forceLocalPaddle) {
      console.log(`[ChallanController] [${requestId}] Cloud/Render environment: using Gemini AI extraction`);
      result = await extractChallanWithAi({
        fileUrl,
        customSchema,
        fileName,
        apiKey: effectiveApiKey,
      });
    } else {
      try {
        console.log(`[ChallanController] [${requestId}] Running local PaddleOCR extraction`);
        const { extractChallanDocument } = await import('./challan.service.js');
        result = await extractChallanDocument({ fileUrl, customSchema, fileName });
        if (!result.success) {
          throw new Error(result.error || 'Local PaddleOCR extraction returned failure');
        }
      } catch (localErr: any) {
        console.warn(
          `[ChallanController] [${requestId}] Local PaddleOCR failed (${localErr?.message || localErr}); falling back to Gemini AI`,
        );
        result = await extractChallanWithAi({
          fileUrl,
          customSchema,
          fileName,
          apiKey: effectiveApiKey,
        });
      }
    }
  } catch (err: any) {
    console.error(`[ChallanController] [${requestId}] Extraction error:`, err);
    result = {
      success: false,
      text: '',
      fields: {},
      pages: 0,
      processingTimeMs: 0,
      documentType: 'DELIVERY_CHALLAN',
      error: err?.message || 'Challan extraction failed unexpectedly',
    };
  }

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);

  console.log(
    `[ChallanController] [${requestId}] Completed: success=${result.success}, ` +
    `fields=${Object.keys(result.fields || {}).length}, time=${result.processingTimeMs}ms`,
  );
};
