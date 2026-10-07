// ─────────────────────────────────────────────────────────────
// Challan Service — Dedicated Orchestration Service for Challan Bill OCR
// Uses PaddleOCR's structured bounding-box output to reconstruct table
// columns, enabling accurate taka meter+weight extraction from any image.
// ─────────────────────────────────────────────────────────────

import {
  SUPPORTED_PDF_MIME,
  type OcrExtractResponse,
} from './ocr.types.js';
import { downloadFile, detectMimeType, cleanupFile } from './ocr.service.js';
import { processPdf } from './pdf.service.js';
import {
  parseChallanDocument,
  extractTakasFromLines,
  type TakaDetailItem,
} from './challan-parser.service.js';

export interface ChallanExtractRequest {
  fileUrl: string;
  customSchema?: any;
  fileName?: string;
}

// ─── PaddleOCR boot ──────────────────────────────────────────────────────────
// Lazily import ppu-paddle-ocr so the heavy ONNX models load only when needed.
// Re-uses the same module-level singleton if image.service.ts already inited it.

let paddleInstance: InstanceType<typeof import('ppu-paddle-ocr').PaddleOcrService> | null = null;
let paddleInitPromise: Promise<void> | null = null;

export async function ensurePaddle(): Promise<typeof paddleInstance> {
  if (paddleInstance) return paddleInstance;
  if (!paddleInitPromise) {
    paddleInitPromise = (async () => {
      const { PaddleOcrService } = await import('ppu-paddle-ocr');
      paddleInstance = new PaddleOcrService();
      await paddleInstance.initialize();
      console.log('[ChallanService] PaddleOCR engine ready.');
    })();
  }
  await paddleInitPromise;
  return paddleInstance;
}

// ─── Image preprocessing ─────────────────────────────────────────────────────
// Same preprocessing pipeline as image.service.ts — upscale, greyscale, sharpen.

export async function preprocessForOcr(buffer: Buffer, angle: number = 0): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  let pipe = sharp(buffer);
  pipe = angle !== 0 ? pipe.rotate(angle) : pipe.rotate(); // auto-EXIF or explicit angle
  const meta = await pipe.metadata();
  if (meta.width && meta.width < 1800) {
    const scale = Math.min(3.5, Math.max(1.5, 1800 / meta.width));
    pipe = pipe.resize({ width: Math.round(meta.width * scale), kernel: 'lanczos3' });
  }
  if (meta.channels && meta.channels >= 3) {
    // Green channel makes both red ink and dark/blue ink distinct and dark on light paper
    return pipe.extractChannel('green').linear(1.3, -20).sharpen().png().toBuffer();
  }
  return pipe.greyscale().normalize().sharpen().png().toBuffer();
}

// ─── Multi-angle OCR with line data ──────────────────────────────────────────
// Returns the best-angle recognition lines (with bounding boxes) + merged text.

interface OcrLinesResult {
  text: string;
  lines: import('ppu-paddle-ocr').PaddleOcrResult['lines'];
}

function scoreText(text: string): number {
  const words = text.match(/[A-Za-z0-9]{3,}/g) ?? [];
  let score = words.length * 2 + text.length * 0.1;
  if (/(?:challan|delivery|invoice|bill|gstin|total|meter|mtr|taka|piece|qty|weight|wt|consignee|supplier|buyer)/i.test(text)) score += 100;
  const meterHits = text.match(/\b(?:1[0-9]{2}|[7-9][0-9])\b/g);
  if (meterHits && meterHits.length > 2) score += Math.min(100, meterHits.length * 10);
  return score;
}

