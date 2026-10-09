export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  message: string;
}

export interface InfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: string[];
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

const API_BASE = '/api';

export const fetchHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
};

export const fetchInfo = async (): Promise<InfoResponse> => {
  const response = await fetch(`${API_BASE}/info`);
  if (!response.ok) {
    throw new Error(`Info fetch failed: ${response.statusText}`);
  }
  return response.json();
};

export const fetchItems = async (): Promise<Item[]> => {
  const response = await fetch(`${API_BASE}/items`);
  if (!response.ok) {
    throw new Error(`Items fetch failed: ${response.statusText}`);
  }
  return response.json();
};

// ─────────────────── OCR Microservice ───────────────────

export interface OcrExtractResponse {
  success: boolean;
  text: string;
  fields: Record<string, string>;
  takas?: Array<{ takaNo: number; meters: string; weight?: string }>;
  pages: number;
  processingTimeMs: number;
  documentType: string;
  error?: string;
}

/**
 * Send a document URL to the OCR extraction endpoint.
 * Returns structured text + parsed fields for auto-fill.
 */
export interface OcrExtractRequest {
  fileUrl: string;
  documentType: string;
  customSchema?: any;
}

export const extractOcrData = async (
  reqPayload: OcrExtractRequest | { fileUrl: string; documentType: string; customSchema?: any },
): Promise<OcrExtractResponse> => {
  const response = await fetch(`${API_BASE}/ocr/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `OCR extraction failed: ${response.statusText}`,
    );
  }

  return response.json();
};

export const extractDocumentOcr = async (
  fileUrl: string,
  documentType: string,
  customSchema?: any,
): Promise<OcrExtractResponse> => {
  return extractOcrData({ fileUrl, documentType, customSchema });
};

/**
 * Dedicated Challan Bill OCR Extraction API
 * POST /api/ocr/challan
 */
export interface ChallanExtractRequest {
  fileUrl: string;
  customSchema?: any;
  fileName?: string;
}

export const extractChallanOcrData = async (
  reqPayload: ChallanExtractRequest,
): Promise<OcrExtractResponse> => {
  const response = await fetch(`${API_BASE}/ocr/challan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `Challan OCR extraction failed: ${response.statusText}`,
    );
  }

  return response.json();
};

/**
 * Dedicated Challan AI OCR Extraction API (Gemini Vision)
 * POST /api/ocr/challan-ai
 */
export const extractChallanAiOcrData = async (
  reqPayload: ChallanExtractRequest,
): Promise<OcrExtractResponse> => {
  const response = await fetch(`${API_BASE}/ocr/challan-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqPayload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ||
        `AI OCR extraction failed: ${response.statusText}`,
    );
  }

  return response.json();
};

