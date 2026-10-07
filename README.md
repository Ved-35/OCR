# 🚀 Smart OCR & Dynamic Document Verification System

A production-ready **OCR Microservice** and interactive **React Form Verification UI** designed for automating document verification and field extraction across Indian financial, business, and identity documents (PAN Card, Aadhaar Card, Electricity Bill, Project Report, Udyam Registration, GST Certificate, Birth Certificate, Loan Sanction Letter, and Balance Sheet Report).

---

## 📌 Features & Highlights

- **Multi-Format OCR Pipeline**: Processes raster images (`.jpg`, `.jpeg`, `.png`, `.webp`) via **PaddleOCR** (`ppu-paddle-ocr`) and PDF documents (searchable or scanned) via **MuPDF** (`mupdf`).
- **9 Specialized Document Templates**: Built-in regex parsers and post-processors tailored to extract precise fields (names, dates, amounts, document IDs, financial totals).
- **Dual Form Layout Support**:
  - **Flat Form Layout**: Standard field-by-field verification (PAN, Aadhaar, GST, Udyam, etc.).
  - **Section-Based Layout**: Grouped financial statement cards with subheaders (`↳ CAPITAL (A)`, `↳ SECURED LOAN (B)`) specifically for **Balance Sheet Reports**.
- **Interactive Verification UI**:
  - Dual-panel split view (Document Image/PDF viewer on the left, Dynamic Form on the right).
  - Real-time **"🔍 Extract with OCR"** button with automatic date conversion, whitespace normalization, and toast notifications.
  - Image manipulation toolbar (zoom in/out, 90° rotation, fit reset).
  - Built-in PDF preview with embedded browser viewer.
- **Robust & Type-Safe Architecture**: Fully built with **TypeScript** across both frontend (Vite + React) and backend (Node.js + Express ES Modules).

---

## 🏗️ System Architecture & Workflow

```
 ┌────────────────────────┐         1. Request { fileUrl, documentType }         ┌────────────────────────┐
 │                        │ ───────────────────────────────────────────────────► │                        │
 │    React Frontend      │                                                      │     Node.js Express    │
 │ (Vite + TypeScript)    │ ◄─────────────────────────────────────────────────── │      OCR Backend       │
 └────────────────────────┘          4. JSON Response { success, fields, ... }   └───────────┬────────────┘
             │                                                                               │
             │ User clicks "Extract with OCR"                                                │ 2. Download File
             ▼                                                                               ▼
 ┌────────────────────────┐                                                       ┌────────────────────────┐
 │ Auto-Fills Form Inputs │                                                       │ Axios File Download &  │
 │ & Date Conversions     │                                                       │ Magic Byte MIME Check  │
 └────────────────────────┘                                                       └───────────┬────────────┘
                                                                                             │
                                                        ┌────────────────────────────────────┴────────────────────────────────────┐
                                                        ▼                                                                         ▼
                                            [ IMAGE: .png, .jpg, .webp ]                                             [ PDF: .pdf ]
                                                        │                                                                         │
                                                        ▼                                                                         ▼
                                           ┌────────────────────────┐                                                ┌────────────────────────┐
                                           │  Sharp Preprocessing   │                                                │  MuPDF Text Extraction │
                                           │ (Greyscale & Contrast) │                                                │  (Direct / 2x Rendering│
                                           └───────────┬────────────┘                                                └───────────┬────────────┘
                                                       │                                                                         │
                                                       ▼                                                                         ▼
                                           ┌────────────────────────┐                                                ┌────────────────────────┐
                                           │  PaddleOCR Engine      │                                                │  PaddleOCR Engine      │
                                           │  (ONNX Runtime Node)   │                                                │  (Page-by-Page OCR)    │
                                           └───────────┬────────────┘                                                └───────────┬────────────┘
                                                       │                                                                         │
                                                       └────────────────────────────────────┬────────────────────────────────────┘
                                                                                            │
                                                                                            ▼
                                                                                ┌────────────────────────┐
                                                                                │ Regex Template Parser  │
                                                                                │  (parseFields Service) │
                                                                                └────────────────────────┘
```

