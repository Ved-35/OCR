import React, { useState, useEffect } from 'react';
import { extractOcrData } from '../services/api';

/** Default Sample Schema matching User Prompt */
const DEFAULT_PAN_SCHEMA = {
  PanCard: {
    document_id: 57,
    document_name: 'PAN Card',
    fields: [
      {
        id: 3829,
        title: 'PAN NUMBER',
        type: 'alphanumeric',
        required: true,
        placeholder: 'ENTER PAN NUMBER',
        minLength: 5,
        maxLength: 10,
        fieldOrder: 1,
        category: 'PERSONAL DOCUMENT',
      },
      {
        id: 3830,
        title: 'NAME',
        type: 'alphanumeric',
        required: true,
        placeholder: 'ENTER PAN NAME',
        minLength: 5,
        maxLength: 30,
        fieldOrder: 2,
        category: 'FIRM NAME SCRUTINY, PERSONAL DOCUMENT',
      },
      {
        id: 3831,
        title: 'DATE OF INCORPORATION',
        type: 'date',
        required: true,
        placeholder: 'DD/MM/YYYY',
        fieldOrder: 3,
        category: 'BUSINESS DOCUMENT',
      },
    ],
  },
};

const SAMPLE_BIRTH_SCHEMA = {
  BirthCertificate: {
    document_id: 88,
    document_name: 'Birth Certificate',
    fields: [
      {
        id: 2027,
        title: 'FULL NAME',
        type: 'free_text',
        required: true,
        placeholder: 'ENTER FULL NAME',
        fieldOrder: 1,
        category: 'PERSONAL DOCUMENT',
      },
      {
        id: 2028,
        title: 'DATE OF BIRTH',
        type: 'date',
        required: true,
        placeholder: 'DD/MM/YYYY',
        fieldOrder: 2,
        category: 'PERSONAL DOCUMENT',
      },
    ],
  },
};

const SAMPLE_GST_SCHEMA = {
  GSTCertificate: {
    document_id: 88,
    document_name: 'GST Registration Certificate',
    fields: [
      { id: 101, title: 'GST REGISTRATION NUMBER', type: 'alphanumeric', required: true, placeholder: 'ENTER GSTIN' },
      { id: 102, title: 'LEGAL NAME', type: 'alphanumeric', required: true, placeholder: 'ENTER LEGAL NAME' },
      { id: 103, title: 'TRADE NAME', type: 'alphanumeric', required: false, placeholder: 'ENTER TRADE NAME' },
      { id: 104, title: 'DATE OF LIABILITY', type: 'date', required: true, placeholder: 'DD/MM/YYYY' },
    ],
  },
};

const SAMPLE_LOAN_SCHEMA = {
  LoanSanctionLetter: {
    document_id: 52,
    document_name: 'Loan Sanction Letter',
    fields: [
      { id: 201, title: 'LOAN SANCTION DATE', type: 'date', required: true, placeholder: 'DD/MM/YYYY' },
      { id: 202, title: 'FIRM NAME', type: 'alphanumeric', required: true, placeholder: 'ENTER FIRM NAME' },
      { id: 203, title: 'LOAN AMOUNT', type: 'numeric', required: true, placeholder: 'ENTER LOAN AMOUNT' },
      { id: 204, title: 'RATE OF INTEREST', type: 'numeric', required: true, placeholder: 'ENTER RATE OF INTEREST' },
      { id: 205, title: 'BANK', type: 'dropdown', required: true, placeholder: 'SELECT BANK', dropdown: 'Bank' },
    ],
  },
};

interface SchemaFieldItem {
  id?: number | string;
  title: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  dropdown?: string;
  category?: string;
}

