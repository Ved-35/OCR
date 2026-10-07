import React, { useState, useEffect, useRef } from 'react';
import { doc } from '../utils/constant';
import { getPanCardSvg, getAadhaarCardSvg, getElectricityBillSvg, getProjectReportSvg } from '../utils/dummyDocs';
import { extractDocumentOcr } from '../services/api';

type DocKey = keyof typeof doc;

interface FormFieldItem {
  key: string;
  title: string;
  type: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  dropdown?: string;
  header?: string;
  subHeader?: string;
}

const DOCUMENT_IMAGES: Record<DocKey, string> = {
  AadharCard: '/dummyImg/aadhar_card.png',
  PanCard: '/dummyImg/pan_card.png',
  ElectricityBill: '/dummyImg/ebill.webp',
  ProjectReport: '/dummyImg/PROJECT_REPORT.pdf',
  UdyamRegistrationCertificate: '/dummyImg/UDHYAM_REGISTRATION_CERTIFICATE.pdf',
  GSTCertificate: '/dummyImg/GST_CERTIFICATE.pdf',
  BirthCertificate: '/dummyImg/Birth_Certificate.png',
  LoanSanctionLetter: '/dummyImg/Loan_Sanction_Letter.png',
  BalanceSheetReport: '/dummyImg/Balance_Report.png',
};

export interface SampleDocOption {
  label: string;
  url: string;
}

/** Registry of sample documents added in public/dummyImg/SAMPLE/ */
const SAMPLE_DOCUMENTS: Partial<Record<DocKey, SampleDocOption[]>> = {
  LoanSanctionLetter: [
    { label: 'Default Sample (PNG)', url: '/dummyImg/Loan_Sanction_Letter.png' },
    { label: 'Axis Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_AXIS.pdf' },
    { label: 'Bank of Baroda (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LATTER_BOB.pdf' },
    { label: 'Canara Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_CANARA.pdf' },
    { label: 'Central Bank of India (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_CBI.pdf' },
    { label: 'HDFC Bank - Sample 1 (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_HDFC.pdf' },
    { label: 'HDFC Bank - Sample 2 (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_HDFC1.pdf' },
    { label: 'ICICI Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_ICICI.pdf' },
    { label: 'Indian Overseas Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER _IOB.pdf' },
    { label: 'Kalupur Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_KALUPUR.pdf' },
    { label: 'Prime Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_PRIME.pdf' },
    { label: 'SIDBI (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTR_SIDBI.pdf' },
    { label: 'Varachha Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_VARACHHA.pdf' },
    { label: 'Yes Bank (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SANCTION_YES.pdf' },
    { label: 'Sanction Letter 001 (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/NEW_SANTION_LATER_001.pdf' },
    { label: 'Sanction Sample 4230 (PDF)', url: '/dummyImg/SAMPLE/sanction_latter/SENTION_4230.pdf' },
  ],
  UdyamRegistrationCertificate: [
    { label: 'Default Certificate (PDF)', url: '/dummyImg/UDHYAM_REGISTRATION_CERTIFICATE.pdf' },
    { label: 'New UAM Sample 001 (PDF)', url: '/dummyImg/SAMPLE/udyam_registration_certicate/NEW_UAM_001.pdf' },
    { label: 'UAM 4000 (PDF)', url: '/dummyImg/SAMPLE/udyam_registration_certicate/UAM4000.pdf' },
    { label: 'Udyog Aadhaar Sample 1 (PDF)', url: '/dummyImg/SAMPLE/udyam_registration_certicate/UDHYOG_ADHAR.PDF' },
    { label: 'Udyog Aadhaar 2018 (PDF)', url: '/dummyImg/SAMPLE/udyam_registration_certicate/UDHYOG_ADHAR25082018.pdf' },
    { label: 'Udyog Aadhaar Sample 2 (PDF)', url: '/dummyImg/SAMPLE/udyam_registration_certicate/U_ADHAR.PDF' },
  ],
  ProjectReport: [
    { label: 'Default Project Report (PDF)', url: '/dummyImg/PROJECT_REPORT.pdf' },
    { label: 'Project Sample (PDF)', url: '/dummyImg/SAMPLE/project_report/PROJECT.PDF' },
    { label: 'Project 001 (PDF)', url: '/dummyImg/SAMPLE/project_report/PROJECT_001.pdf' },
    { label: 'Project Report Full (PDF)', url: '/dummyImg/SAMPLE/project_report/PROJECT_REPORT.PDF' },
    { label: 'Project Report 4000 (PDF)', url: '/dummyImg/SAMPLE/project_report/PROJECT_REPORT4000.pdf' },
    { label: 'PR 001 (PDF)', url: '/dummyImg/SAMPLE/project_report/PR_001.pdf' },
  ],
  BalanceSheetReport: [
    { label: 'Default Balance Report (PNG)', url: '/dummyImg/Balance_Report.png' },
    { label: 'Audit Report (PDF)', url: '/dummyImg/SAMPLE/itr_and_audit_report/AUDIT_REPORT.pdf' },
    { label: 'ITR 4000 (PDF)', url: '/dummyImg/SAMPLE/itr_and_audit_report/ITR4000.pdf' },
    { label: 'ITR 4230 Audit (PDF)', url: '/dummyImg/SAMPLE/itr_and_audit_report/ITR4230 audit.pdf' },
  ],
};

