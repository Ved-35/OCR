import React, { useState, useEffect, useRef } from 'react';
import { extractChallanOcrData, extractChallanAiOcrData } from '../services/api';

/** Default 13 Challan Bill Schema including Supplier & Recipient Addresses */
const DEFAULT_CHALLAN_SCHEMA = [
  {
    id: null,
    title: 'CHALLAN NUMBER',
    type: 'alphanumeric',
    required: true,
    placeholder: 'ENTER CHALLAN NUMBER',
    minLength: 1,
    maxLength: 20,
    fieldOrder: 1,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'CHALLAN DATE',
    type: 'date',
    required: true,
    placeholder: 'DD/MM/YYYY',
    fieldOrder: 2,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'SUPPLIER NAME',
    type: 'alphanumeric',
    required: true,
    placeholder: 'ENTER SUPPLIER NAME',
    minLength: 2,
    maxLength: 100,
    fieldOrder: 3,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'SUPPLIER ADDRESS',
    type: 'alphanumeric',
    required: false,
    placeholder: 'ENTER SUPPLIER ADDRESS',
    minLength: 5,
    maxLength: 300,
    fieldOrder: 4,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'SUPPLIER GST NUMBER',
    type: 'alphanumeric',
    required: false,
    placeholder: 'ENTER SUPPLIER GST NUMBER',
    minLength: 15,
    maxLength: 15,
    fieldOrder: 5,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'RECIPIENT NAME',
    type: 'alphanumeric',
    required: true,
    placeholder: 'ENTER RECIPIENT NAME',
    minLength: 2,
    maxLength: 100,
    fieldOrder: 6,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'RECIPIENT ADDRESS',
    type: 'alphanumeric',
    required: false,
    placeholder: 'ENTER RECIPIENT ADDRESS',
    minLength: 5,
    maxLength: 300,
    fieldOrder: 7,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'RECIPIENT GST NUMBER',
    type: 'alphanumeric',
    required: false,
    placeholder: 'ENTER RECIPIENT GST NUMBER',
    minLength: 15,
    maxLength: 15,
    fieldOrder: 8,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'QUALITY',
    type: 'alphanumeric',
    required: true,
    placeholder: 'ENTER QUALITY',
    minLength: 1,
    maxLength: 100,
    fieldOrder: 9,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'RATE',
    type: 'decimal',
    required: true,
    placeholder: 'ENTER RATE',
    fieldOrder: 10,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'TOTAL PIECES',
    type: 'numeric',
    required: true,
    placeholder: 'ENTER TOTAL PIECES',
    fieldOrder: 11,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'TOTAL METER',
    type: 'decimal',
    required: true,
    placeholder: 'ENTER TOTAL METER',
    fieldOrder: 12,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'BROKER NAME',
    type: 'alphanumeric',
    required: false,
    placeholder: 'ENTER BROKER NAME',
    minLength: 2,
    maxLength: 100,
    fieldOrder: 13,
    category: 'BUSINESS DOCUMENT',
  },
  {
    id: null,
    title: 'TAKA DETAILS',
    type: 'array',
    required: false,
    placeholder: 'ALL TAKA DETAILS (METERS)',
    fieldOrder: 14,
    category: 'BUSINESS DOCUMENT',
  },
];

export interface TakaItem {
  takaNo: number;
  meters: string;
  weight?: string;
}

interface SchemaFieldItem {
  id?: number | string | null;
  title: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  fieldOrder?: number;
  category?: string;
}

