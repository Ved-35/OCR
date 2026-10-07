// ─────────────────────────────────────────────────────────────
// PDF Service — MuPDF text extraction & page rendering
// ─────────────────────────────────────────────────────────────

import type { PdfProcessingResult } from './ocr.types.js';
import { recognizeImage } from './image.service.js';

/** Minimum character count to consider a page "searchable" */
const MIN_TEXT_LENGTH = 20;

/**
 * Structured text block returned by mupdf's asJSON().
 */
interface MuPdfTextBlock {
  type: string;
  lines?: Array<{
    spans?: Array<{
      text?: string;
    }>;
  }>;
}

/**
 * Extract plain text from MuPDF's structured text JSON output.
 */
function extractPlainText(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);
    const blocks: MuPdfTextBlock[] = data.blocks ?? data;
    const lines: string[] = [];

    for (const block of blocks) {
      if (block.type === 'text' && block.lines) {
        for (const line of block.lines) {
          const lineText = (line.spans ?? [])
            .map((s) => s.text ?? '')
            .join('');
          if (lineText.trim()) {
            lines.push(lineText.trim());
          }
        }
      }
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}

/**
 * Process a PDF buffer: extract text from searchable pages,
 * or render scanned pages to PNG and run PaddleOCR.
 *
 * MuPDF is ESM-only and uses WASM — objects must be .destroy()'d.
 */
export async function processPdf(pdfBuffer: Buffer): Promise<PdfProcessingResult> {
  // Dynamic import — mupdf is ESM-only
  const mupdf = await import('mupdf');

  const doc = mupdf.Document.openDocument(pdfBuffer, 'application/pdf');
  const pageCount = doc.countPages();
  const pageTexts: string[] = [];
  let isSearchable = true;

  console.log(`[PdfService] Processing PDF with ${pageCount} page(s)…`);

  try {
    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);

      try {
        // Attempt structured text extraction first
        const structuredText = page.toStructuredText('preserve-whitespace');
        const jsonStr = structuredText.asJSON();
        const plainText = extractPlainText(jsonStr);

        if (plainText.length >= MIN_TEXT_LENGTH) {
          // Searchable page — use extracted text directly
          pageTexts.push(`--- Page ${i + 1} ---\n${plainText}`);
          console.log(`[PdfService] Page ${i + 1}: extracted ${plainText.length} chars (searchable)`);
        } else {
          // Scanned page — render to PNG and OCR
          isSearchable = false;
          console.log(`[PdfService] Page ${i + 1}: minimal text (${plainText.length} chars), running OCR…`);

          const pixmap = page.toPixmap(
            mupdf.Matrix.scale(2, 2),    // 2× for higher DPI → better OCR
            mupdf.ColorSpace.DeviceRGB,
            false, // no alpha
            true,  // render annotations
          );

          try {
            const pngData = pixmap.asPNG();
            const pngBuffer = Buffer.from(pngData);
            const ocrResult = await recognizeImage(pngBuffer);
            pageTexts.push(`--- Page ${i + 1} (OCR) ---\n${ocrResult.text}`);
            console.log(`[PdfService] Page ${i + 1}: OCR extracted ${ocrResult.text.length} chars`);
          } finally {
            pixmap.destroy();
          }
        }
      } finally {
        page.destroy();
      }
    }
  } finally {
    doc.destroy();
  }

  return {
    text: pageTexts.join('\n\n'),
    pages: pageCount,
    isSearchable,
  };
}