/** Maps frontend DocKey to backend DocumentType enum */
const DOC_TYPE_MAP: Record<DocKey, string> = {
  AadharCard: 'AADHAAR_CARD',
  PanCard: 'PAN_CARD',
  ElectricityBill: 'ELECTRICITY_BILL',
  ProjectReport: 'PROJECT_REPORT',
  UdyamRegistrationCertificate: 'UDYAM_REGISTRATION_CERTIFICATE',
  GSTCertificate: 'GST_CERTIFICATE',
  BirthCertificate: 'BIRTH_CERTIFICATE',
  LoanSanctionLetter: 'LOAN_SANCTION_LETTER',
  BalanceSheetReport: 'BALANCE_SHEET_REPORT',
};

/**
 * Maps parser field names (from backend) to form field titles for OCR auto-filling.
 */
const FIELD_NAME_TO_TITLE: Record<string, string[]> = {
  // PAN Card
  panNumber: ['PAN NUMBER', 'PAN'],
  name: ['NAME', 'FULL NAME', 'LEGAL NAME', 'NAME:'],
  fatherName: ["FATHER'S NAME"],
  dateOfBirth: ['DATE OF BIRTH', 'DOB:', 'DOB', 'DATE OF INCORPORATION'],

  // Aadhaar
  aadhaarNumber: ['ADHAAR CARD NUMBER', 'ADHAR NUMBER', 'ADHAR CARD NUMBER', 'ADHAAR NUMBER', 'AADHAAR NUMBER', 'AADHAAR CARD NUMBER'],
  gender: ['GENDER', 'SEX'],
  address: ['ADDRESS LINE - 1', 'ADDRESS LINE-1', 'ADDRESS LINE 1'],

  // Electricity Bill
  consumerName: ['NAME', 'CONSUMER NAME'],
  consumerNumber: ['CONSUMER NO.', 'CONSUMER NUMBER', 'CUSTOMER NO.'],
  meterNumber: ['METER NO.', 'METER NUMBER'],
  subDivOffice: ['SUB DIV. OFFICE', 'SUB DIVISION OFFICE'],
  addressLine1: ['ADDRESS LINE-1', 'ADDRESS LINE - 1', 'ADDRESS LINE 1'],
  addressLine2: ['ADDRESS LINE-2', 'ADDRESS LINE - 2', 'ADDRESS LINE 2'],
  addressLine3: ['ADDRESS LINE 3'],
  area: ['AREA'],
  electricityCompany: ['ELECTRICITY COMPANY'],
  connectedLoad: ['CONNECTED LOAD'],
  connectionType: ['CONNECTION TYPE'],

  // Balance Sheet Report
  "PROPRIETOR'S CAPITAL": ["PROPRIETOR'S CAPITAL"],
  "PARTNER/DIRECTOR-1 CAPITAL": ["PARTNER/DIRECTOR-1 CAPITAL"],
  "PARTNER/DIRECTOR-2 CAPITAL": ["PARTNER/DIRECTOR-2 CAPITAL"],
  "PARTNER/DIRECTOR-3 CAPITAL": ["PARTNER/DIRECTOR-3 CAPITAL"],
  "TERM LOAN": ["TERM LOAN"],
  "PERSONAL LOAN": ["PERSONAL LOAN"],
  "SUNDRY CREDITOR": ["SUNDRY CREDITOR"],
  "DUTY AND TAXES": ["DUTY AND TAXES"],
  "WORKING CAPITAL LOAN": ["WORKING CAPITAL LOAN"],
  "OVERDRAFT": ["OVERDRAFT"],
  "TOTAL CURRENT LIABILITY": ["TOTAL CURRENT LIABILITY"],
  "PLANT AND MACHINERY": ["PLANT AND MACHINERY"],
  "ELECTRICAL FITTING": ["ELECTRICAL FITTING"],
  "FURNITURE & FIXTURES": ["FURNITURE & FIXTURES"],
  "CAR & VEHICLE": ["CAR & VEHICLE"],
  "ELECTRONIC EQUIPMENT": ["ELECTRONIC EQUIPMENT"],
  "OTHER FIXED ASSET": ["OTHER FIXED ASSET"],
  "TOTAL FIXED ASSET (A)": ["TOTAL FIXED ASSET (A)"],
  "GOLD": ["GOLD"],
  "SHARE": ["SHARE"],
  "FIXED DEPOSIT": ["FIXED DEPOSIT"],
  "OTHER INVESTMENT": ["OTHER INVESTMENT"],
  "TOTAL INVESTMENT (B)": ["TOTAL INVESTMENT (B)"],
  "CURRENT ASSET": ["CURRENT ASSET"],
  "SUNDRY DEBTOR": ["SUNDRY DEBTOR"],
  "STOCK": ["STOCK"],
  "CASH": ["CASH"],
  "BANK": ["BANK"],
  "OTHER CURRENT ASSET": ["OTHER CURRENT ASSET"],
  "TOTAL CURRENT ASSET (C)": ["TOTAL CURRENT ASSET (C)"],
  "GRAND TOTAL (A + B + C)": ["GRAND TOTAL (A + B + C)"],
  "LIABILITIES TOTAL": ["LIABILITIES TOTAL"],
  "ASSETS TOTAL": ["ASSETS TOTAL"],

  // Udyam
  udyamRegistrationNumber: ['UDYAM REGISTRATION NUMBER'],
  firmName: ['FIRM NAME', 'NAME OF ENTERPRISE'],
  npvOldMachinery: ['NPV OF OLD MACHINERY IN UDYAM'],
  dateOfIncorporation: ['DATE OF INCORPORATION'],
  dateOfCommencement: ['DATE OF COMMENCEMENT OF PRODUCTION'],
  mobileNumber: ['MOBILE NO.', 'MOBILE NUMBER'],
  emailId: ['EMAIL ID'],
  pan: ['PAN'],
  typeOfOrganisation: ['TYPE OF ORGANISATION', 'CONSTITUTION OF BUSINESS'],
  dateOfUdyamRegistration: ['DATE OF UDYAM REGISTRATION'],
  nicCode: ['NIC CODE'],
  categoryEnterprise: ['CATEGORY ENTERPRISE'],
  majorActivity: ['MAJOR ACTIVITY'],
  typeOfEnterprise: ['TYPE OF ENTERPRISE'],

  // GST
  gstin: ['GST REGISTRATION NUMBER', 'GSTIN / UIN'],
  legalName: ['LEGAL NAME'],
  tradeName: ['TRADE NAME'],
  constitution: ['CONSTITUTION'],
  dateOfLiability: ['DATE OF LIABILITY'],
  dateOfIssue: ['DATE OF ISSUE OF CERTIFICATE', 'DATE OF ISSUE'],
  proprietorName: ['NAME'],
  designation: ['DESIGNATION'],

  // Birth Certificate
  fullName: ['FULL NAME', 'NAME:'],

  // Loan Sanction Letter
  loanAmount: ['LOAN AMOUNT', 'SANCTIONED AMOUNT'],
  rateOfInterest: ['RATE OF INTEREST'],
  sanctionDate: ['LOAN SANCTION DATE'],
  applicationDate: ['LOAN APPLICATION DATE'],
  areaCode: ['AREA CODE'],
  moratoriumPeriod: ['MORATORIUM PERIOD'],
  margin: ['MARGIN'],
  oldMachinery: ['IS OLD MACHINERY LOAN SHOWN'],
  cgtmse: ['LOAN SANCTION UNDER CGTMSE'],
  branch: ['BRANCH'],
  repaymentTenure: ['LOAN REPAYMENT MONTH'],


};