### Detailed Workflow Step-by-Step

1. **User Action**: The user selects a document type in the frontend UI and clicks **"🔍 Extract with OCR"**.
2. **API Call**: The frontend sends a `POST` request to `http://localhost:5000/api/ocr/extract` with payload `{ fileUrl: "...", documentType: "..." }`.
3. **Download & MIME Validation**:
   - `OcrService` downloads the file buffer using `axios`.
   - Magic bytes are checked using `file-type` to detect the exact file format (`image/png`, `image/webp`, `application/pdf`, etc.).
4. **Execution Pipeline**:
   - **Image Pipeline (`ImageService`)**:
     - Preprocesses raw buffer using `sharp` (converts to greyscale, adjusts contrast for maximum OCR precision).
     - Feeds image into `ppu-paddle-ocr` engine (powered by `onnxruntime-node`).
   - **PDF Pipeline (`PdfService`)**:
     - Opens document using `mupdf`.
     - Extracts direct searchable text if available.
     - If scanned/image-based, renders each page at **2.0x scale (144 DPI)** to high-resolution PNG buffers and runs `PaddleOCR` page by page.
5. **Template Parsing (`ParserService`)**:
   - Compiles full text across all pages.
   - Evaluates regex rules and post-processors (e.g., currency formatting, Indian date conversion `DD/MM/YYYY` ➔ `YYYY-MM-DD`, whitespace stripping).
6. **Form Population**: The backend returns JSON containing extracted field key-value pairs. The React frontend maps extracted keys to form inputs and auto-fills the values.

---

## 📑 Supported Document Types & Extracted Fields

| Document Type | Key Name | Key Extracted Fields |
| :--- | :--- | :--- |
| **Aadhaar Card** | `AADHAAR_CARD` | Name, Date of Birth, Gender, 12-digit Aadhaar Number, Address |
| **PAN Card** | `PAN_CARD` | PAN Number, Applicant Name, Father's Name, Date of Birth |
| **Electricity Bill** | `ELECTRICITY_BILL` | Consumer Name, Customer No., Meter No., Sub-Division Office, Address Lines, Area, Electricity Utility Company (DGVCL / UGVCL / MGVCL / PGVCL), Connection Type |
| **Project Report** | `PROJECT_REPORT` | Cost Breakdown (Land, Building, Plant & Machinery, Electrical Fittings, Compressor, Other Assets, Total Project Cost) |
| **Udyam Registration** | `UDYAM_REGISTRATION_CERTIFICATE` | Udyam Reg. No., Firm Name, Date of Incorporation, Mobile No., Email ID, PAN, Type of Organisation, Date of Registration, Major Activity, Enterprise Type |
| **GST Certificate** | `GST_CERTIFICATE` | GSTIN / UIN, Legal Name, Trade Name, Type of Registration (Regular/Composition), Date of Validity |
| **Birth Certificate** | `BIRTH_CERTIFICATE` | Full Name, Date of Birth, Gender |
| **Loan Sanction Letter** | `LOAN_SANCTION_LETTER` | Borrower Firm Name, Sanctioned Loan Amount, Rate of Interest, Sanction Date, Bank Name |
| **Balance Sheet Report** | `BALANCE_SHEET_REPORT` | Sectioned line items (Proprietor/Partner Capital, Term Loan, Sundry Creditors, Fixed Assets, Investments, Sundry Debtors, Cash, Total Liabilities & Assets) |

---

## 🛠️ Tech Stack & Dependencies

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript (Vite bundler)
- **Styling**: Vanilla CSS with modern Glassmorphism aesthetics, custom CSS variables, responsive split layout.
- **Icons & Typography**: Google Fonts (`Inter`, `Outfit`).

### Backend (`/backend`)
- **Runtime**: Node.js (ES Modules `"type": "module"`)
- **Framework**: Express.js
- **OCR Engine**: `ppu-paddle-ocr` + `onnxruntime-node@1.20.1`
- **PDF Renderer**: `mupdf`
- **Image Processing**: `sharp`
- **HTTP Client**: `axios`
- **MIME Inspector**: `file-type`
- **TypeScript Runner**: `tsx`

