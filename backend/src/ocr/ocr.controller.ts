// ─────────────────────────────────────────────────────────────
// OCR Controller — Request handling, validation, error mapping
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { DocumentType, type OcrExtractRequest } from './ocr.types.js';
import { extractDocument } from './ocr.service.js';

/**
 * Validate the incoming OCR extraction request body.
 * Returns an error message string, or null if valid.
 */
function validateRequest(body: Record<string, unknown>): string | null {
  const { fileUrl, documentType, customSchema } = body;

  if (!fileUrl || typeof fileUrl !== 'string') {
    return 'Missing or invalid "fileUrl" — must be a non-empty string URL.';
  }

  // Basic URL format validation (supports data: URLs and standard http/https URLs)
  if (!fileUrl.startsWith('data:')) {
    try {
      new URL(fileUrl as string);
    } catch {
      return `Invalid URL format: "${fileUrl}"`;
    }
  }

  if (!documentType || typeof documentType !== 'string') {
    return 'Missing or invalid "documentType" — must be a string.';
  }

  const validTypes = Object.values(DocumentType);
  if (!customSchema && !validTypes.includes(documentType as DocumentType)) {
    return (
      `Unknown documentType: "${documentType}". ` +
      `Valid types: ${validTypes.join(', ')}`
    );
  }

  return null;
}

/**
 * POST /api/ocr/extract
 *
 * Accepts: { "fileUrl": "...", "documentType": "PAN_CARD", "customSchema": {...} }
 * Returns: { "success": true, "text": "…", "fields": {}, … }
 */
export const extractOcr = async (req: Request, res: Response): Promise<void> => {
  const requestId = `ocr-${Date.now()}`;
  console.log(`[OcrController] [${requestId}] Received extraction request`);

  // Validate input
  const validationError = validateRequest(req.body as Record<string, unknown>);
  if (validationError) {
    console.warn(`[OcrController] [${requestId}] Validation failed: ${validationError}`);
    res.status(400).json({
      success: false,
      text: '',
      fields: {},
      pages: 0,
      processingTimeMs: 0,
      error: validationError,
    });
    return;
  }

  const request: OcrExtractRequest = {
    fileUrl: req.body.fileUrl as string,
    documentType: req.body.documentType as DocumentType,
    customSchema: req.body.customSchema,
  };

  console.log(
    `[OcrController] [${requestId}] Processing: type=${request.documentType}, url=${request.fileUrl}`,
  );

  // Execute extraction
  const result = await extractDocument(request);

  const statusCode = result.success ? 200 : 422;
  res.status(statusCode).json(result);

  console.log(
    `[OcrController] [${requestId}] Completed: success=${result.success}, ` +
    `fields=${Object.keys(result.fields).length}, time=${result.processingTimeMs}ms`,
  );
};
