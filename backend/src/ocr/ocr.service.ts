// ─────────────────────────────────────────────────────────────
// OCR Service — Main orchestrator
// Downloads file → detects MIME → routes to image/PDF → parses
// ─────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import axios from 'axios';

import {
  DocumentType,
  SUPPORTED_IMAGE_MIMES,
  SUPPORTED_PDF_MIME,
  type OcrExtractRequest,
  type OcrExtractResponse,
  type SupportedMimeType,
} from './ocr.types.js';
import { recognizeImage } from './image.service.js';
import { processPdf } from './pdf.service.js';
import { parseFields } from './parser.service.js';

// ─────────────────── Temp directory management ───────────────

const TMP_DIR = path.join(os.tmpdir(), 'ocr-microservice');

function ensureTmpDir(): void {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[OcrService] Temp file cleaned up: ${filePath}`);
    }
  } catch (err) {
    console.warn(`[OcrService] Failed to cleanup temp file: ${filePath}`, err);
  }
}

// ─────────────────── MIME detection ───────────────────

/**
 * Detect MIME type using magic bytes (file-type) with extension fallback.
 */
export async function detectMimeType(
  buffer: Buffer,
  originalUrl: string,
): Promise<SupportedMimeType> {
  // Primary: magic-byte detection
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);

  if (detected) {
    const mime = detected.mime as SupportedMimeType;
    if (SUPPORTED_IMAGE_MIMES.includes(mime) || mime === SUPPORTED_PDF_MIME) {
      console.log(`[OcrService] Detected MIME (magic bytes): ${mime}`);
      return mime;
    }
  }

  // Fallback 1: Data URL MIME header check
  if (originalUrl.startsWith('data:')) {
    const mimeMatch = originalUrl.match(/^data:([^;]+);/);
    if (mimeMatch) {
      const mime = mimeMatch[1] as SupportedMimeType;
      if (SUPPORTED_IMAGE_MIMES.includes(mime) || mime === SUPPORTED_PDF_MIME) {
        console.log(`[OcrService] Detected MIME (data URL header): ${mime}`);
        return mime;
      }
    }
  }

  // Fallback 2: URL or path extension
  try {
    const rawPath = originalUrl.startsWith('/') ? originalUrl : (originalUrl.includes('://') ? new URL(originalUrl).pathname : originalUrl);
    const ext = path.extname(rawPath).toLowerCase();
    const extMap: Record<string, SupportedMimeType> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };

    if (extMap[ext]) {
      console.log(`[OcrService] Detected MIME (extension fallback): ${extMap[ext]}`);
      return extMap[ext];
    }
  } catch {
    // Ignore URL parsing errors for data URLs
  }

  throw new Error(
    `Unsupported file type. Detected: ${detected?.mime ?? 'unknown'}. ` +
    `Supported: ${[...SUPPORTED_IMAGE_MIMES, SUPPORTED_PDF_MIME].join(', ')}`,
  );
}

// ─────────────────── File download ───────────────────

/**
 * Download a file from URL to a temp path. Returns the local file path and raw buffer.
 * Supports standard HTTP/HTTPS URLs, base64 data URLs, and relative asset paths.
 */
export async function downloadFile(
  fileUrl: string,
): Promise<{ filePath: string; buffer: Buffer }> {
  ensureTmpDir();

  // Handle direct local file paths on disk
  if (fs.existsSync(fileUrl) && fs.statSync(fileUrl).isFile()) {
    console.log(`[OcrService] Loaded absolute local path directly from disk: ${fileUrl}`);
    const buffer = fs.readFileSync(fileUrl);
    const ext = path.extname(fileUrl) || '.bin';
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(TMP_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    return { filePath, buffer };
  }

  // Handle uploaded base64 data URLs
  if (fileUrl.startsWith('data:')) {
    console.log(`[OcrService] Processing uploaded base64 data URL`);
    const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data URL format.');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = '.bin';
    if (mimeType === 'application/pdf') ext = '.pdf';
    else if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
    else if (mimeType.includes('webp')) ext = '.webp';

    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(TMP_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(
      `[OcrService] Data URL saved ${(buffer.length / 1024).toFixed(1)} KB → ${filePath}`,
    );

    return { filePath, buffer };
  }

  // Handle relative public asset paths (e.g. /images/... or /dummyImg/...)
  if (fileUrl.startsWith('/')) {
    const cleanRel = fileUrl.replace(/^\/+/, '');
    const searchDirs = [
      path.resolve(process.cwd(), '../frontend/public'),
      path.resolve(process.cwd(), '../frontend/dist'),
      path.resolve(process.cwd(), 'public'),
      path.resolve(process.cwd(), '../../frontend/public'),
      '/Users/mac/Desktop/ved/web/frontend/public',
    ];

    for (const sDir of searchDirs) {
      const candidate = path.join(sDir, cleanRel);
      if (fs.existsSync(candidate)) {
        console.log(`[OcrService] Loaded local asset directly from disk: ${candidate}`);
        const buffer = fs.readFileSync(candidate);
        const ext = path.extname(candidate) || '.bin';
        const fileName = `${randomUUID()}${ext}`;
        const filePath = path.join(TMP_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        return { filePath, buffer };
      }
    }

    // Fallback: prepend client origin
    const origin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');
    fileUrl = `${origin}/${cleanRel}`;
    console.log(`[OcrService] Resolved relative URL to origin: ${fileUrl}`);
  }

  // Regular HTTP / relative URL download via Axios
  console.log(`[OcrService] Downloading: ${fileUrl}`);
  const response = await axios.get(fileUrl, {
    responseType: 'arraybuffer',
    timeout: 60_000, // 60s timeout
    maxContentLength: 50 * 1024 * 1024, // 50 MB max
  });

  const buffer = Buffer.from(response.data);
  let ext = '.bin';
  try {
    ext = path.extname(new URL(fileUrl).pathname) || '.bin';
  } catch {
    // fallback
  }

  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(TMP_DIR, fileName);

  fs.writeFileSync(filePath, buffer);
  console.log(`[OcrService] Downloaded ${(buffer.length / 1024).toFixed(1)} KB → ${filePath}`);

  return { filePath, buffer };
}

// ─────────────────── Main extraction pipeline ───────────────

/**
 * Full OCR extraction pipeline:
 * 1. Download file
 * 2. Detect MIME
 * 3. Route to image or PDF processor
 * 4. Parse fields with document template
 * 5. Cleanup temp files
 * 6. Return structured response
 */
export async function extractDocument(
  request: OcrExtractRequest,
): Promise<OcrExtractResponse> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    // Validate document type
    if (!request.customSchema && !Object.values(DocumentType).includes(request.documentType as DocumentType)) {
      throw Object.assign(
        new Error(
          `Invalid document type: ${request.documentType}. ` +
          `Valid types: ${Object.values(DocumentType).join(', ')}`,
        ),
        { statusCode: 400 },
      );
    }

    // Step 1: Download
    const { filePath, buffer } = await downloadFile(request.fileUrl);
    tempFilePath = filePath;

    // Step 2: Detect MIME
    const mimeType = await detectMimeType(buffer, request.fileUrl);

    // Step 3: Process based on type
    let rawText: string;
    let pageCount = 1;

    if (mimeType === SUPPORTED_PDF_MIME) {
      const pdfResult = await processPdf(buffer);
      rawText = pdfResult.text;
      pageCount = pdfResult.pages;
      console.log(
        `[OcrService] PDF processed: ${pageCount} pages, searchable=${pdfResult.isSearchable}`,
      );
    } else {
      // Image
      const ocrResult = await recognizeImage(buffer);
      rawText = ocrResult.text;
      console.log(`[OcrService] Image OCR complete: ${rawText.length} chars`);
    }

    // Step 4: Log raw extracted text
    console.log(`\n=================== [OCR EXTRACTED TEXT: ${request.documentType}] ===================`);
    console.log(rawText);
    console.log(`==============================================================================\n`);

    // Step 5: Parse fields
    const fields = parseFields(rawText, request.documentType, request.customSchema);

    const processingTimeMs = Date.now() - startTime;
    console.log(
      `[OcrService] Extraction complete in ${processingTimeMs}ms — ` +
      `${Object.keys(fields).length} fields extracted`,
    );

    return {
      success: true,
      text: rawText,
      fields,
      pages: pageCount,
      processingTimeMs,
      documentType: request.documentType as DocumentType,
    };
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number };
    const processingTimeMs = Date.now() - startTime;

    console.error(`[OcrService] Extraction failed after ${processingTimeMs}ms:`, error.message);

    return {
      success: false,
      text: '',
      fields: {},
      pages: 0,
      processingTimeMs,
      documentType: request.documentType as DocumentType,
      error: error.message,
    };
  } finally {
    // Step 5: Cleanup
    if (tempFilePath) {
      cleanupFile(tempFilePath);
    }
  }
}