/** Helper to extract all form field definitions from document configuration */
function getDocFormFields(docConfig: any): FormFieldItem[] {
  if (docConfig.fields && Array.isArray(docConfig.fields)) {
    return docConfig.fields.map((f: any) => ({
      key: String(f.id_document_fields || f.id || f.title),
      title: f.title,
      type: f.label_type || f.type || 'free_text',
      required: Boolean(f.is_required ?? f.required ?? true),
      placeholder: f.placeholder || f.title,
      maxLength: f.max_length || f.maxLength,
      dropdown: f.dropdown_value || f.dropdown,
      header: f.header_name || f.header,
      subHeader: f.sub_header_name || f.subHeader,
    }));
  }

  if (docConfig.sections && Array.isArray(docConfig.sections)) {
    const items: FormFieldItem[] = [];
    docConfig.sections.forEach((sec: any) => {
      sec.fields.forEach((fieldItem: any) => {
        const title = typeof fieldItem === 'string' ? fieldItem : fieldItem.title;
        const type = typeof fieldItem === 'string' ? 'free_text' : (fieldItem.type || 'free_text');
        const dropdown = typeof fieldItem === 'string' ? undefined : fieldItem.dropdown_value;
        items.push({
          key: title,
          title: title,
          type: type,
          required: true,
          placeholder: '0',
          dropdown: dropdown,
          header: sec.header_name,
          subHeader: sec.sub_header_name,
        });
      });
    });
    return items;
  }

  return [];
}

