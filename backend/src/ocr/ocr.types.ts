// ─────────────────────────────────────────────────────────────
// OCR Module — Shared Types, DTOs, and Enums
// ─────────────────────────────────────────────────────────────

/**
 * Supported document types for field extraction templates.
 * Each maps to a set of regex patterns in ParserService.
 */
export enum DocumentType {
  PAN_CARD = 'PAN_CARD',
  AADHAAR_CARD = 'AADHAAR_CARD',
  ELECTRICITY_BILL = 'ELECTRICITY_BILL',
  PROJECT_REPORT = 'PROJECT_REPORT',
  UDYAM_REGISTRATION_CERTIFICATE = 'UDYAM_REGISTRATION_CERTIFICATE',
  GST_CERTIFICATE = 'GST_CERTIFICATE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  LOAN_SANCTION_LETTER = 'LOAN_SANCTION_LETTER',
  BALANCE_SHEET_REPORT = 'BALANCE_SHEET_REPORT',
  CUSTOM = 'CUSTOM',
}

/**
 * MIME types supported by the OCR pipeline.
 */
export type SupportedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf';

export const SUPPORTED_IMAGE_MIMES: SupportedMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const SUPPORTED_PDF_MIME: SupportedMimeType = 'application/pdf';

/**
 * Incoming request body for the OCR extraction endpoint.
 */
export interface OcrExtractRequest {
  /** Publicly-accessible URL of the image or PDF to process */
  fileUrl: string;
  /** Document type for template-based field extraction */
  documentType: DocumentType | string;
  /** Optional dynamic JSON schema for custom field extraction */
  customSchema?: any;
}

/**
 * Standardised response returned by the OCR endpoint.
 */
export interface OcrExtractResponse {
  success: boolean;
  text: string;
  fields: Record<string, string>;
  takas?: Array<{
    takaNo: number;
    meters: string;
    weight?: string;
  }>;
  pages: number;
  processingTimeMs: number;
  documentType: DocumentType;
  error?: string;
}

/**
 * A single field-extraction rule used by the parser.
 */
export interface FieldExtractionRule {
  /** Key name in the returned fields object */
  fieldName: string;
  /** Ordered list of regex patterns to try (first match wins) */
  patterns: RegExp[];
  /** Optional post-processing (trim, normalize, etc.) */
  postProcess?: (value: string) => string;
}

/**
 * A document template grouping extraction rules for a DocumentType.
 */
export interface DocumentTemplate {
  documentType: DocumentType;
  rules: FieldExtractionRule[];
}

/**
 * Result from the OCR engine (PaddleOCR).
 */
export interface OcrResult {
  text: string;
  confidence?: number;
}

/**
 * Result from PDF processing (text extraction or OCR per page).
 */
export interface PdfProcessingResult {
  text: string;
  pages: number;
  isSearchable: boolean;
}