export const CustomDocumentVerificationUI: React.FC = () => {
  // Document state
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>('/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_AXIS.pdf');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('/dummyImg/SAMPLE/sanction_latter/SANCTION_LETTER_AXIS.pdf');
  const [uploadedFileName, setUploadedFileName] = useState<string>('SANCTION_LETTER_AXIS.pdf');

  // Convert base64 data URLs to Blob URLs for cross-browser iframe PDF rendering
  const getPdfPreviewUrl = (dataUrl: string, blobUrl?: string): string => {
    if (blobUrl) return blobUrl;
    if (!dataUrl) return '';
    if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/')) {
      return dataUrl;
    }
    if (dataUrl.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = dataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Failed to convert base64 PDF to blob URL:', e);
      }
    }
    return dataUrl;
  };

  // Schema state
  const [jsonSchemaText, setJsonSchemaText] = useState<string>(JSON.stringify(DEFAULT_PAN_SCHEMA, null, 2));
  const [parsedSchema, setParsedSchema] = useState<any>(DEFAULT_PAN_SCHEMA);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(true);

  // Modal state for pasting raw JSON
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedJsonInput, setPastedJsonInput] = useState<string>('');

  // Field adder inputs
  const [newFieldTitle, setNewFieldTitle] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<string>('alphanumeric');

  // Form values state
  const [formData, setFormData] = useState<Record<string, string>>({});

  // OCR state
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [ocrToast, setOcrToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // PDF Viewer controls
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Helper to load schema and reset form state
  const loadSchema = (schemaObj: any, message?: string) => {
    setJsonSchemaText(JSON.stringify(schemaObj, null, 2));
    setParsedSchema(schemaObj);
    setFormData({});
    setJsonError(null);
    if (message) {
      setOcrToast({ message, type: 'success' });
    }
  };

  // Parse JSON text on change
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonSchemaText);
      setParsedSchema(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  }, [jsonSchemaText]);

  // Universal Field List Extractor supporting any JSON structure (arrays, objects, maps)
  const getFieldsList = (): SchemaFieldItem[] => {
    if (!parsedSchema) return [];

    const list: SchemaFieldItem[] = [];

    const processItem = (item: any) => {
      if (typeof item === 'string' && item.trim().length > 0) {
        list.push({ title: item.trim().toUpperCase(), placeholder: `ENTER ${item.trim().toUpperCase()}` });
      } else if (item && typeof item === 'object') {
        const title = item.title || item.name || item.key || item.field || item.fieldName || item.label;
        if (title && typeof title === 'string') {
          list.push({
            id: item.id,
            title: title.trim().toUpperCase(),
            type: item.type || 'alphanumeric',
            required: item.required !== undefined ? Boolean(item.required) : true,
            placeholder: item.placeholder || `ENTER ${title.trim().toUpperCase()}`,
            dropdown: item.dropdown,
            category: item.category,
          });
        }
      }
    };

    // Case 1: Direct Array [ { id: 2027, title: "FULL NAME", ... }, { id: 2028, title: "DATE OF BIRTH", ... } ]
    if (Array.isArray(parsedSchema)) {
      parsedSchema.forEach(processItem);
      return list;
    }

    // Case 2: Object
    if (typeof parsedSchema === 'object' && parsedSchema !== null) {
      let target = parsedSchema;
      const keys = Object.keys(parsedSchema);

      if (keys.length === 1 && parsedSchema[keys[0]] && typeof parsedSchema[keys[0]] === 'object' && !parsedSchema.fields) {
        target = parsedSchema[keys[0]];
      }

      if (Array.isArray(target.fields)) {
        target.fields.forEach(processItem);
      }

      if (Array.isArray(target.sections)) {
        target.sections.forEach((sec: any) => {
          if (Array.isArray(sec.fields)) {
            sec.fields.forEach(processItem);
          }
        });
      }

      // Fallback: If no fields/sections array found, treat root key-value pairs as fields
      if (list.length === 0) {
        for (const [k, v] of Object.entries(target)) {
          if (['document_id', 'document_name', 'category'].includes(k)) continue;
          processItem(typeof v === 'object' ? { title: k, ...v } : { title: k });
        }
      }
    }

    return list;
  };

  const fieldsList = getFieldsList();

  // Get Document Title from Schema
  const getDocumentTitle = (): string => {
    if (!parsedSchema) return 'Custom Document';
    if (Array.isArray(parsedSchema)) {
      return 'Custom Fields Document';
    }
    if (typeof parsedSchema === 'object' && parsedSchema !== null) {
      const keys = Object.keys(parsedSchema);
      if (keys.length === 1 && parsedSchema[keys[0]]?.document_name) {
        return parsedSchema[keys[0]].document_name;
      }
      if (parsedSchema.document_name) return parsedSchema.document_name;
      if (keys.length > 0 && typeof keys[0] === 'string' && isNaN(Number(keys[0]))) {
        return keys[0];
      }
    }
    return 'Custom Document';
  };

  // Handle document file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const previewBlob = isPdf ? new Blob([file], { type: 'application/pdf' }) : file;
    const blobUrl = URL.createObjectURL(previewBlob);
    setPdfPreviewUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedDocUrl(event.target.result as string);
        setPdfPage(1);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle JSON Schema file upload
  const handleSchemaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        try {
          const text = event.target.result as string;
          const parsed = JSON.parse(text);
          loadSchema(parsed, `📁 Loaded JSON schema from ${file.name}`);
        } catch {
          alert('Invalid JSON file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Apply JSON string pasted into modal
  const handleApplyPastedJson = () => {
    if (!pastedJsonInput.trim()) {
      alert('Please paste a JSON snippet.');
      return;
    }
    try {
      const parsed = JSON.parse(pastedJsonInput);
      loadSchema(parsed, '✅ Successfully applied pasted JSON schema!');
      setShowPasteModal(false);
      setPastedJsonInput('');
    } catch (err) {
      alert('Invalid JSON syntax: ' + (err instanceof Error ? err.message : 'Check JSON syntax'));
    }
  };

  // Add field to JSON schema interactively (with JSON paste detection)
  const handleAddField = (titleToAdd?: string, typeToAdd?: string) => {
    const rawInput = (titleToAdd || newFieldTitle).trim();
    if (!rawInput) {
      alert('Please enter a Field Title or paste a JSON Schema');
      return;
    }

    // Check if user pasted a full JSON schema string!
    if (rawInput.startsWith('{') || rawInput.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawInput);
        loadSchema(parsed, '✅ Detected full JSON schema! Loaded new schema successfully.');
        setNewFieldTitle('');
        return;
      } catch {
        alert('Invalid JSON schema string pasted into Field Title. Please check JSON syntax.');
        return;
      }
    }

    // Normal field addition
    const title = rawInput.toUpperCase();
    const fType = typeToAdd || newFieldType || 'alphanumeric';

    try {
      let schemaObj = parsedSchema;
      if (!schemaObj || typeof schemaObj !== 'object' || jsonError) {
        schemaObj = {
          CustomDocument: {
            document_id: Date.now(),
            document_name: 'Custom Document',
            fields: [],
          },
        };
      }

      const cloned = JSON.parse(JSON.stringify(schemaObj));
      const keys = Object.keys(cloned);

      let target = cloned;
      if (keys.length === 1 && cloned[keys[0]] && typeof cloned[keys[0]] === 'object' && !cloned.fields) {
        target = cloned[keys[0]];
      }

      const newFieldObj = {
        id: Date.now(),
        title: title,
        type: fType,
        required: true,
        placeholder: `ENTER ${title}`,
      };

      if (Array.isArray(cloned)) {
        cloned.push(newFieldObj);
        setJsonSchemaText(JSON.stringify(cloned, null, 2));
      } else {
        if (!target.fields || !Array.isArray(target.fields)) {
          target.fields = [];
        }
        target.fields.push(newFieldObj);
        setJsonSchemaText(JSON.stringify(cloned, null, 2));
      }

      setNewFieldTitle('');
      setOcrToast({ message: `➕ Added field "${title}" to JSON schema!`, type: 'success' });
    } catch {
      alert('Failed to add field: Please fix JSON Schema syntax first.');
    }
  };

  // Remove field from JSON schema
  const handleRemoveField = (fieldTitleToRemove: string) => {
    try {
      if (!parsedSchema) return;
      const cloned = JSON.parse(JSON.stringify(parsedSchema));
      const keys = Object.keys(cloned);

      let target = cloned;
      if (keys.length === 1 && cloned[keys[0]] && typeof cloned[keys[0]] === 'object' && !cloned.fields) {
        target = cloned[keys[0]];
      }

      const filterItem = (f: any) => {
        const t = typeof f === 'string' ? f : f?.title || f?.name || f?.key;
        return t?.toUpperCase() !== fieldTitleToRemove.toUpperCase();
      };

      if (Array.isArray(cloned)) {
        setJsonSchemaText(JSON.stringify(cloned.filter(filterItem), null, 2));
      } else if (Array.isArray(target.fields)) {
        target.fields = target.fields.filter(filterItem);
        setJsonSchemaText(JSON.stringify(cloned, null, 2));
      }

      setOcrToast({ message: `🗑️ Removed field "${fieldTitleToRemove}"`, type: 'info' });
    } catch {
      // ignore
    }
  };

  // Run OCR Extraction
  const handleFetchOcrData = async () => {
    if (jsonError) {
      alert('Please fix JSON Schema syntax errors before running OCR.');
      return;
    }

    setIsExtracting(true);
    setOcrToast({ message: '⏳ Uploading & running OCR field extraction...', type: 'info' });

    try {
      const result = await extractOcrData({
        fileUrl: uploadedDocUrl,
        documentType: 'CUSTOM',
        customSchema: parsedSchema,
      });

      if (result.success && result.fields) {
        const updated = { ...formData };
        let count = 0;

        for (const [extractedKey, val] of Object.entries(result.fields)) {
          if (!val) continue;

          const normKey = extractedKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          // 1. Try exact match first
          let matchedField = fieldsList.find(
            (f) => f.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normKey
          );

          // 2. Fallback to title inclusion match (preventing cross-matching father/mother/spouse names with primary name)
          if (!matchedField) {
            matchedField = fieldsList.find((f) => {
              const normTitle = f.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normKey === 'name' || normKey === 'fullname') {
                if (normTitle.includes('father') || normTitle.includes('mother') || normTitle.includes('spouse')) {
                  return false;
                }
              }
              return normTitle.includes(normKey) || normKey.includes(normTitle);
            });
          }

          if (matchedField) {
            const fieldTitle = matchedField.title;
            if (matchedField.type === 'date') {
              if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(val)) {
                const parts = val.split(/[\/\-\.]/);
                updated[fieldTitle] = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                updated[fieldTitle] = val;
              } else {
                updated[fieldTitle] = val;
              }
            } else {
              updated[fieldTitle] = val;
            }
            count++;
          }
        }

        setFormData(updated);
        setOcrToast({
          message: `✅ OCR extracted ${count} fields in ${result.processingTimeMs}ms (${result.pages} page${result.pages > 1 ? 's' : ''})!`,
          type: 'success',
        });
      } else {
        setOcrToast({
          message: `❌ OCR Failed: ${result.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (err) {
      setOcrToast({
        message: `❌ OCR Error: ${err instanceof Error ? err.message : 'Extraction request failed'}`,
        type: 'error',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const isPdf = uploadedDocUrl.includes('application/pdf') || uploadedFileName.toLowerCase().endsWith('.pdf');

  return (
    <div style={{ padding: '0.5rem', width: '95vw', maxWidth: '95vw', margin: '0 auto' }}>
      {/* Toast Notification */}
      {ocrToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            background: ocrToast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : ocrToast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {ocrToast.message}
        </div>
      )}

      {/* Paste JSON Modal */}
      {showPasteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.15)',
              width: '100%',
              maxWidth: '750px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '1.25rem' }}>📋 Paste Raw JSON Schema (Array or Object)</h3>
              <button onClick={() => setShowPasteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Paste your raw JSON snippet below — e.g. direct array of fields <code>[&#123;"id": 2027, "title": "FULL NAME", ...&#125;]</code> or full document object.
            </p>
            <textarea
              rows={12}
              value={pastedJsonInput}
              onChange={(e) => setPastedJsonInput(e.target.value)}
              placeholder='[\n  {\n    "id": 2027,\n    "title": "FULL NAME",\n    "type": "free_text",\n    "required": true,\n    "placeholder": "NAME:"\n  }\n]'
              style={{
                width: '100%',
                background: '#090d16',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowPasteModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={handleApplyPastedJson}>
                ✅ Apply JSON Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
          padding: '1.25rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '1.25rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🧩 Dynamic Custom Document &amp; Schema Parser
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: 0 }}>
              Upload any document (PDF / Image) and define or upload a custom JSON schema to render fields and trigger PaddleOCR.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              📤 Upload Document
              <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>

            <button className="btn btn-secondary" onClick={() => setShowJsonEditor(!showJsonEditor)}>
              {showJsonEditor ? '🙈 Hide Schema Editor' : '⚙️ Edit JSON Schema'}
            </button>

            <button
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem', fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}
              onClick={handleFetchOcrData}
              disabled={isExtracting}
            >
              {isExtracting ? '⏳ Extracting Data...' : '🔍 EXTRACT WITH OCR'}
            </button>
          </div>
        </div>

        {/* Schema Loader Presets & File Bar */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Load Sample Schemas:</span>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => loadSchema(DEFAULT_PAN_SCHEMA, '📋 Loaded PAN Card Schema')}>
            📋 PAN Card
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => loadSchema(SAMPLE_BIRTH_SCHEMA, '📋 Loaded Birth Certificate Schema')}>
            📋 Birth Certificate
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => loadSchema(SAMPLE_GST_SCHEMA, '📋 Loaded GST Certificate Schema')}>
            📋 GST Certificate
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => loadSchema(SAMPLE_LOAN_SCHEMA, '📋 Loaded Loan Sanction Schema')}>
            📋 Loan Sanction Letter
          </button>

          <button className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: '#8b5cf6' }} onClick={() => setShowPasteModal(true)}>
            📋 Paste JSON Array / Object
          </button>

          <label className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', margin: 0 }}>
            📁 Upload .JSON Schema
            <input type="file" accept=".json" onChange={handleSchemaFileUpload} style={{ display: 'none' }} />
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>Active File:</span>
            <span style={{ fontSize: '0.8rem', color: '#f8fafc' }}>{uploadedFileName}</span>
          </div>
        </div>

        {/* Expandable JSON Schema Editor & Interactive Add Controls */}
        {showJsonEditor && (
          <div style={{ marginTop: '1rem', background: 'rgba(15, 23, 42, 0.85)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)' }}>
            {/* Quick Interactive Add Field / Paste JSON Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap', background: 'rgba(30, 41, 59, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>➕ Add Field or Paste JSON:</span>

              <input
                type="text"
                value={newFieldTitle}
                onChange={(e) => setNewFieldTitle(e.target.value)}
                placeholder="Field Title (e.g. INVOICE NUMBER) OR Paste JSON String..."
                style={{
                  flex: 1,
                  minWidth: '280px',
                  padding: '0.45rem 0.75rem',
                  background: '#090d16',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddField();
                }}
              />

              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: '#090d16',
                  color: '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="alphanumeric">Alphanumeric (Text)</option>
                <option value="date">Date (DD/MM/YYYY)</option>
                <option value="numeric">Numeric (Amount)</option>
                <option value="dropdown">Dropdown Options</option>
              </select>

              <button
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700, background: '#10b981' }}
                onClick={() => handleAddField()}
              >
                ➕ Load Field / Schema
              </button>
            </div>

            {/* Active Fields Badge Pills Manager */}
            {fieldsList.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Active Fields ({fieldsList.length}):</span>
                {fieldsList.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{f.title}</span>
                    <button
                      onClick={() => handleRemoveField(f.title)}
                      title={`Delete ${f.title} from JSON schema`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        padding: '0 0.2rem',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Raw JSON Schema Text Editor (Paste Any JSON Array or Object):</span>
              {jsonError ? (
                <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>❌ Syntax Error: {jsonError}</span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Valid Schema ({fieldsList.length} fields active)</span>
              )}
            </div>

            <textarea
              value={jsonSchemaText}
              onChange={(e) => setJsonSchemaText(e.target.value)}
              rows={8}
              placeholder="Paste custom JSON schema array [...] or object {...} here..."
              style={{
                width: '100%',
                background: '#090d16',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: jsonError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        )}
      </div>

      {/* Main Split View: Left Document Preview (50%) + Right Dynamic Form (50%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Document Viewer */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 220px)',
            minHeight: '800px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              📄 Document Preview ({uploadedFileName})
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                onClick={handleFetchOcrData}
                disabled={isExtracting}
              >
                {isExtracting ? '⏳ Extracting...' : '🔍 EXTRACT WITH OCR'}
              </button>

              {isPdf && (
                <>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}>
                    ◀ Prev Page
                  </button>

                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Page {pdfPage}</span>

                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setPdfPage(pdfPage + 1)}>
                    Next Page ▶
                  </button>

                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}>
                    🔍+
                  </button>

                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}>
                    🔍-
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: '#0f172a',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {isPdf ? (
              <object
                data={`${pdfPreviewUrl || getPdfPreviewUrl(uploadedDocUrl)}#page=${pdfPage}&zoom=${zoomLevel}`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff', borderRadius: '8px' }}
              >
                <iframe
                  src={`${pdfPreviewUrl || getPdfPreviewUrl(uploadedDocUrl)}#page=${pdfPage}&zoom=${zoomLevel}`}
                  title="Document Preview"
                  style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
                />
              </object>
            ) : (
              <img
                src={pdfPreviewUrl || uploadedDocUrl}
                alt="Document Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel / 100})`,
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column: Dynamically Rendered Form */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '16px',
            padding: '1.25rem',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 220px)',
            minHeight: '800px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa', margin: 0 }}>
                {getDocumentTitle()} Form
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Rendering {fieldsList.length} fields dynamically from JSON Schema
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                onClick={handleFetchOcrData}
                disabled={isExtracting}
              >
                {isExtracting ? '⏳ Extracting...' : '🔍 EXTRACT WITH OCR'}
              </button>

              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setFormData({})}>
                🔄 Clear Values
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {fieldsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <p style={{ fontSize: '1.1rem' }}>No fields found in the current JSON Schema.</p>
                <p style={{ fontSize: '0.85rem' }}>Use "➕ Add Field or Paste JSON" above or click "📋 Load Sample Schemas".</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {fieldsList.map((field, idx) => {
                  const val = formData[field.title] || '';
                  const isPopulated = Boolean(val);

                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: isPopulated ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: isPopulated ? '#34d399' : '#94a3b8', margin: 0 }}>
                          {field.title} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>

                        <button
                          onClick={() => handleRemoveField(field.title)}
                          title={`Delete field ${field.title}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            opacity: 0.7,
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {field.type === 'date' ? (
                        <input
                          type="date"
                          value={val}
                          onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            background: '#090d16',
                            color: '#f8fafc',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.85rem',
                          }}
                        />
                      ) : field.type === 'dropdown' ? (
                        <select
                          value={val}
                          onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            background: '#090d16',
                            color: '#f8fafc',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.85rem',
                          }}
                        >
                          <option value="">SELECT {field.title}</option>
                          <option value="STATE BANK OF INDIA">STATE BANK OF INDIA</option>
                          <option value="HDFC BANK">HDFC BANK</option>
                          <option value="ICICI BANK">ICICI BANK</option>
                          <option value="AXIS BANK">AXIS BANK</option>
                          <option value="BANK OF BARODA">BANK OF BARODA</option>
                          {val && !['STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'AXIS BANK', 'BANK OF BARODA'].includes(val) && (
                            <option value={val}>{val}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                          placeholder={field.placeholder || `ENTER ${field.title}`}
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.8rem',
                            background: '#090d16',
                            color: isPopulated ? '#f8fafc' : '#94a3b8',
                            border: isPopulated ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '6px',
                            outline: 'none',
                            fontSize: '0.85rem',
                            fontWeight: isPopulated ? 600 : 400,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