export const ChallanVerificationUI: React.FC = () => {
  // Document state
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>('/images/ganesh_textile/ganesh_sample_1.jpeg');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('/images/ganesh_textile/ganesh_sample_1.jpeg');
  const [uploadedFileName, setUploadedFileName] = useState<string>('WhatsApp Image 2026-09-28 at 10.36.20 AM (1).jpeg');

  // Schema state
  const [fieldsList, setFieldsList] = useState<SchemaFieldItem[]>(DEFAULT_CHALLAN_SCHEMA);
  const [jsonSchemaText, setJsonSchemaText] = useState<string>(JSON.stringify(DEFAULT_CHALLAN_SCHEMA, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(false);

  // Modal state for pasting raw JSON
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedJsonInput, setPastedJsonInput] = useState<string>('');

  // Field adder inputs
  const [newFieldTitle, setNewFieldTitle] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<string>('alphanumeric');

  // Form extraction state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAiExtracting, setIsAiExtracting] = useState<boolean>(false);
  const [ocrToast, setOcrToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Right column tab state: 'fields' vs 'takas'
  const [activeRightTab, setActiveRightTab] = useState<'fields' | 'takas'>('fields');
  const [takaViewMode, setTakaViewMode] = useState<'grid' | 'table'>('grid');

  // Safeguard: Ensure fieldsList contains the exact 14 standard fields without altering them
  useEffect(() => {
    setFieldsList((current) => {
      const titles = current.map((f) => f.title.toUpperCase());
      let updated = [...current];
      let changed = false;

      // Remove TOTAL WEIGHT if present so existing form fields remain exactly the original 14
      if (titles.includes('TOTAL WEIGHT')) {
        updated = updated.filter((f) => f.title.toUpperCase() !== 'TOTAL WEIGHT');
        changed = true;
      }

      if (!titles.includes('TAKA DETAILS')) {
        updated.push({
          id: null,
          title: 'TAKA DETAILS',
          type: 'array',
          required: false,
          placeholder: 'ALL TAKA DETAILS (METERS)',
          fieldOrder: updated.length + 1,
          category: 'BUSINESS DOCUMENT',
        });
        changed = true;
      }

      if (!titles.includes('SUPPLIER ADDRESS')) {
        const suppIdx = updated.findIndex((f) => f.title.toUpperCase() === 'SUPPLIER NAME');
        const insertAt = suppIdx >= 0 ? suppIdx + 1 : updated.length;
        updated.splice(insertAt, 0, {
          id: null,
          title: 'SUPPLIER ADDRESS',
          type: 'alphanumeric',
          required: false,
          placeholder: 'ENTER SUPPLIER ADDRESS',
          minLength: 5,
          maxLength: 300,
          fieldOrder: insertAt + 1,
          category: 'BUSINESS DOCUMENT',
        });
        changed = true;
      }

      if (!titles.includes('RECIPIENT ADDRESS')) {
        const recipIdx = updated.findIndex((f) => f.title.toUpperCase() === 'RECIPIENT NAME');
        const insertAt = recipIdx >= 0 ? recipIdx + 1 : updated.length;
        updated.splice(insertAt, 0, {
          id: null,
          title: 'RECIPIENT ADDRESS',
          type: 'alphanumeric',
          required: false,
          placeholder: 'ENTER RECIPIENT ADDRESS',
          minLength: 5,
          maxLength: 300,
          fieldOrder: insertAt + 1,
          category: 'BUSINESS DOCUMENT',
        });
        changed = true;
      }

      // Re-normalize field orders to 1..N
      updated = updated.map((f, i) => ({ ...f, fieldOrder: i + 1 }));

      if (changed) {
        setJsonSchemaText(JSON.stringify(updated, null, 2));
      }
      return changed ? updated : current;
    });
  }, []);

  // Taka piece details state
  const [takasList, setTakasList] = useState<TakaItem[]>([]);
  const [takaSearch, setTakaSearch] = useState<string>('');

  // Calculate live sum of meters and weight from takasList
  const takaTotalMeters = takasList.reduce((sum, t) => sum + (parseFloat(t.meters) || 0), 0);
  const takaTotalWeight = takasList.reduce((sum, t) => sum + (parseFloat(t.weight || '0') || 0), 0);
  const formatWeightDisplay = (w: number) => {
    if (w >= 500) {
      const inKg = w / 1000;
      return inKg % 1 === 0 ? inKg.toString() : inKg.toFixed(2);
    }
    return (w % 1 === 0 ? w.toString() : w.toFixed(2));
  };

  // Helper to format TAKA DETAILS summary string
  const formatTakaDetailsString = (takas: TakaItem[]) => {
    if (takas.length === 0) return '';
    const mSum = takas.reduce((acc, t) => acc + (parseFloat(t.meters) || 0), 0);
    const wSum = takas.reduce((acc, t) => acc + (parseFloat(t.weight || '0') || 0), 0);
    if (wSum > 0) {
      return `${takas.length} Takas (${mSum.toFixed(2)} Mtr, ${formatWeightDisplay(wSum)} Kg)`;
    }
    return `${takas.length} Takas (${mSum.toFixed(2)} Mtr)`;
  };

  // Update specific taka meters dynamically
  const handleUpdateTakaMeters = (takaNo: number, meters: string) => {
    setTakasList((prev) => {
      const next = prev.map((t) => (t.takaNo === takaNo ? { ...t, meters } : t));
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(next),
      }));
      return next;
    });
  };

  // Update specific taka weight dynamically
  const handleUpdateTakaWeight = (takaNo: number, weight: string) => {
    setTakasList((prev) => {
      const next = prev.map((t) => (t.takaNo === takaNo ? { ...t, weight } : t));
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(next),
      }));
      return next;
    });
  };

  // Add new taka piece
  const handleAddTaka = () => {
    setTakasList((prev) => {
      const nextNo = prev.length > 0 ? Math.max(...prev.map((t) => t.takaNo)) + 1 : 1;
      const next = [...prev, { takaNo: nextNo, meters: '100.00', weight: '' }];
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(next),
        'TOTAL PIECES': next.length.toString(),
      }));
      return next;
    });
  };

  // Remove specific taka piece
  const handleRemoveTaka = (takaNo: number) => {
    setTakasList((prev) => {
      const next = prev.filter((t) => t.takaNo !== takaNo);
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(next),
        'TOTAL PIECES': next.length > 0 ? next.length.toString() : f['TOTAL PIECES'] || '',
      }));
      return next;
    });
  };

  // Sync Taka total meters to TOTAL METER field
  const handleSyncTakaToTotal = () => {
    const sum = takaTotalMeters.toFixed(2);
    setFormData((prev) => ({
      ...prev,
      'TOTAL METER': sum,
      'TOTAL PIECES': takasList.length.toString(),
      'TAKA DETAILS': formatTakaDetailsString(takasList),
    }));
    setOcrToast({
      message: `🔄 Synced Total Meter to ${sum} Mtr (${takasList.length} Takas)!`,
      type: 'success',
    });
  };

  // Copy all takas to clipboard with separated Meter and Weight columns
  const handleCopyTakasList = () => {
    if (takasList.length === 0) return;
    const header = `--- TAKA DETAILS (${takasList.length} Takas | Total Mtr: ${takaTotalMeters.toFixed(2)}m${takaTotalWeight > 0 ? ` | Total Wt: ${formatWeightDisplay(takaTotalWeight)}kg` : ''}) ---\n`;
    const rows = takasList
      .map((t) => `Taka #${t.takaNo.toString().padEnd(3)} | Meters: ${(t.meters || '0.00').padStart(7)} m | Weight: ${(t.weight || '—').padStart(7)}${t.weight ? ' kg' : ''}`)
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setOcrToast({ message: '📋 Copied all Taka meters & weights to clipboard!', type: 'success' });
  };

  // Toggle pairing/unpairing for challans with alternating Meter & Weight columns
  const handleToggleMeterWeightSplit = () => {
    if (takasList.length === 72 && (!takasList[0].weight || parseFloat(takasList[0].weight) === 0)) {
      // Pair 72 single-meter items into 36 items with distinct Meters & Weights
      const paired: TakaItem[] = [];
      let takaIdx = 1;
      // Col 1 (Meters 0-11) + Col 2 (Weight 12-23)
      for (let i = 0; i < 12; i++) {
        paired.push({
          takaNo: takaIdx++,
          meters: takasList[i]?.meters || '0.00',
          weight: takasList[i + 12]?.meters || '0.00',
        });
      }
      // Col 3 (Meters 24-35) + Col 4 (Weight 36-47)
      for (let i = 24; i < 36; i++) {
        paired.push({
          takaNo: takaIdx++,
          meters: takasList[i]?.meters || '0.00',
          weight: takasList[i + 12]?.meters || '0.00',
        });
      }
      // Col 5 (Meters 48-59) + Col 6 (Weight 60-71)
      for (let i = 48; i < 60; i++) {
        paired.push({
          takaNo: takaIdx++,
          meters: takasList[i]?.meters || '0.00',
          weight: takasList[i + 12]?.meters || '0.00',
        });
      }
      setTakasList(paired);
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(paired),
      }));
      setOcrToast({
        message: '🔀 Paired columns into 36 Takas with distinct Meters & Weights!',
        type: 'success',
      });
    } else if (takasList.length === 36 && takasList[0].weight) {
      // Expand back to 72 individual column measurements
      const expanded: TakaItem[] = [];
      let takaIdx = 1;
      // Col 1 & 2
      for (let i = 0; i < 12; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].meters, weight: '' });
      for (let i = 0; i < 12; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].weight || '0.00', weight: '' });
      // Col 3 & 4
      for (let i = 12; i < 24; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].meters, weight: '' });
      for (let i = 12; i < 24; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].weight || '0.00', weight: '' });
      // Col 5 & 6
      for (let i = 24; i < 36; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].meters, weight: '' });
      for (let i = 24; i < 36; i++) expanded.push({ takaNo: takaIdx++, meters: takasList[i].weight || '0.00', weight: '' });

      setTakasList(expanded);
      setFormData((f) => ({
        ...f,
        'TAKA DETAILS': formatTakaDetailsString(expanded),
      }));
      setOcrToast({
        message: '🔀 Expanded into 72 individual column measurements!',
        type: 'info',
      });
    }
  };

  const hasAutoPaired = useRef<boolean>(false);

  // Auto-pair 72 items with empty weights into 36 items with distinct Meters & Weights on initial mount/extraction
  useEffect(() => {
    if (!hasAutoPaired.current && takasList.length === 72 && (!takasList[0]?.weight || parseFloat(takasList[0]?.weight || '0') === 0)) {
      hasAutoPaired.current = true;
      handleToggleMeterWeightSplit();
    }
  }, [takasList]);



  // Sync schema changes to JSON string
  const updateSchemaState = (newFields: SchemaFieldItem[]) => {
    setFieldsList(newFields);
    setJsonSchemaText(JSON.stringify(newFields, null, 2));
    setJsonError(null);
  };

  /** Robust helper to parse schema fields from any JSON format */
  const parseFieldsFromJson = (parsed: any): SchemaFieldItem[] => {
    const list: SchemaFieldItem[] = [];

    const processItem = (item: any) => {
      if (typeof item === 'string' && item.trim().length > 0) {
        const clean = item.trim().toUpperCase();
        if (clean.startsWith('[') || clean.startsWith('{') || clean.length > 80) return;
        list.push({
          id: null,
          title: clean,
          type: 'alphanumeric',
          required: false,
          placeholder: `ENTER ${clean}`,
          fieldOrder: list.length + 1,
          category: 'BUSINESS DOCUMENT',
        });
      } else if (item && typeof item === 'object') {
        const rawTitle = item.title || item.name || item.key || item.field || item.fieldName;
        if (rawTitle && typeof rawTitle === 'string') {
          const title = rawTitle.trim().toUpperCase();
          // Skip if title itself is a serialized JSON string or corrupted
          if (title.startsWith('[') || title.startsWith('{') || title.length > 80) return;

          list.push({
            id: item.id ?? null,
            title,
            type: item.type || 'alphanumeric',
            required: Boolean(item.required),
            placeholder: item.placeholder || `ENTER ${title}`,
            minLength: typeof item.minLength === 'number' ? item.minLength : undefined,
            maxLength: typeof item.maxLength === 'number' ? item.maxLength : undefined,
            fieldOrder: typeof item.fieldOrder === 'number' ? item.fieldOrder : list.length + 1,
            category: item.category || 'BUSINESS DOCUMENT',
          });
        }
      }
    };

    if (Array.isArray(parsed)) {
      parsed.forEach(processItem);
    } else if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.title || parsed.fieldName || parsed.key || parsed.name) {
        processItem(parsed);
      } else {
        let schemaObj = parsed;
        const keys = Object.keys(parsed);
        if (keys.length === 1 && parsed[keys[0]] && typeof parsed[keys[0]] === 'object' && !parsed.fields) {
          schemaObj = parsed[keys[0]];
        }

        const arr = schemaObj.fields || schemaObj.customSchema || schemaObj.schema || schemaObj.items;
        if (Array.isArray(arr)) {
          arr.forEach(processItem);
        } else if (Array.isArray(schemaObj.sections)) {
          schemaObj.sections.forEach((sec: any) => {
            if (Array.isArray(sec.fields)) {
              sec.fields.forEach(processItem);
            }
          });
        } else {
          for (const [k, v] of Object.entries(schemaObj)) {
            if (['document_id', 'document_name', 'category', 'status', 'success'].includes(k)) continue;
            processItem(typeof v === 'object' ? { title: k, ...v } : { title: k });
          }
        }
      }
    }

    return list;
  };

  /** Core method to import fields from JSON with merge or replace options */
  const handleImportJson = (parsed: any, mode: 'merge' | 'replace' = 'merge', customMessage?: string) => {
    const importedFields = parseFieldsFromJson(parsed);
    if (importedFields.length === 0) {
      alert('Could not detect any valid fields in the provided JSON.');
      return;
    }

    // Clean out any previously broken fields (e.g. titles starting with '[' or '{')
    const cleanExisting = fieldsList.filter(
      (f) => !f.title.trim().startsWith('[') && !f.title.trim().startsWith('{') && f.title.length < 80
    );

    let finalList: SchemaFieldItem[];

    if (mode === 'replace' || cleanExisting.length === 0) {
      finalList = importedFields;
    } else {
      finalList = [...cleanExisting];
      let added = 0;
      let updated = 0;

      for (const incoming of importedFields) {
        const idx = finalList.findIndex(
          (f) => f.title.trim().toUpperCase() === incoming.title.trim().toUpperCase()
        );
        if (idx >= 0) {
          finalList[idx] = {
            ...finalList[idx],
            ...incoming,
            fieldOrder: incoming.fieldOrder || finalList[idx].fieldOrder,
          };
          updated++;
        } else {
          finalList.push({
            ...incoming,
            fieldOrder: finalList.length + 1,
          });
          added++;
        }
      }
    }

    // Ensure TAKA DETAILS is included if missing
    if (!finalList.some((f) => f.title.trim().toUpperCase() === 'TAKA DETAILS')) {
      finalList.push({
        id: null,
        title: 'TAKA DETAILS',
        type: 'array',
        required: false,
        placeholder: 'ALL TAKA DETAILS (METERS)',
        fieldOrder: finalList.length + 1,
        category: 'BUSINESS DOCUMENT',
      });
    }

    updateSchemaState(finalList);
    const msg = customMessage || (
      mode === 'replace'
        ? `✅ Replaced schema with ${finalList.length} field(s)!`
        : `✅ Processed JSON: ${importedFields.length} field(s) applied!`
    );
    setOcrToast({ message: msg, type: 'success' });
  };

  // Load new parsed schema from JSON (default replaces schema)
  const loadSchema = (parsed: any, message = '✅ Schema updated successfully!') => {
    handleImportJson(parsed, 'replace', message);
  };

  // Handle document file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediately remove previous filled data and takas so user gets a clean, perfect idea
    setFormData({});
    setTakasList([]);
    setTakaSearch('');
    setOcrToast(null);

    setUploadedFileName(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const previewBlob = isPdf ? new Blob([file], { type: 'application/pdf' }) : file;
    const blobUrl = URL.createObjectURL(previewBlob);
    setPdfPreviewUrl(blobUrl);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedDocUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so re-uploading the same file triggers change event
    e.target.value = '';
  };

  // Apply JSON string pasted into modal
  const handleApplyPastedJson = (mode: 'merge' | 'replace' = 'replace') => {
    if (!pastedJsonInput.trim()) {
      alert('Please paste a JSON snippet.');
      return;
    }
    try {
      const parsed = JSON.parse(pastedJsonInput);
      handleImportJson(
        parsed,
        mode,
        mode === 'replace'
          ? '✅ Successfully replaced schema with pasted JSON!'
          : '✅ Successfully merged fields from pasted JSON!'
      );
      setShowPasteModal(false);
      setPastedJsonInput('');
    } catch (err) {
      alert('Invalid JSON syntax: ' + (err instanceof Error ? err.message : 'Check JSON syntax'));
    }
  };

  // Add field to schema interactively with automatic JSON detection
  const handleAddField = () => {
    const rawInput = newFieldTitle.trim();
    if (!rawInput) {
      alert('Please enter a Field Title or paste JSON.');
      return;
    }

    // Check if user pasted a JSON array or object
    if (rawInput.startsWith('{') || rawInput.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawInput);
        const imported = parseFieldsFromJson(parsed);
        if (imported.length > 0) {
          // If user pasted a full schema (11+ fields), replace or merge cleanly
          if (Array.isArray(parsed) && parsed.length >= DEFAULT_CHALLAN_SCHEMA.length) {
            handleImportJson(parsed, 'replace', `✅ Successfully loaded ${imported.length} fields from JSON!`);
          } else {
            handleImportJson(parsed, 'merge', `✅ Successfully added ${imported.length} field(s) from JSON!`);
          }
          setNewFieldTitle('');
          return;
        } else {
          alert('Could not find any valid field titles in the pasted JSON.');
          return;
        }
      } catch (err) {
        alert('Invalid JSON syntax: ' + (err instanceof Error ? err.message : 'Please check JSON syntax'));
        return;
      }
    }

    // Normal single field addition
    const title = rawInput.toUpperCase();
    if (title.startsWith('[') || title.startsWith('{') || title.length > 80) {
      alert('Invalid field title format.');
      return;
    }

    // Clean out any previously broken cards first
    const cleanExisting = fieldsList.filter(
      (f) => !f.title.trim().startsWith('[') && !f.title.trim().startsWith('{') && f.title.length < 80
    );

    if (cleanExisting.some((f) => f.title === title)) {
      alert(`Field "${title}" already exists.`);
      return;
    }

    const updated = [
      ...cleanExisting,
      {
        id: null,
        title,
        type: newFieldType,
        required: false,
        placeholder: `ENTER ${title}`,
        fieldOrder: cleanExisting.length + 1,
        category: 'BUSINESS DOCUMENT',
      },
    ];

    updateSchemaState(updated);
    setNewFieldTitle('');
    setOcrToast({ message: `➕ Added field "${title}" to Challan schema!`, type: 'success' });
  };

  // Remove field from schema
  const handleRemoveField = (fieldTitleToRemove: string) => {
    const updated = fieldsList.filter((f) => f.title !== fieldTitleToRemove);
    updateSchemaState(updated);
    setOcrToast({ message: `🗑️ Removed field "${fieldTitleToRemove}"`, type: 'info' });
  };

  // Run Dedicated Challan OCR Extraction
  const handleFetchChallanOcrData = async () => {
    setIsExtracting(true);
    setOcrToast({ message: '⏳ Running dedicated Challan OCR extraction...', type: 'info' });

    try {
      let finalUrl = uploadedDocUrl;
      if (finalUrl.startsWith('/') && !finalUrl.startsWith('data:')) {
        try {
          const res = await fetch(finalUrl);
          if (res.ok) {
            const blob = await res.blob();
            finalUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // Fallback to sending path
        }
      }

      const result = await extractChallanOcrData({
        fileUrl: finalUrl,
        customSchema: fieldsList,
        fileName: uploadedFileName,
      });

      if (result.success && result.fields) {
        if (result.takas && Array.isArray(result.takas)) {
          setTakasList(result.takas);
        }

        // Initialize fresh updated dictionary (never retain previous document data)
        const updated: Record<string, string> = {};
        let count = 0;

        for (const [extractedKey, val] of Object.entries(result.fields)) {
          if (!val) continue;

          const normKey = extractedKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Match exact title first
          let matchedField = fieldsList.find(
            (f) => f.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normKey
          );

          // Inclusion fallback
          if (!matchedField) {
            matchedField = fieldsList.find((f) => {
              const normTitle = f.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normTitle.includes(normKey) || normKey.includes(normTitle);
            });
          }

          if (matchedField) {
            const fieldTitle = matchedField.title;
            if (matchedField.type === 'date') {
              if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(val)) {
                const parts = val.split(/[\/\-\.]/);
                updated[fieldTitle] = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2}$/.test(val)) {
                const parts = val.split(/[\/\-\.]/);
                const yr = parseInt(parts[2], 10) > 50 ? `19${parts[2]}` : `20${parts[2]}`;
                updated[fieldTitle] = `${yr}-${parts[1]}-${parts[0]}`;
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

        if (result.takas && Array.isArray(result.takas) && result.takas.length > 0) {
          const sumM = result.takas.reduce((acc, t) => acc + (parseFloat(t.meters) || 0), 0);
          const sumW = result.takas.reduce((acc, t) => acc + (parseFloat(t.weight || '0') || 0), 0);
          updated['TAKA DETAILS'] = sumW > 0
            ? `${result.takas.length} Takas (${sumM.toFixed(2)} Mtr, ${formatWeightDisplay(sumW)} Kg)`
            : `${result.takas.length} Takas (${sumM.toFixed(2)} Mtr)`;
        }

        setFormData(updated);
        setOcrToast({
          message: `✅ Extracted ${count} challan fields & ${result.takas ? result.takas.length : 0} Takas in ${result.processingTimeMs}ms!`,
          type: 'success',
        });
      } else {
        setOcrToast({
          message: `❌ Extraction Failed: ${result.error || 'Unknown error'}`,
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

  // ─── AI OCR Handler (Gemini Vision) ────────────────────────────────────────
  const handleFetchChallanAiOcrData = async () => {
    setIsAiExtracting(true);
    setOcrToast({ message: '🤖 Running Gemini AI OCR extraction...', type: 'info' });

    try {
      let finalUrl = uploadedDocUrl;
      if (finalUrl.startsWith('/') && !finalUrl.startsWith('data:')) {
        try {
          const res = await fetch(finalUrl);
          if (res.ok) {
            const blob = await res.blob();
            finalUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch {
          // Fallback to sending path
        }
      }

      const result = await extractChallanAiOcrData({
        fileUrl: finalUrl,
        customSchema: fieldsList,
        fileName: uploadedFileName,
      });

      if (result.success && result.fields) {
        if (result.takas && Array.isArray(result.takas)) {
          setTakasList(result.takas);
        }

        const updated: Record<string, string> = {};
        let count = 0;

        for (const [extractedKey, val] of Object.entries(result.fields)) {
          if (!val) continue;

          const normKey = extractedKey.toLowerCase().replace(/[^a-z0-9]/g, '');

          let matchedField = fieldsList.find(
            (f) => f.title.toLowerCase().replace(/[^a-z0-9]/g, '') === normKey
          );

          if (!matchedField) {
            matchedField = fieldsList.find((f) => {
              const normTitle = f.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normTitle.includes(normKey) || normKey.includes(normTitle);
            });
          }

          if (matchedField) {
            const fieldTitle = matchedField.title;
            if (matchedField.type === 'date') {
              if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(val)) {
                const parts = val.split(/[\/\-\.]/);                updated[fieldTitle] = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2}$/.test(val)) {
                const parts = val.split(/[\/\-\.]/);                const yr = parseInt(parts[2], 10) > 50 ? `19${parts[2]}` : `20${parts[2]}`;
                updated[fieldTitle] = `${yr}-${parts[1]}-${parts[0]}`;
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

        if (result.takas && Array.isArray(result.takas) && result.takas.length > 0) {
          const sumM = result.takas.reduce((acc, t) => acc + (parseFloat(t.meters) || 0), 0);
          const sumW = result.takas.reduce((acc, t) => acc + (parseFloat(t.weight || '0') || 0), 0);
          updated['TAKA DETAILS'] = sumW > 0
            ? `${result.takas.length} Takas (${sumM.toFixed(2)} Mtr, ${formatWeightDisplay(sumW)} Kg)`
            : `${result.takas.length} Takas (${sumM.toFixed(2)} Mtr)`;
        }

        setFormData(updated);
        setOcrToast({
          message: `✅ AI Extracted ${count} challan fields & ${result.takas ? result.takas.length : 0} Takas in ${result.processingTimeMs}ms!`,
          type: 'success',
        });
      } else {
        setOcrToast({
          message: `❌ AI Extraction Failed: ${result.error || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (err) {
      setOcrToast({
        message: `❌ AI OCR Error: ${err instanceof Error ? err.message : 'AI extraction request failed'}`,
        type: 'error',
      });
    } finally {
      setIsAiExtracting(false);
    }
  };

  const isPdf = uploadedDocUrl.includes('application/pdf') || uploadedFileName.toLowerCase().endsWith('.pdf');

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0.5rem 1rem', color: '#f8fafc' }}>
      {/* Toast Notification */}
      {ocrToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '8px',
            background: ocrToast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : ocrToast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: '#fff',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span>{ocrToast.message}</span>
          <button
            onClick={() => setOcrToast(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧾 Delivery Challan OCR Verifier
            <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              Dedicated Endpoint: /api/ocr/challan
            </span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Pre-tuned high-precision OCR extraction for Delivery Challans, Takas &amp; Textile Invoices
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPasteModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #6366f1',
              color: '#818cf8',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            📋 Paste JSON
          </button>

          <button
            onClick={() => loadSchema(DEFAULT_CHALLAN_SCHEMA, '🔄 Reset to Default 14 Challan Fields')}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            🔄 Reset Schema
          </button>

          <button
            onClick={() => setShowJsonEditor(!showJsonEditor)}
            style={{
              padding: '0.5rem 1rem',
              background: showJsonEditor ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {showJsonEditor ? 'Hide Schema' : '⚙️ View / Edit Schema'}
          </button>
        </div>
      </div>

      {/* Optional Raw JSON Editor */}
      {showJsonEditor && (
        <div
          style={{
            background: '#090d16',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Schema JSON Editor ({fieldsList.length} fields)
            </span>
            <button
              onClick={() => {
                try {
                  const p = JSON.parse(jsonSchemaText);
                  loadSchema(p, '✅ Schema updated from editor!');
                } catch (e: any) {
                  setJsonError(e.message);
                }
              }}
              style={{
                padding: '0.3rem 0.8rem',
                background: '#38bdf8',
                color: '#0f172a',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Apply JSON Changes
            </button>
          </div>
          <textarea
            value={jsonSchemaText}
            onChange={(e) => {
              setJsonSchemaText(e.target.value);
              try {
                JSON.parse(e.target.value);
                setJsonError(null);
              } catch (err: any) {
                setJsonError(err.message);
              }
            }}
            style={{
              width: '100%',
              height: '180px',
              background: '#030712',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              padding: '0.75rem',
              borderRadius: '6px',
              border: jsonError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          {jsonError && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>⚠️ {jsonError}</div>}
        </div>
      )}

      {/* Main 2-Column Split: Document Preview & Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Column: Document Preview */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📄 Document Preview ({uploadedFileName})
            </span>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label
                style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                📁 Upload Bill
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button
                onClick={handleFetchChallanOcrData}
                disabled={isExtracting}
                style={{
                  padding: '0.4rem 1rem',
                  background: isExtracting ? '#475569' : '#38bdf8',
                  color: '#090d16',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isExtracting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isExtracting ? '⏳ Extracting...' : '🔍 EXTRACT WITH OCR'}
              </button>

              <button
                onClick={handleFetchChallanAiOcrData}
                disabled={isAiExtracting}
                style={{
                  padding: '0.4rem 1rem',
                  background: isAiExtracting
                    ? '#475569'
                    : 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isAiExtracting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isAiExtracting ? 'none' : '0 2px 10px rgba(168, 85, 247, 0.4)',
                }}
              >
                {isAiExtracting ? '⏳ AI Extracting...' : '🤖 AI OCR'}
              </button>
            </div>
          </div>


          <div
            style={{
              flex: 1,
              background: '#030712',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100vh - 280px)',
            }}
          >
            {isPdf ? (
              <iframe
                src={pdfPreviewUrl}
                title="Challan PDF Preview"
                style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 280px)', border: 'none' }}
              />
            ) : (
              <img
                src={uploadedDocUrl}
                alt="Challan Preview"
                style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 280px)', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>

        {/* Right Column: Challan Fields Form & Taka Breakdown */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Tabs: Fields Form vs Taka Piece Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveRightTab('fields')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: activeRightTab === 'fields' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: activeRightTab === 'fields' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: activeRightTab === 'fields' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📋 Challan Fields ({fieldsList.length})
              </button>

              <button
                onClick={() => setActiveRightTab('takas')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: activeRightTab === 'takas' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                  background: activeRightTab === 'takas' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: activeRightTab === 'takas' ? '#38bdf8' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🧵 Taka Breakdown ({takasList.length > 0 ? `${takasList.length} Takas • ${takaTotalMeters.toFixed(2)}m${takaTotalWeight > 0 ? ` • ${formatWeightDisplay(takaTotalWeight)}kg` : ''}` : '0 Takas'})
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                onClick={handleFetchChallanOcrData}
                disabled={isExtracting}
                style={{
                  padding: '0.45rem 0.95rem',
                  background: isExtracting ? '#475569' : '#38bdf8',
                  color: '#090d16',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isExtracting ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                {isExtracting ? '⏳ Extracting...' : '🔍 EXTRACT OCR'}
              </button>

              <button
                onClick={() => {
                  setFormData({});
                  setTakasList([]);
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {activeRightTab === 'fields' ? (
            <>
              {/* Interactive ➕ Add Field Strip */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#090d16',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="text"
                  placeholder="Field Title or Paste JSON (e.g. VEHICLE NUMBER or [{ ... }])"
                  value={newFieldTitle}
                  onChange={(e) => setNewFieldTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
                  onPaste={(e) => {
                    const pasteData = e.clipboardData.getData('text').trim();
                    if (pasteData.startsWith('[') || pasteData.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(pasteData);
                        const imported = parseFieldsFromJson(parsed);
                        if (imported.length > 0) {
                          e.preventDefault();
                          if (Array.isArray(parsed) && parsed.length >= DEFAULT_CHALLAN_SCHEMA.length) {
                            handleImportJson(parsed, 'replace', `✅ Auto-loaded ${imported.length} fields from pasted JSON!`);
                          } else {
                            handleImportJson(parsed, 'merge', `✅ Auto-added ${imported.length} field(s) from pasted JSON!`);
                          }
                          setNewFieldTitle('');
                        }
                      } catch {
                        // Not valid JSON, let regular text paste proceed
                      }
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    background: '#030712',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />

                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    background: '#030712',
                    color: '#38bdf8',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value="alphanumeric">Alphanumeric</option>
                  <option value="date">Date</option>
                  <option value="decimal">Decimal</option>
                  <option value="numeric">Numeric</option>
                  <option value="free_text">Free Text</option>
                </select>

                <button
                  onClick={handleAddField}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ➕ Add Field
                </button>
              </div>

              {/* Form Fields Grid */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem', maxHeight: 'calc(100vh - 280px)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {fieldsList
                    .filter((f) => !f.title.trim().startsWith('[') && !f.title.trim().startsWith('{') && f.title.length < 80)
                    .map((field, idx) => {
                    const val = formData[field.title] || '';
                    const isPopulated = Boolean(val);

                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(9, 13, 22, 0.8)',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: isPopulated ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              color: isPopulated ? '#34d399' : '#94a3b8',
                            }}
                          >
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
                              opacity: 0.6,
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        {field.title === 'TAKA DETAILS' ? (
                          <div
                            style={{
                              background: 'rgba(56, 189, 248, 0.06)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              borderRadius: '8px',
                              padding: '0.65rem 0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="ALL TAKA DETAILS (METERS)"
                                value={val}
                                onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                                style={{
                                  flex: 1,
                                  padding: '0.45rem 0.65rem',
                                  background: '#030712',
                                  color: isPopulated ? '#34d399' : '#f8fafc',
                                  fontWeight: isPopulated ? 600 : 400,
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '6px',
                                  outline: 'none',
                                  fontSize: '0.82rem',
                                }}
                              />
                              <button
                                onClick={() => setActiveRightTab('takas')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.45rem 0.75rem',
                                  background: '#38bdf8',
                                  color: '#090d16',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                🧵 View Takas ({takasList.length}) →
                              </button>
                            </div>
                            {takasList.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                                <span>📦 <strong>{takasList.length}</strong> Pieces</span>
                                <span>📏 Total: <strong style={{ color: '#34d399' }}>{takaTotalMeters.toFixed(2)} Mtr</strong></span>
                                {takaTotalWeight > 0 && <span>⚖️ Wt: <strong style={{ color: '#f59e0b' }}>{formatWeightDisplay(takaTotalWeight)} Kg</strong></span>}
                                <span style={{ color: '#38bdf8' }}>
                                  Preview: {takasList.slice(0, 4).map((t) => `#${t.takaNo}:${t.meters}m${t.weight ? `/${t.weight}kg` : ''}`).join(' | ')}...
                                </span>
                              </div>
                            )}
                          </div>
                        ) : field.type === 'date' ? (
                          <input
                            type="date"
                            value={val}
                            onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: '#030712',
                              color: '#f8fafc',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              outline: 'none',
                              fontSize: '0.82rem',
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={field.placeholder || `ENTER ${field.title}`}
                            value={val}
                            onChange={(e) => setFormData({ ...formData, [field.title]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              background: '#030712',
                              color: isPopulated ? '#34d399' : '#f8fafc',
                              fontWeight: isPopulated ? 600 : 400,
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: '6px',
                              outline: 'none',
                              fontSize: '0.82rem',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Direct In-Column Taka Piece Breakdown */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
              {/* Summary Stats Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#090d16',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>
                    📦 {takasList.length} Pcs
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                    📏 {takaTotalMeters.toFixed(2)} Mtr
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>
                    ⚖️ {takaTotalWeight > 0 ? `${formatWeightDisplay(takaTotalWeight)} Kg` : '0 Kg'}
                  </span>
                  {formData['TOTAL METER'] && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(234, 179, 8, 0.2)',
                        color:
                          Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                            ? '#34d399'
                            : '#fde047',
                        fontWeight: 700,
                      }}
                    >
                      {Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                        ? `✅ Mtr Ok`
                        : `⚠️ Mtr diff: ${(takaTotalMeters - parseFloat(formData['TOTAL METER'])).toFixed(2)}m`}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleAddTaka}
                    style={{
                      padding: '0.28rem 0.55rem',
                      fontSize: '0.74rem',
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      color: '#38bdf8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    ➕ Add
                  </button>
                  <button
                    onClick={handleSyncTakaToTotal}
                    disabled={takasList.length === 0}
                    title="Sync Taka meters sum to TOTAL METER field"
                    style={{
                      padding: '0.28rem 0.55rem',
                      fontSize: '0.74rem',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10b981',
                      color: '#34d399',
                      borderRadius: '4px',
                      cursor: takasList.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    🔄 Sync Mtr
                  </button>
                  <button
                    onClick={handleCopyTakasList}
                    disabled={takasList.length === 0}
                    style={{
                      padding: '0.28rem 0.55rem',
                      fontSize: '0.74rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e2e8f0',
                      borderRadius: '4px',
                      cursor: takasList.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    📋 Copy
                  </button>
                  {(takasList.length === 72 || takasList.length === 36) && (
                    <button
                      onClick={handleToggleMeterWeightSplit}
                      title={takasList.length === 72 ? 'Pair 6 columns into 36 Takas (Meter + Weight)' : 'Expand to 72 individual measurements'}
                      style={{
                        padding: '0.28rem 0.55rem',
                        fontSize: '0.74rem',
                        background: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid #a855f7',
                        color: '#c084fc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {takasList.length === 72 ? '🔀 Pair M&W (36)' : '🔀 All 72 Mtr'}
                    </button>
                  )}
                </div>
              </div>

              {/* Search Filter */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search Taka #, Meters or Weight..."
                  value={takaSearch}
                  onChange={(e) => setTakaSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.75rem',
                    background: '#030712',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                {takaSearch && (
                  <button
                    onClick={() => setTakaSearch('')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Taka Pieces Grid */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 350px)', paddingRight: '4px' }}>
                {takasList.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem 1rem',
                      textAlign: 'center',
                      background: '#090d16',
                      borderRadius: '8px',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      color: '#94a3b8',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧵</div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                      No Taka Details Extracted Yet
                    </div>
                    <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                      Click <strong>&quot;🔍 EXTRACT OCR&quot;</strong> above to dynamically extract all piece meters & weights from this bill.
                    </div>
                    <button
                      onClick={handleFetchChallanOcrData}
                      disabled={isExtracting}
                      style={{
                        padding: '0.45rem 1.2rem',
                        background: '#38bdf8',
                        color: '#090d16',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: isExtracting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isExtracting ? '⏳ Extracting...' : '🔍 Extract Takas with OCR'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.55rem' }}>
                    {takasList
                      .filter((taka) => {
                        if (!takaSearch.trim()) return true;
                        const q = takaSearch.trim().toLowerCase().replace('#', '');
                        return (
                          taka.takaNo.toString().includes(q) ||
                          taka.meters.toLowerCase().includes(q) ||
                          (taka.weight && taka.weight.toLowerCase().includes(q))
                        );
                      })
                      .map((taka) => (
                        <div
                          key={taka.takaNo}
                          style={{
                            background: 'rgba(3, 7, 18, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '0.5rem 0.65rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            transition: 'border-color 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                minWidth: '28px',
                                textAlign: 'center',
                              }}
                            >
                              #{taka.takaNo}
                            </span>
                            <button
                              onClick={() => handleRemoveTaka(taka.takaNo)}
                              title={`Delete Taka #${taka.takaNo}`}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                opacity: 0.7,
                                padding: '2px',
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Separated Meter & Weight inputs */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                            {/* 📏 Meter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 700 }}>📏 Meter</span>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={taka.meters}
                                  onChange={(e) => handleUpdateTakaMeters(taka.takaNo, e.target.value)}
                                  placeholder="0.00"
                                  style={{
                                    width: '100%',
                                    padding: '0.2rem 1.1rem 0.2rem 0.35rem',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    outline: 'none',
                                  }}
                                />
                                <span style={{ position: 'absolute', right: '4px', fontSize: '0.62rem', color: '#34d399', fontWeight: 700, pointerEvents: 'none' }}>
                                  m
                                </span>
                              </div>
                            </div>

                            {/* ⚖️ Weight */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700 }}>
                                ⚖️ Weight
                              </span>
                              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={taka.weight || ''}
                                  onChange={(e) => handleUpdateTakaWeight(taka.takaNo, e.target.value)}
                                  placeholder="0"
                                  style={{
                                    width: '100%',
                                    padding: '0.2rem 1.25rem 0.2rem 0.35rem',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    textAlign: 'right',
                                    outline: 'none',
                                  }}
                                />
                                <span style={{ position: 'absolute', right: '4px', fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700, pointerEvents: 'none' }}>
                                  {parseFloat(taka.weight || '0') >= 500 ? 'g' : 'kg'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🧵 Dedicated Taka Details Breakdown (Meters & Weight) Panel */}
      <div
        id="taka-breakdown-section"
        style={{
          marginTop: '1.5rem',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '0.75rem',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🧵 Taka Details Breakdown (Meters & Weight)
              <span
                style={{
                  fontSize: '0.75rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                Dynamic per Challan Screenshot
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Individual piece meter and weight measurements extracted dynamically from the challan roll table
            </p>
          </div>

          {/* Stats Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '0.35rem 0.75rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#60a5fa',
                fontWeight: 700,
              }}
            >
              📦 Total Pieces: {takasList.length}
            </div>

            <div
              style={{
                padding: '0.35rem 0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#34d399',
                fontWeight: 700,
              }}
            >
              📏 Total Meter: {takaTotalMeters.toFixed(2)} Mtr
            </div>

            <div
              style={{
                padding: '0.35rem 0.75rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#fbbf24',
                fontWeight: 700,
              }}
            >
              ⚖️ Total Weight: {takaTotalWeight > 0 ? `${formatWeightDisplay(takaTotalWeight)} Kg` : '0 Kg'}
            </div>

            {formData['TOTAL METER'] && (
              <div
                style={{
                  padding: '0.35rem 0.75rem',
                  background:
                    Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(234, 179, 8, 0.2)',
                  border:
                    Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                      ? '1px solid #10b981'
                      : '1px solid #eab308',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color:
                    Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05
                      ? '#34d399'
                      : '#fde047',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {Math.abs(takaTotalMeters - parseFloat(formData['TOTAL METER'])) < 0.05 ? (
                  <>✅ Matches TOTAL METER ({formData['TOTAL METER']})</>
                ) : (
                  <>⚠️ METER diff: {(takaTotalMeters - parseFloat(formData['TOTAL METER'])).toFixed(2)} Mtr</>
                )}
              </div>
            )}


          </div>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {/* Search Filter & View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px', maxWidth: '520px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <input
                type="text"
                placeholder="🔍 Search Taka #, Meters or Weight..."
                value={takaSearch}
                onChange={(e) => setTakaSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.75rem',
                  background: '#030712',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              {takaSearch && (
                <button
                  onClick={() => setTakaSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Table */}
            <div style={{ display: 'flex', background: '#030712', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '2px' }}>
              <button
                onClick={() => setTakaViewMode('grid')}
                title="Card Grid View"
                style={{
                  padding: '0.3rem 0.6rem',
                  background: takaViewMode === 'grid' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: takaViewMode === 'grid' ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🗂️ Cards
              </button>
              <button
                onClick={() => setTakaViewMode('table')}
                title="Spreadsheet Table View"
                style={{
                  padding: '0.3rem 0.6rem',
                  background: takaViewMode === 'table' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  color: takaViewMode === 'table' ? '#38bdf8' : '#94a3b8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📑 Table
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAddTaka}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ➕ Add Taka
            </button>

            <button
              onClick={handleSyncTakaToTotal}
              disabled={takasList.length === 0}
              title="Sync sum of meters to TOTAL METER field"
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                borderRadius: '6px',
                cursor: takasList.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              🔄 Sync Total Meter
            </button>

            <button
              onClick={handleCopyTakasList}
              disabled={takasList.length === 0}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                borderRadius: '6px',
                cursor: takasList.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              📋 Copy Takas
            </button>

            {(takasList.length === 72 || takasList.length === 36) && (
              <button
                onClick={handleToggleMeterWeightSplit}
                title={takasList.length === 72 ? 'Pair 6 columns into 36 Takas (Meter + Weight)' : 'Expand to 72 individual measurements'}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid #a855f7',
                  color: '#c084fc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {takasList.length === 72 ? '🔀 Pair M&W (36 Takas)' : '🔀 Show All 72 Mtr'}
              </button>
            )}

            <button
              onClick={() => {
                setTakasList([]);
                setFormData((prev) => ({ ...prev, 'TAKA DETAILS': '' }));
              }}
              disabled={takasList.length === 0}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '6px',
                cursor: takasList.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Taka Pieces Rendering: Card Grid or Table */}
        {takasList.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              background: '#090d16',
              borderRadius: '8px',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧵</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
              No Taka Details Extracted Yet
            </div>
            <div style={{ fontSize: '0.8rem', maxWidth: '460px', margin: '0 auto 1rem' }}>
              Click <strong>&quot;🔍 EXTRACT WITH OCR&quot;</strong> above to dynamically extract individual meter and weight measurements from this challan, or use <strong>&quot;➕ Add Taka&quot;</strong> to add manually.
            </div>
            <button
              onClick={handleFetchChallanOcrData}
              disabled={isExtracting}
              style={{
                padding: '0.45rem 1.2rem',
                background: '#38bdf8',
                color: '#090d16',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: isExtracting ? 'not-allowed' : 'pointer',
              }}
            >
              {isExtracting ? '⏳ Extracting...' : '🔍 Extract Takas with OCR'}
            </button>
          </div>
        ) : takaViewMode === 'table' ? (
          /* Spreadsheet-Style Table View with Separated Columns */
          <div
            style={{
              maxHeight: '450px',
              overflowY: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(3, 7, 18, 0.9)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', width: '80px', color: '#38bdf8', fontWeight: 800 }}>Taka #</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: '#34d399', fontWeight: 700 }}>📏 Meter (m)</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: '#f59e0b', fontWeight: 700 }}>⚖️ Weight</th>
                  <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', width: '80px', color: '#94a3b8' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {takasList
                  .filter((taka) => {
                    if (!takaSearch.trim()) return true;
                    const q = takaSearch.trim().toLowerCase().replace('#', '');
                    return (
                      taka.takaNo.toString().includes(q) ||
                      taka.meters.toLowerCase().includes(q) ||
                      (taka.weight && taka.weight.toLowerCase().includes(q))
                    );
                  })
                  .map((taka, idx) => (
                    <tr
                      key={taka.takaNo}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.45rem 0.8rem', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          #{taka.takaNo}
                        </span>
                      </td>
                      <td style={{ padding: '0.45rem 0.8rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={taka.meters}
                            onChange={(e) => handleUpdateTakaMeters(taka.takaNo, e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '90px',
                              padding: '0.25rem 0.45rem',
                              background: '#090d16',
                              color: '#f8fafc',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              textAlign: 'right',
                              outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>m</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.45rem 0.8rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={taka.weight || ''}
                            onChange={(e) => handleUpdateTakaWeight(taka.takaNo, e.target.value)}
                            placeholder="0"
                            style={{
                              width: '90px',
                              padding: '0.25rem 0.45rem',
                              background: '#090d16',
                              color: '#f8fafc',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              textAlign: 'right',
                              outline: 'none',
                            }}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                            {parseFloat(taka.weight || '0') >= 500 ? 'g' : 'kg'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.45rem 0.8rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveTaka(taka.takaNo)}
                          title={`Delete Taka #${taka.takaNo}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            opacity: 0.7,
                            padding: '2px 5px',
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderTop: '2px solid rgba(255, 255, 255, 0.2)', fontWeight: 800 }}>
                  <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', color: '#38bdf8' }}>
                    Total ({takasList.length})
                  </td>
                  <td style={{ padding: '0.65rem 0.8rem', color: '#34d399' }}>
                    📏 {takaTotalMeters.toFixed(2)} Mtr
                  </td>
                  <td style={{ padding: '0.65rem 0.8rem', color: '#f59e0b' }}>
                    ⚖️ {formatWeightDisplay(takaTotalWeight)} Kg
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* Card Grid View with Separated Inputs */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(205px, 1fr))',
              gap: '0.65rem',
              maxHeight: '450px',
              overflowY: 'auto',
              padding: '0.5rem 0.25rem',
            }}
          >
            {takasList
              .filter((taka) => {
                if (!takaSearch.trim()) return true;
                const q = takaSearch.trim().toLowerCase().replace('#', '');
                return (
                  taka.takaNo.toString().includes(q) ||
                  taka.meters.toLowerCase().includes(q) ||
                  (taka.weight && taka.weight.toLowerCase().includes(q))
                );
              })
              .map((taka) => (
                <div
                  key={taka.takaNo}
                  style={{
                    background: 'rgba(3, 7, 18, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.55rem 0.7rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        minWidth: '28px',
                        textAlign: 'center',
                      }}
                    >
                      #{taka.takaNo}
                    </span>

                    <button
                      onClick={() => handleRemoveTaka(taka.takaNo)}
                      title={`Delete Taka #${taka.takaNo}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        opacity: 0.7,
                        padding: '2px 4px',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Separated Meter & Weight inputs in Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                    {/* 📏 Meter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.64rem', color: '#34d399', fontWeight: 700 }}>📏 Meter</span>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={taka.meters}
                          onChange={(e) => handleUpdateTakaMeters(taka.takaNo, e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '0.22rem 1.15rem 0.22rem 0.35rem',
                            background: '#0f172a',
                            color: '#f8fafc',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textAlign: 'right',
                            outline: 'none',
                          }}
                        />
                        <span style={{ position: 'absolute', right: '4px', fontSize: '0.62rem', color: '#34d399', fontWeight: 700, pointerEvents: 'none' }}>
                          m
                        </span>
                      </div>
                    </div>

                    {/* ⚖️ Weight */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.64rem', color: '#f59e0b', fontWeight: 700 }}>
                        ⚖️ Weight
                      </span>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={taka.weight || ''}
                          onChange={(e) => handleUpdateTakaWeight(taka.takaNo, e.target.value)}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.22rem 1.3rem 0.22rem 0.35rem',
                            background: '#0f172a',
                            color: '#f8fafc',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            textAlign: 'right',
                            outline: 'none',
                          }}
                        />
                        <span style={{ position: 'absolute', right: '4px', fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700, pointerEvents: 'none' }}>
                          {parseFloat(taka.weight || '0') >= 500 ? 'g' : 'kg'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Paste JSON Modal */}
      {showPasteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #38bdf8',
              borderRadius: '12px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '650px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem', fontWeight: 800 }}>
                📋 Paste JSON Schema
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              Paste any custom JSON fields array or object. You can either merge them with existing fields or replace the entire schema.
            </p>

            <textarea
              value={pastedJsonInput}
              onChange={(e) => setPastedJsonInput(e.target.value)}
              placeholder="Paste JSON array or schema here..."
              style={{
                width: '100%',
                height: '240px',
                background: '#030712',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '1rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setShowPasteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => handleApplyPastedJson('merge')}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                ➕ Merge / Add Fields
              </button>

              <button
                onClick={() => handleApplyPastedJson('replace')}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                🔄 Replace Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
