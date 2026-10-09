// ─────────────────────────────────────────────────────────────
// Challan AI Service — Gemini Vision-based OCR for Delivery Challans
// Completely separate from the PaddleOCR challan.service.ts
// Uses Google Gemini API to extract structured fields & taka details
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import {
  SUPPORTED_PDF_MIME,
  type OcrExtractResponse,
} from './ocr.types.js';
import { downloadFile, detectMimeType, cleanupFile } from './ocr.service.js';
import { type TakaDetailItem } from './challan-parser.service.js';

// ─── Gemini Configuration ────────────────────────────────────────────────────

function getGeminiApiKey(): string {
  return config.geminiApiKey || process.env.GEMINI_API_KEY || '';
}

export interface ChallanAiExtractRequest {
  fileUrl: string;
  customSchema?: any;
  fileName?: string;
  apiKey?: string;
}

// ─── Gemini Prompt Construction ──────────────────────────────────────────────

function buildExtractionPrompt(customSchema?: any): string {
  // Build the list of fields to extract from the schema
  let fieldsList = `
- CHALLAN NUMBER
- CHALLAN DATE (format: DD/MM/YYYY)
- SUPPLIER NAME
- SUPPLIER ADDRESS
- SUPPLIER GST NUMBER
- RECIPIENT NAME
- RECIPIENT ADDRESS
- RECIPIENT GST NUMBER
- QUALITY
- RATE
- TOTAL PIECES
- TOTAL METER
- BROKER NAME
- TAKA DETAILS (summary like: "23 Takas (2792.00 Mtr)")
`;

  if (customSchema && Array.isArray(customSchema)) {
    fieldsList = customSchema
      .map((f: any) => `- ${f.title}${f.type === 'date' ? ' (format: DD/MM/YYYY)' : ''}`)
      .join('\n');
  }

  return `You are an expert OCR data extraction system specialized in Indian textile industry Delivery Challans, Bills, and Invoices.

Analyze this document image carefully and extract ALL information into a structured JSON format.

## Fields to Extract:
${fieldsList}

## Taka/Piece Details:
Also extract ALL individual taka (piece) entries from the document. Each taka entry should have:
- takaNo: sequential number (1, 2, 3...)
- meters: the meter measurement as a string (e.g., "121.50")
NOTE: Do NOT extract weight. Only extract meters for each taka.

## Important Rules:
1. Read the document VERY carefully — handwritten text may be difficult to read.
2. For CHALLAN DATE, always return in DD/MM/YYYY format.
3. For GST numbers, they follow the pattern: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + Z + 1 alphanumeric (e.g., 24AABCT1332E1ZP).
4. SUPPLIER is typically the sender/consignor/from party.
5. RECIPIENT is typically the receiver/consignee/to party/buyer.
6. For meter values, be precise — these are fabric lengths.
7. For takas, extract each individual taka meter entry from the table. Do not include weight.
8. If a field is not found in the document, use an empty string "".
9. QUALITY refers to the fabric quality/type name.
10. BROKER NAME is the intermediary/agent if mentioned.

## Response Format:
Return ONLY valid JSON in this exact structure (no markdown, no code fences, no explanation):
{
  "fields": {
    "CHALLAN NUMBER": "...",
    "CHALLAN DATE": "...",
    "SUPPLIER NAME": "...",
    "SUPPLIER ADDRESS": "...",
    "SUPPLIER GST NUMBER": "...",
    "RECIPIENT NAME": "...",
    "RECIPIENT ADDRESS": "...",
    "RECIPIENT GST NUMBER": "...",
    "QUALITY": "...",
    "RATE": "...",
    "TOTAL PIECES": "...",
    "TOTAL METER": "...",
    "BROKER NAME": "...",
    "TAKA DETAILS": "..."
  },
  "takas": [
    { "takaNo": 1, "meters": "121.50" },
    { "takaNo": 2, "meters": "118.00" }
  ]
}`;
}

// ─── Convert buffer to Gemini-compatible inline data ─────────────────────────

function bufferToGeminiPart(buffer: Buffer, mimeType: string): {
  inlineData: { data: string; mimeType: string };
} {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

// ─── Parse Gemini response into structured data ──────────────────────────────

function parseGeminiResponse(responseText: string): {
  fields: Record<string, string>;
  takas: TakaDetailItem[];
} {
  // Strip markdown code fences if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);

    const fields: Record<string, string> = {};
    if (parsed.fields && typeof parsed.fields === 'object') {
      for (const [key, value] of Object.entries(parsed.fields)) {
        fields[key] = typeof value === 'string' ? value : String(value ?? '');
      }
    }

    const takas: TakaDetailItem[] = [];
    if (parsed.takas && Array.isArray(parsed.takas)) {
      for (let i = 0; i < parsed.takas.length; i++) {
        const t = parsed.takas[i];
        takas.push({
          takaNo: t.takaNo ?? i + 1,
          meters: String(t.meters ?? '0'),
          weight: t.weight ? String(t.weight) : undefined,
        });
      }
    }

    return { fields, takas };
  } catch (parseErr) {
    console.error('[ChallanAiService] Failed to parse Gemini JSON response:', parseErr);
    console.error('[ChallanAiService] Raw response:', responseText.substring(0, 500));

    // Try to extract partial data with regex fallback
    const fields: Record<string, string> = {};
    const fieldMatch = responseText.match(/"fields"\s*:\s*\{([^}]+)\}/s);
    if (fieldMatch) {
      const pairs = fieldMatch[1].matchAll(/"([^"]+)"\s*:\s*"([^"]*)"/g);
      for (const m of pairs) {
        fields[m[1]] = m[2];
      }
    }

    return { fields, takas: [] };
  }
}