async function recognizeWithLines(imageBuffer: Buffer): Promise<OcrLinesResult> {
  const service = await ensurePaddle();
  if (!service) throw new Error('PaddleOCR failed to initialize');

  const candidateAngles = [0, 270, 90, 180];
  type Candidate = { angle: number; text: string; score: number; lines: OcrLinesResult['lines'] };
  const results: Candidate[] = [];

  for (const angle of candidateAngles) {
    try {
      const buf = await preprocessForOcr(imageBuffer, angle);
      const result = await service.recognize(buf.buffer as ArrayBuffer);
      const text = result.text ?? '';
      results.push({ angle, text, score: scoreText(text), lines: result.lines });
      console.log(`[ChallanService] Angle ${angle}°: score=${scoreText(text).toFixed(0)}, len=${text.length}`);
    } catch (e) {
      console.warn(`[ChallanService] OCR at ${angle}° failed:`, e);
    }
  }

  if (!results.length) return { text: '', lines: [] };

  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  console.log(`[ChallanService] Best angle: ${best.angle}° (score=${best.score.toFixed(0)})`);

  // Append complementary printed-slip content from other angles if relevant
  let combinedText = best.text;
  for (let i = 1; i < results.length; i++) {
    const c = results[i];
    const hasGst = /(?:gstin|[0-9]{2}[A-Z]{4,5}[0-9A-Z]{3,4})/i.test(c.text);
    const mainHasGst = /(?:gstin|[0-9]{2}[A-Z]{4,5}[0-9A-Z]{3,4})/i.test(combinedText);
    const hasSlip = /(?:#\s*:\s*[A-Z0-9]|(?:challan|invoice|bill|dc)\s*(?:no|#)|delivery\s*challan)/i.test(c.text);
    const mainHasSlip = /(?:delivery\s*challan|(?:challan|invoice|bill|dc)\s*(?:no|#))/i.test(combinedText);
    if ((hasGst && !mainHasGst) || (hasSlip && !mainHasSlip) || (c.score >= 45 && (hasGst || hasSlip))) {
      combinedText += '\n--- PRINTED ATTACHMENT ---\n' + c.text;
    }
  }

  return { text: combinedText, lines: best.lines };
}

// ─── Main extraction pipeline ─────────────────────────────────────────────────

/**
 * Dedicated Challan Bill OCR extraction pipeline:
 * 1. Download file
 * 2. PaddleOCR → structured lines (with bounding boxes) + merged text
 * 3. Position-aware taka extractor (uses X/Y column positions)
 * 4. Field parser on merged text
 */
export async function extractChallanDocument(
  request: ChallanExtractRequest,
): Promise<OcrExtractResponse> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    if (!request.fileUrl || typeof request.fileUrl !== 'string') {
      throw Object.assign(new Error('Missing or invalid "fileUrl"'), { statusCode: 400 });
    }

    const { filePath, buffer } = await downloadFile(request.fileUrl);
    tempFilePath = filePath;

    const mimeType = await detectMimeType(buffer, request.fileUrl);

    let rawText: string;
    let pageCount = 1;
    let ocrLines: OcrLinesResult['lines'] = [];

    if (mimeType === SUPPORTED_PDF_MIME) {
      const pdfResult = await processPdf(buffer);
      rawText = pdfResult.text;
      pageCount = pdfResult.pages;
      console.log(`[ChallanService] PDF processed: ${pageCount} pages`);
    } else {
      const ocrResult = await recognizeWithLines(buffer);
      rawText = ocrResult.text;
      ocrLines = ocrResult.lines;
      console.log(`[ChallanService] PaddleOCR complete: ${rawText.length} chars, ${ocrLines.length} line groups`);
    }

    console.log(`\n=================== [CHALLAN BILL OCR TEXT] ===================`);
    console.log(rawText);
    console.log(`================================================================\n`);

    // Try position-aware extraction from bounding-box lines first (images only)
    let takas: TakaDetailItem[] = [];
    if (ocrLines.length > 0) {
      takas = extractTakasFromLines(ocrLines);
      console.log(`[ChallanService] Position-aware takas: ${takas.length}`);
    }

    // Parse header fields (always from text) — also extracts takas as fallback
    const { fields, takas: textTakas } = parseChallanDocument(
      rawText,
      request.customSchema,
      request.fileName || request.fileUrl,
      ocrLines,
    );

    // Prefer position-aware takas when they return a plausible result (≥3 takas).
    // Fall back to text-based only when position-aware extraction produced nothing useful.
    const positionAwarePlausible = takas.length >= 3;
    if (!positionAwarePlausible) {
      takas = textTakas;
      console.log(`[ChallanService] Using text-based takas fallback: ${takas.length}`);
    }

    // Sync TOTAL PIECES / TOTAL METER fields with final taka list
    if (takas.length > 0) {
      fields['TOTAL PIECES'] = takas.length.toString();
      const sumM = takas.reduce((a, t) => a + (parseFloat(t.meters) || 0), 0);
      if (sumM > 0) fields['TOTAL METER'] = sumM.toFixed(2);
      const sumWg = takas.reduce((a, t) => a + (parseFloat(t.weight || '0') || 0), 0);
      const wDisplay = sumWg > 0 ? `, ${(sumWg / 1000).toFixed(2)} Kg` : '';
      fields['TAKA DETAILS'] = `${takas.length} Takas (${(sumM || 0).toFixed(2)} Mtr${wDisplay})`;
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(
      `[ChallanService] Done in ${processingTimeMs}ms — ` +
      `${Object.keys(fields).length} fields, ${takas.length} takas`,
    );

    return {
      success: true,
      text: rawText,
      fields,
      takas,
      pages: pageCount,
      processingTimeMs,
      documentType: 'DELIVERY_CHALLAN' as any,
    };
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number };
    const processingTimeMs = Date.now() - startTime;
    console.error(`[ChallanService] Failed after ${processingTimeMs}ms:`, error.message);
    return {
      success: false,
      text: '',
      fields: {},
      pages: 0,
      processingTimeMs,
      documentType: 'DELIVERY_CHALLAN' as any,
      error: error.message,
    };
  } finally {
    if (tempFilePath) cleanupFile(tempFilePath);
  }
}