> [!IMPORTANT]
> **macOS Compatibility Note**:
> `onnxruntime-node` versions past `1.20.1` dropped prebuilt binaries for `darwin/x64` (Rosetta). The backend `package.json` enforces `"overrides": { "onnxruntime-node": "1.20.1" }` for cross-platform stability.

---

## 📡 API Endpoint Reference

### `POST /api/ocr/extract`

Extracts text and structured form fields from an image or PDF document URL.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "fileUrl": "http://localhost:5173/dummyImg/pan_card.png",
  "documentType": "PAN_CARD"
}
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "documentType": "PAN_CARD",
  "pages": 1,
  "processingTimeMs": 1420,
  "text": "INCOME TAX DEPARTMENT PERMANENT ACCOUNT NUMBER CARD ...",
  "fields": {
    "panNumber": "ABCDE1234F",
    "name": "APPLICANT NAME",
    "fatherName": "FATHER'S NAME",
    "dateOfBirth": "01/06/1995"
  }
}
```

#### Error Response (`400 Bad Request / 500 Internal Error`)
```json
{
  "success": false,
  "error": "Unsupported document type: INVALID_TYPE"
}
```

---

## ⚙️ Getting Started & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation

Clone the repository and install dependencies for both services:

```bash
# Clone repository
git clone <repository-url>
cd web

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Running the Development Servers

Open two terminal windows or run dev scripts concurrently:

#### Start Backend OCR Service (Port 5000)
```bash
cd backend
npm run dev
```

#### Start Frontend UI App (Port 5173)
```bash
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:5173` to interact with the **Document Verification System**.

---

## 📁 Project Directory Structure

```
web/
├── README.md                           # Comprehensive documentation
├── backend/                            # Express OCR Microservice
│   ├── package.json                    # ESM dependencies & npm overrides
│   ├── tsconfig.json                   # TypeScript configuration
│   └── src/
│       ├── index.ts                    # Express app entry point & port listener
│       ├── routes/
│       │   └── api.routes.ts           # Router mounting /api/ocr
│       └── ocr/
│           ├── ocr.types.ts            # DocumentType enum & API payload interfaces
│           ├── ocr.service.ts          # Main OCR coordinator (download, MIME, routing)
│           ├── image.service.ts        # Sharp preprocessor & PaddleOCR engine wrapper
│           ├── pdf.service.ts          # MuPDF page rendering & text extraction
│           ├── parser.service.ts       # 9 Regex document templates & field extractors
│           ├── ocr.controller.ts       # HTTP request handlers & error handling
│           └── ocr.routes.ts           # Route definitions for POST /api/ocr/extract
└── frontend/                           # Vite + React Verification Application
    ├── package.json
    ├── public/
    │   └── dummyImg/                   # Sample document files (.png, .webp, .pdf)
    └── src/
        ├── App.tsx                     # Main page wrapper
        ├── index.css                   # Glassmorphic UI theme & section styles
        ├── services/
        │   └── api.ts                  # Axios API client for extractDocumentOcr
        ├── utils/
        │   ├── constant.ts             # Complete document field schemas dictionary
        │   └── dummyDocs.ts            # Dynamic SVG document fallback generators
        └── components/
            └── DocumentVerificationUI.tsx  # Interactive document verification UI
```

---

## 🧪 Testing Verification

You can test OCR extraction directly via `cURL` for any supported document type:

```bash
# Test PAN Card OCR
curl -s -X POST http://localhost:5000/api/ocr/extract \
  -H "Content-Type: application/json" \
  -d '{"fileUrl": "http://localhost:5173/dummyImg/pan_card.png", "documentType": "PAN_CARD"}'

# Test Balance Sheet Report OCR
curl -s -X POST http://localhost:5000/api/ocr/extract \
  -H "Content-Type: application/json" \
  -d '{"fileUrl": "http://localhost:5173/dummyImg/Balance_Report.png", "documentType": "BALANCE_SHEET_REPORT"}'
```
