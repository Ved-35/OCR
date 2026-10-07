// ─────────────────────────────────────────────────────────────
// Image Service — PaddleOCR integration for image files
// ─────────────────────────────────────────────────────────────

import type { OcrResult } from './ocr.types.js';

/**
 * Lazy-loaded PaddleOCR service singleton.
 * The service downloads ONNX models on first init (~50 MB, cached).
 */
let paddleOcrInstance: InstanceType<typeof import('ppu-paddle-ocr').PaddleOcrService> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Ensures the PaddleOCR engine is initialized exactly once.
 * Thread-safe via shared promise.
 */
async function ensureOcrReady(): Promise<typeof paddleOcrInstance> {
  if (paddleOcrInstance) return paddleOcrInstance;

  if (!initPromise) {
    initPromise = (async () => {
      console.log('[ImageService] Initializing PaddleOCR engine (first run downloads models)…');
      const { PaddleOcrService } = await import('ppu-paddle-ocr');
      paddleOcrInstance = new PaddleOcrService();
      await paddleOcrInstance.initialize();
      console.log('[ImageService] PaddleOCR engine ready.');
    })();
  }

  await initPromise;
  return paddleOcrInstance;
}

/**
 * Score recognized text quality (words with 3+ characters and keywords)
 */
function scoreOcrText(text: string): number {
  if (!text) return 0;
  const words = text.match(/[A-Za-z0-9]{3,}/g) || [];
  let score = words.length * 2 + text.trim().length * 0.1;
  // Bonus for invoice / challan keywords
  if (/(?:challan|gstin|invoice|bill|delivery|supplier|buyer|total|meters?|mts?|date|rate|quality|pcs|piece|item|taka|weight|wt|consignee|c\.?no|o\.?no)/i.test(text)) {
    score += 100;
  }
  // Bonus if numbers in roll meter range (70-200) are recognized
  const meterMatches = text.match(/\b(?:1[0-9]{2}|[7-9][0-9])\b/g);
  if (meterMatches && meterMatches.length > 2) {
    score += Math.min(100, meterMatches.length * 10);
  }
  return score;
}

/**
 * Preprocess an image buffer with sharp for improved OCR accuracy, with optional rotation.
 * - Auto-orients based on EXIF (if angle = 0) or applies explicit angle (90, 180, 270)
 * - Upscales low-resolution images (< 1800px width) so fine text is legible
 * - Converts to greyscale & normalises contrast
 * - Sharpen edges
 * - Outputs PNG for clean pixel data
 */
async function preprocessImage(buffer: Buffer, rotationAngle: number = 0): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  let pipeline = sharp(buffer);

  if (rotationAngle !== 0) {
    pipeline = pipeline.rotate(rotationAngle);
  } else {
    pipeline = pipeline.rotate(); // auto-orient based on EXIF
  }

  const metadata = await pipeline.metadata();

  // Upscale if width is low (< 1800px)
  if (metadata.width && metadata.width < 1800) {
    const scaleFactor = Math.min(3.5, Math.max(1.5, 1800 / metadata.width));
    pipeline = pipeline.resize({
      width: Math.round(metadata.width * scaleFactor),
      kernel: 'lanczos3',
    });
  }

  return pipeline
    .greyscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
}

/**
 * Run PaddleOCR on an image buffer with intelligent multi-angle auto-rotation.
 * When mobile camera photos are taken sideways (90° or 270°), standard OCR yields
 * single-character gibberish. This automatically detects the orientation that
 * maximizes recognizable text and challan fields.
 */
export async function recognizeImage(imageBuffer: Buffer): Promise<OcrResult> {
  const service = await ensureOcrReady();
  if (!service) {
    throw new Error('PaddleOCR service failed to initialize');
  }

  // Evaluate angles (0°, 270°, 90°, 180°)
  // Mobile ledger photos are often taken in portrait (270° or 90° for horizontal ledger books),
  // while printed delivery slips may be stapled at 0° or 180°.
  const candidateAngles = [0, 270, 90, 180];
  const angleResults: Array<{ angle: number; text: string; score: number; hasKeywords: boolean }> = [];

  for (const angle of candidateAngles) {
    try {
      const processedBuffer = await preprocessImage(imageBuffer, angle);
      const result = await service.recognize(processedBuffer.buffer as ArrayBuffer);
      const text = result.text ?? '';
      const score = scoreOcrText(text);
      const hasKeywords = /(?:gstin|challan|invoice|bill|delivery|item|taka|piece|weight|wt|consignee|supplier)/i.test(text);
      angleResults.push({ angle, text, score, hasKeywords });
      console.log(`[ImageService] Evaluated angle ${angle}°: score = ${score.toFixed(0)}, length = ${text.length}`);
    } catch (err) {
      console.warn(`[ImageService] OCR attempt at angle ${angle}° failed:`, err);
    }
  }

  // Sort by score descending to find the primary orientation
  angleResults.sort((a, b) => b.score - a.score);

  if (angleResults.length === 0 || !angleResults[0].text) {
    return { text: '', confidence: undefined };
  }

  const best = angleResults[0];
  let combinedText = best.text;
  console.log(`[ImageService] Primary orientation chosen: ${best.angle}° (score: ${best.score.toFixed(0)})`);

  // Check if an orthogonal or inverted angle contains complementary printed attachments (e.g. GSTIN, company header, Challan No)
  for (let i = 1; i < angleResults.length; i++) {
    const candidate = angleResults[i];
    if (candidate.score >= 80 && candidate.hasKeywords) {
      const candidateHasGst = /(?:gstin|[0-9]{2}[A-Z]{5}[0-9A-Z]{4})/i.test(candidate.text);
      const textHasGst = /(?:gstin|[0-9]{2}[A-Z]{5}[0-9A-Z]{4})/i.test(combinedText);
      const candidateHasSlip = /(?:sw[\/\-]\d|#\s*:\s*[A-Z0-9]|olpad|estate|petrol|place\s*of|shital\s*weaving)/i.test(candidate.text);
      const textHasSlip = /(?:sw[\/\-]\d|shital\s*weaving|olpad\s*industrial)/i.test(combinedText);

      if ((candidateHasGst && !textHasGst) || (candidateHasSlip && !textHasSlip)) {
        console.log(`[ImageService] Appending complementary printed slip details from angle ${candidate.angle}° (score: ${candidate.score.toFixed(0)})`);
        combinedText += '\n--- PRINTED ATTACHMENT ---\n' + candidate.text;
      }
    }
  }

  return {
    text: combinedText,
    confidence: undefined,
  };
}

/**
 * Gracefully shut down the OCR engine (call on app teardown).
 */
export async function destroyOcrEngine(): Promise<void> {
  if (paddleOcrInstance) {
    await paddleOcrInstance.destroy();
    paddleOcrInstance = null;
    initPromise = null;
    console.log('[ImageService] PaddleOCR engine destroyed.');
  }
}