export const DocumentVerificationUI: React.FC = () => {
  const [selectedDocKey, setSelectedDocKey] = useState<DocKey>('AadharCard');
  const [selectedSampleUrl, setSelectedSampleUrl] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [status, setStatus] = useState<string>('PENDING');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrToast, setOcrToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = doc[selectedDocKey] as any;
  const formFields = getDocFormFields(currentDoc);

  useEffect(() => {
    setImageError(false);
  }, [selectedDocKey, uploadedPreviewUrl, selectedSampleUrl]);

  // Clean up uploaded file & sample state when switching document tab
  useEffect(() => {
    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
    }
    setUploadedFile(null);
    setUploadedPreviewUrl(null);
    setUploadedDataUrl(null);
    setSelectedSampleUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedDocKey]);

  // Initialize form fields as empty when document tab changes
  useEffect(() => {
    const emptyData: Record<string, string> = {};
    formFields.forEach((field) => {
      emptyData[field.key] = '';
    });
    setFormData(emptyData);
    setSubmitted(false);
    setOcrToast(null);
  }, [selectedDocKey]);

  // ─────────── File Upload & Drag-and-Drop Handlers ───────────
  const processUploadedFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setOcrToast({
        message: '❌ Unsupported file format. Please upload a PDF or an Image (PNG, JPG, WebP).',
        type: 'error',
      });
      return;
    }

    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
    }
    const previewBlob = isPdf ? new Blob([file], { type: 'application/pdf' }) : file;
    const previewUrl = URL.createObjectURL(previewBlob);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedFile(file);
      setUploadedPreviewUrl(previewUrl);
      setUploadedDataUrl(dataUrl);

      setOcrToast({
        message: `📄 Uploaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Click "Extract with OCR" when ready.`,
        type: 'success',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const clearUploadedFile = () => {
    if (uploadedPreviewUrl) {
      URL.revokeObjectURL(uploadedPreviewUrl);
    }
    setUploadedFile(null);
    setUploadedPreviewUrl(null);
    setUploadedDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setOcrToast({
      message: '🔄 Reverted to default sample document.',
      type: 'success',
    });
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('SUBMITTED');
    setSubmitted(true);
    setTimeout(() => {
      alert(`Data for ${currentDoc.document_name} submitted successfully!`);
    }, 100);
  };

  // ─────────── OCR Extraction Core ───────────
  const triggerOcrForFile = async (targetFileUrl?: string) => {
    setOcrLoading(true);
    setOcrToast(null);

    const normStr = (s: string) => s.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    try {
      let fileUrl = targetFileUrl || uploadedDataUrl;
      if (!fileUrl) {
        const docPath = selectedSampleUrl || DOCUMENT_IMAGES[selectedDocKey] || '/dummyImg/pan_card.png';
        fileUrl = `${window.location.origin}${docPath}`;
      }

      const documentType = DOC_TYPE_MAP[selectedDocKey] || 'PAN_CARD';
      const result = await extractDocumentOcr(fileUrl, documentType);

      if (result.success && result.fields) {
        const updatedData = { ...formData };
        let filledCount = 0;

        for (const [fieldName, value] of Object.entries(result.fields)) {
          const matchingTitles = FIELD_NAME_TO_TITLE[fieldName] ?? [fieldName];
          const normFieldName = normStr(fieldName);

          for (const field of formFields) {
            const cleanTitle = field.title.replace(/:$/, '').trim();
            const cleanKey = field.key.trim();
            const normKey = normStr(cleanKey);
            const normTitle = normStr(cleanTitle);

            const titleMatch =
              normKey === normFieldName ||
              normTitle === normFieldName ||
              matchingTitles.some((t) => {
                const normT = normStr(t.replace(/:$/, ''));
                return normT === normTitle || normT === normKey;
              });

            if (titleMatch && value) {
              if (field.type === 'date' && /^\d{2}[\/-]\d{2}[\/-]\d{4}$/.test(value)) {
                const parts = value.split(/[\/\-]/);
                updatedData[field.key] = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (field.type === 'dropdown') {
                const options = getDropdownOptions(field.dropdown);
                const normVal = normStr(value);
                const matchedOpt = options.find((opt) => {
                  const normOpt = normStr(opt);
                  return (
                    normOpt === normVal ||
                    normOpt.includes(normVal) ||
                    normVal.includes(normOpt)
                  );
                });
                updatedData[field.key] = matchedOpt || options[0] || value;
              } else {
                updatedData[field.key] = value;
              }
              filledCount++;
            }
          }
        }

        setFormData(updatedData);
        setOcrToast({
          message: `✅ OCR extracted ${filledCount} fields in ${result.processingTimeMs}ms (${result.pages} page${result.pages > 1 ? 's' : ''})`,
          type: 'success',
        });
      } else {
        setOcrToast({
          message: `❌ OCR failed: ${result.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (err) {
      setOcrToast({
        message: `❌ OCR error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOcrExtract = () => {
    triggerOcrForFile();
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (ocrToast) {
      const timer = setTimeout(() => setOcrToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [ocrToast]);

  // SVG Fallback renderer
  const renderDocSvg = () => {
    const nameField = formFields.find((f) => f.title.includes('NAME'));
    const fatherField = formFields.find((f) => f.title.includes('FATHER'));
    const panField = formFields.find((f) => f.title.includes('PAN'));

    const name = (nameField && formData[nameField.key]) || 'APPLICANT NAME';
    const fatherName = (fatherField && formData[fatherField.key]) || "APPLICANT'S FATHER NAME";
    const panNo = (panField && formData[panField.key]) || 'ABCDE1234F';

    switch (selectedDocKey) {
      case 'PanCard':
        return getPanCardSvg(name, fatherName, panNo);
      case 'AadharCard':
        return getAadhaarCardSvg(name);
      case 'ElectricityBill':
        return getElectricityBillSvg(name);
      case 'ProjectReport':
        return getProjectReportSvg();
      default:
        return getPanCardSvg();
    }
  };

  const getDropdownOptions = (dropdownType?: string) => {
    switch (dropdownType) {
      case 'Area Code':
        return ['380015 - Satellite', '380009 - Navrangpura', '380054 - Thaltej', '380058 - Bopal', '394270 - Surat', '395010 - Surat'];
      case 'Gender':
        return ['MALE', 'FEMALE', 'OTHER'];
      case 'Division':
        return ['WEST DIVISION', 'EAST DIVISION', 'NORTH DIVISION', 'SOUTH DIVISION'];
      case 'Connection Type':
        return ['LT SINGLE PHASE', 'LT THREE PHASE', 'HT INDUSTRIAL'];
      case 'Electricity Company':
        return ['UGVCL', 'DGVCL', 'MGVCL', 'PGVCL', 'TORRENT POWER'];
      case 'Bank':
        return ['STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'AXIS BANK', 'BANK OF BARODA'];
      case 'Constitution Type':
        return ['Proprietorship', 'Private Limited Company', 'Partnership', 'Public Limited', 'Individual'];
      case 'Category Owner':
        return ['General', 'OBC', 'SC', 'ST'];
      case 'Activity':
        return ['Manufacturing', 'Services', 'Trading'];
      case 'Category Enterprise':
        return ['Micro', 'Small', 'Medium'];
      case 'NIC Code':
        return ['13991 - Embroidery work', '1399 - Manufacture of other textiles', '13121 - Weaving', '13 - Manufacture of textiles'];
      default:
        return ['OPTION 1', 'OPTION 2', 'OPTION 3'];
    }
  };

  const activeSampleUrl = selectedSampleUrl || DOCUMENT_IMAGES[selectedDocKey];
  const activeDocUrl = uploadedPreviewUrl || activeSampleUrl;
  const isPdfDoc = uploadedFile
    ? uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf')
    : activeDocUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div className="doc-verifier-wrapper">
      {/* Hidden File Input for Custom Document Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        style={{ display: 'none' }}
      />

      {/* Document Selector Top Bar */}
      <div className="doc-tabs-bar" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '0.5rem' }}>
        <span className="doc-tabs-label" style={{ whiteSpace: 'nowrap' }}>Select Document:</span>
        {(Object.keys(doc) as DocKey[]).map((key) => (
          <button
            key={key}
            className={`doc-tab-btn ${selectedDocKey === key ? 'active' : ''}`}
            onClick={() => setSelectedDocKey(key)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {(doc[key] as any).document_name || key} {DOCUMENT_IMAGES[key]?.endsWith('.pdf') ? '(PDF)' : ''}
          </button>
        ))}
      </div>

      {/* Main Verification Card matching screenshot layout */}
      <div className="doc-verifier-card">
        {/* Header Bar */}
        <div className="doc-header">
          <div className="doc-header-left">
            <button className="back-btn" title="Go Back">
              ←
            </button>
            <span className="doc-title-text">
              KUNJ {(currentDoc?.document_name || selectedDocKey).toUpperCase()} (INDIVIDUAL)_1
            </span>
            <span className={`status-pill ${status.toLowerCase()}`}>
              {status}
            </span>
          </div>

          <div className="doc-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="upload-doc-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload a custom PDF or image document from your computer for OCR"
            >
              📤 UPLOAD DOCUMENT
            </button>

            <button
              className="status-pill status-pill-action ocr-extract-btn"
              onClick={handleOcrExtract}
              disabled={ocrLoading}
              title="Extract text and auto-fill fields using OCR"
              style={{
                cursor: ocrLoading ? 'wait' : 'pointer',
                opacity: ocrLoading ? 0.7 : 1,
                border: 'none',
                fontWeight: 600,
              }}
            >
              {ocrLoading ? '⏳ Extracting…' : '🔍 Extract with OCR'}
            </button>

            <a
              href={activeDocUrl}
              target="_blank"
              rel="noreferrer"
              className="status-pill status-pill-action"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {isPdfDoc ? '📄 VIEW PDF' : '🔍 OPEN FULL'}
            </a>
          </div>

          {/* OCR Toast Notification */}
          {ocrToast && (
            <div
              className={`ocr-toast ${ocrToast.type}`}
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '0.5rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                zIndex: 50,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                background: ocrToast.type === 'success' ? '#10b981' : '#ef4444',
                color: '#fff',
                animation: 'fadeInDown 0.3s ease',
              }}
            >
              {ocrToast.message}
            </div>
          )}
        </div>

        {/* Split Screen Content */}
        <div className="doc-body-split">
          {/* Left Column: Document Viewer (PDF or Image) with Drag & Drop */}
          <div
            className={`doc-left-panel left-panel-dropzone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Visual Overlay */}
            {isDragging && (
              <div className="doc-drag-overlay">
                <div style={{ fontSize: '2.5rem' }}>📥</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Drop Document Here</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Supports PDF, PNG, JPG, WebP</div>
              </div>
            )}

            {/* Uploaded File Banner */}
            {uploadedFile && (
              <div className="uploaded-file-banner">
                <span className="uploaded-file-name" title={uploadedFile.name}>
                  📄 <strong>Uploaded:</strong> {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  className="clear-upload-btn"
                  onClick={clearUploadedFile}
                  title="Remove uploaded document and revert to sample"
                >
                  ✕ Revert to sample
                </button>
              </div>
            )}

            {/* Sample Selector Dropdown (when multiple samples exist for current document key) */}
            {SAMPLE_DOCUMENTS[selectedDocKey] && (
              <div
                className="sample-selector-bar"
                style={{
                  marginBottom: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.85)',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>📂</span> Sample Document:
                </label>
                <select
                  value={selectedSampleUrl || DOCUMENT_IMAGES[selectedDocKey]}
                  onChange={(e) => {
                    setSelectedSampleUrl(e.target.value);
                    if (uploadedPreviewUrl) {
                      URL.revokeObjectURL(uploadedPreviewUrl);
                    }
                    setUploadedFile(null);
                    setUploadedPreviewUrl(null);
                    setUploadedDataUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="form-input custom-select"
                  style={{ width: '100%', padding: '0.35rem 0.6rem', fontSize: '0.825rem', background: '#fff', borderRadius: '6px' }}
                >
                  {SAMPLE_DOCUMENTS[selectedDocKey]?.map((opt) => (
                    <option key={opt.url} value={opt.url}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="doc-image-container">
              {isPdfDoc ? (
                <div className="pdf-viewer-container" style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                  <object
                    data={`${activeDocUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    type="application/pdf"
                    style={{
                      width: '100%',
                      height: '520px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                    }}
                  >
                    <iframe
                      src={`${activeDocUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                      title={`${currentDoc.document_name} PDF`}
                      className="doc-pdf-frame"
                      style={{
                        width: '100%',
                        height: '520px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        background: '#ffffff',
                      }}
                    />
                  </object>
                </div>
              ) : !imageError ? (
                <img
                  src={activeDocUrl}
                  alt={currentDoc?.document_name || selectedDocKey}
                  className="doc-real-img"
                  onError={() => setImageError(true)}
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    maxWidth: '100%',
                    maxHeight: '480px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div
                  className="doc-svg-wrapper"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderDocSvg() }}
                />
              )}
            </div>

            {/* Image Viewer Toolbar (for image documents) */}
            {!isPdfDoc && (
              <div className="image-toolbar">
                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  title="Zoom Out"
                >
                  −
                </button>

                <span className="zoom-text">{zoomLevel}%</span>

                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                  title="Zoom In"
                >
                  +
                </button>

                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate"
                >
                  🔄
                </button>

                <button
                  type="button"
                  className="tool-btn"
                  onClick={() => {
                    setZoomLevel(100);
                    setRotation(0);
                  }}
                  title="Reset View"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Upload Helper Notice */}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.6rem', textAlign: 'center' }}>
              💡 Drag & drop any PDF or image here to upload & extract with OCR
            </div>
          </div>

          {/* Right Column: Dynamic Document Form (Supports flat fields & section-based layout like Balance Sheet) */}
          <div className="doc-right-panel">
            <form onSubmit={handleSubmit} className="dynamic-doc-form">
              {currentDoc.sections && Array.isArray(currentDoc.sections) ? (
                // Section-based Form Layout (Matches Balance Sheet Report screenshot)
                currentDoc.sections.map((section: any, secIdx: number) => {
                  const showHeaderBox =
                    secIdx === 0 || currentDoc.sections[secIdx - 1].header_name !== section.header_name;

                  return (
                    <div key={secIdx} className="section-block">
                      {/* Section Card Header (e.g. LIABILITIES, ASSETS) */}
                      {showHeaderBox && (
                        <div className="section-header-box">
                          {section.header_name}
                        </div>
                      )}

                      {/* Subheader Title (e.g. ↳ CAPITAL ( A )) */}
                      {section.sub_header_name && (
                        <div className="section-subheader-title">
                          <span className="subheader-arrow">↳</span> {section.sub_header_name}
                        </div>
                      )}

                      {/* Fields inside section */}
                      {section.fields.map((fieldItem: any, fieldIdx: number) => {
                        const title = typeof fieldItem === 'string' ? fieldItem : fieldItem.title;
                        const type = typeof fieldItem === 'string' ? 'free_text' : (fieldItem.type || 'free_text');
                        const dropdownValue = typeof fieldItem === 'string' ? undefined : fieldItem.dropdown_value;

                        return (
                          <div key={fieldIdx} className="form-field-group" style={{ marginBottom: '0.8rem' }}>
                            <label className="field-label">
                              {title} <span className="required-star">*</span>
                            </label>

                            {type === 'dropdown' ? (
                              <div className="select-wrapper">
                                <select
                                  className="form-input custom-select"
                                  value={formData[title] || ''}
                                  onChange={(e) => handleInputChange(title, e.target.value)}
                                  required
                                >
                                  <option value="">SELECT {title}</option>
                                  {getDropdownOptions(dropdownValue).map((opt, i) => (
                                    <option key={i} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <input
                                type="text"
                                className="form-input"
                                placeholder="0"
                                value={formData[title] || ''}
                                onChange={(e) => handleInputChange(title, e.target.value)}
                                required
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // Flat Field Array Layout (Standard Documents)
                formFields.map((field) => (
                  <div key={field.key} className="form-field-group">
                    {field.subHeader && (
                      <div className="field-subheader-tag">{field.subHeader}</div>
                    )}

                    <label className="field-label">
                      {field.title}{' '}
                      {field.required && <span className="required-star">*</span>}
                    </label>

                    {field.type === 'dropdown' ? (
                      <div className="select-wrapper">
                        <select
                          className="form-input custom-select"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          required={field.required}
                        >
                          <option value="">{field.placeholder || `SELECT ${field.title}`}</option>
                          {getDropdownOptions(field.dropdown).map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === 'date' ? (
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          className="form-input date-input"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={field.placeholder || 'dd/mm/yyyy'}
                          required={field.required}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        inputMode={field.type === 'numeric' ? 'numeric' : undefined}
                        className="form-input"
                        placeholder={field.placeholder || field.title}
                        value={formData[field.key] || ''}
                        maxLength={field.maxLength}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))
              )}

              <div className="form-submit-container">
                <button type="submit" className="submit-data-btn">
                  {submitted ? '✓ Data Submitted' : 'Submit Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