// ─── PDF page rendering for Gemini ───────────────────────────────────────────

async function renderPdfFirstPage(buffer: Buffer): Promise<Buffer> {
  // Use sharp to try converting, or use mupdf for PDF rendering
  try {
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(buffer, 'application/pdf');
    const page = doc.loadPage(0);
    const bounds = page.getBounds();
    const width = bounds[2] - bounds[0];
    const height = bounds[3] - bounds[1];
    // Render at 2x for better quality
    const scale = Math.min(3, Math.max(1.5, 2000 / width));
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(scale, scale),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    );
    const pngData = pixmap.asPNG();
    return Buffer.from(pngData);
  } catch (err) {
    console.error('[ChallanAiService] PDF rendering failed:', err);
    throw new Error('Could not render PDF for AI OCR processing');
  }
}

// ─── Main AI extraction pipeline ─────────────────────────────────────────────

/**
 * Dedicated Gemini AI OCR extraction pipeline for Challan Bills:
 * 1. Download file
 * 2. Detect MIME type, render PDF to image if needed
 * 3. Send image to Gemini Vision with structured extraction prompt
 * 4. Parse JSON response into fields + takas
 */
export async function extractChallanWithAi(
  request: ChallanAiExtractRequest,
): Promise<OcrExtractResponse> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  try {
    if (!request.fileUrl || typeof request.fileUrl !== 'string') {
      throw Object.assign(new Error('Missing or invalid "fileUrl"'), { statusCode: 400 });
    }

    console.log('[ChallanAiService] Starting Gemini AI OCR extraction...');

    const { filePath, buffer } = await downloadFile(request.fileUrl);
    tempFilePath = filePath;

    const mimeType = await detectMimeType(buffer, request.fileUrl);

    // Prepare image buffer for Gemini (optimize & resize with Sharp for fast transmission)
    const sharp = (await import('sharp')).default;
    let imageBuffer: Buffer;
    let imageMime = 'image/jpeg';

    if (mimeType === SUPPORTED_PDF_MIME) {
      console.log('[ChallanAiService] Rendering PDF first page for Gemini...');
      const pdfPng = await renderPdfFirstPage(buffer);
      imageBuffer = await sharp(pdfPng)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } else {
      imageBuffer = await sharp(buffer)
        .rotate() // auto-orient EXIF
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    console.log(`[ChallanAiService] Prepared optimized JPEG payload: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

    // Build the prompt
    const prompt = buildExtractionPrompt(request.customSchema);

    // Candidate models in order of verified stability & speed
    const CANDIDATE_MODELS = [
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
    ];

    let responseText = '';
    let lastError: Error | null = null;

    const apiKey = request.apiKey?.trim() || getGeminiApiKey();
    if (!apiKey) {
      throw new Error(
        'Gemini API Key is not configured. Please enter your key in the frontend input or add GEMINI_API_KEY to your backend .env file.',
      );
    }

    const imageBase64 = imageBuffer.toString('base64');

    for (const modelName of CANDIDATE_MODELS) {
      console.log(`[ChallanAiService] Attempting extraction with model: ${modelName}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const abortCtrl = new AbortController();
      const timeoutHandle = setTimeout(() => abortCtrl.abort(), 25000); // 25s timeout per attempt

      try {
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: imageMime,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
          signal: abortCtrl.signal,
        });

        clearTimeout(timeoutHandle);

        const data: any = await fetchRes.json();

        if (fetchRes.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
          console.log(`[ChallanAiService] Extraction succeeded with model: ${modelName}`);
          break;
        } else {
          const errDetail = data.error?.message || fetchRes.statusText;
          console.warn(`[ChallanAiService] Model ${modelName} returned status ${fetchRes.status}: ${errDetail}`);
          lastError = new Error(`[${modelName}] ${errDetail}`);
        }
      } catch (err: any) {
        clearTimeout(timeoutHandle);
        console.warn(`[ChallanAiService] Model ${modelName} call failed: ${err.message}`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error('All Gemini model candidates failed to respond.');
    }

    console.log(`[ChallanAiService] Gemini response received: ${responseText.length} chars`);
    console.log(`\n=================== [CHALLAN AI OCR RESPONSE] ===================`);
    console.log(responseText);
    console.log(`==================================================================\n`);

    // Parse the structured response
    const { fields, takas } = parseGeminiResponse(responseText);

    // Sync TOTAL PIECES / TOTAL METER with taka list
    if (takas.length > 0) {
      fields['TOTAL PIECES'] = takas.length.toString();
      const sumM = takas.reduce((a, t) => a + (parseFloat(t.meters) || 0), 0);
      if (sumM > 0) fields['TOTAL METER'] = sumM.toFixed(2);
      fields['TAKA DETAILS'] = `${takas.length} Takas (${(sumM || 0).toFixed(2)} Mtr)`;
    }

    const processingTimeMs = Date.now() - startTime;
    console.log(
      `[ChallanAiService] Done in ${processingTimeMs}ms — ` +
      `${Object.keys(fields).length} fields, ${takas.length} takas`,
    );

    return {
      success: true,
      text: responseText,
      fields,
      takas,
      pages: 1,
      processingTimeMs,
      documentType: 'DELIVERY_CHALLAN' as any,
    };
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number };
    const processingTimeMs = Date.now() - startTime;
    console.error(`[ChallanAiService] Failed after ${processingTimeMs}ms:`, error.message);
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
