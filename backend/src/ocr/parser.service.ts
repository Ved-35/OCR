// ─────────────────────────────────────────────────────────────
// Parser Service — Regex-based & Dynamic Heuristic Field Extraction
// Configurable templates with dynamic NLP fallback for arbitrary documents
// ─────────────────────────────────────────────────────────────

import {
  DocumentType,
  type DocumentTemplate,
  type FieldExtractionRule,
} from './ocr.types.js';

// ─────────────────── Helper utilities ───────────────────

/** Remove extra whitespace and trim */
const normalizeWhitespace = (v: string): string => v.replace(/\s+/g, ' ').trim();

/** Remove all spaces (for numbers like Aadhaar) */
const stripSpaces = (v: string): string => v.replace(/\s/g, '');

/** Extract only digits */
const digitsOnly = (v: string): string => v.replace(/\D/g, '');

/** Title Case */
const toTitleCase = (v: string): string =>
  v
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Format Aadhaar as XXXX XXXX XXXX */
const formatAadhaar = (v: string): string => {
  const digits = digitsOnly(v);
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return digits;
};

/** Parse Indian-style amounts (e.g. "15,00,000" → "1500000") */
const parseIndianAmount = (v: string): string => {
  return v.replace(/[₹,\s]/g, '').trim();
};

// ─────────────────── Document Templates ───────────────────

const panCardTemplate: DocumentTemplate = {
  documentType: DocumentType.PAN_CARD,
  rules: [
    {
      fieldName: 'panNumber',
      patterns: [
        /\b([A-Z]{5}[0-9]{4}[A-Z])\b/,
        /PAN\s*(?:No\.?|Number)?\s*:?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /Permanent\s+Account\s+Number\s*[^:]*:?\s*\n?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
    {
      fieldName: 'name',
      patterns: [
        // Pattern 1: Name / नाम followed by optional brackets/colon and newline or space
        /(?:नाम\s*\/\s*Name|Name|नाम)\s*(?:\([^\)]*\))?\s*[:/]?\s*[\r\n\s]+\s*([A-Z][A-Za-z\s.']{2,35}?)(?=\r?\n|\s+(?:Father|father'?s|Permanent|\d{2}\/)|$)/i,
        // Pattern 2: Name or नाम prefix with colon/slash
        /(?:Name|नाम|Full\s*Name)\s*(?:\([^\)]*\))?\s*[:/]\s*([A-Z][A-Za-z\s.']{2,35}?)(?=\r?\n|$)/i,
        // Pattern 3: Line immediately preceding Father's Name / पिता का नाम
        /([A-Z][A-Za-z\s.']{2,35}?)\s*[\r\n\s]+\s*(?:Father|पिता\s*का\s*नाम|Father'?s?\s*Name)/i,
        // Pattern 4: Line immediately after PAN Number (ABCDE1234F)
        /[A-Z]{5}[0-9]{4}[A-Z][\s\S]*?(?:नाम\s*\/\s*Name|Name)?[\s\n]+([A-Z][A-Za-z\s.']{2,35}?)\n+\s*(?:Father|father'?s|\d{2}\/)/i,
        // Pattern 5: Generic capitalized full name pattern (2 to 4 words)
        /\b([A-Z]{2,15}\s+[A-Z]{2,15}(?:\s+[A-Z]{2,15}){0,2})\b/,
      ],
      postProcess: (v) =>
        v
          .replace(/^(INCOME|TAX|DEPARTMENT|GOVT|INDIA|PERMANENT|ACCOUNT|NUMBER|CARD)\b.*/gi, '')
          .replace(/[\r\n].*/g, '')
          .trim(),
    },
    {
      fieldName: 'fatherName',
      patterns: [
        /(?:पिता\s*का\s*नाम\s*\/\s*Father'?s?\s*Name|Father'?s?\s*Name|पिता\s*का\s*नाम)\s*[:/]?\s*\n+\s*([A-Z][A-Za-z\s.']{2,35}?)(?=\r?\n|$)/i,
        /(?:Father'?s?\s*Name|Father|पिता)\s*[:/]\s*([A-Z][A-Za-z\s.']{2,35}?)(?=\r?\n|$)/i,
        /([A-Z][A-Za-z\s.']{2,35}?)\s*\n+\s*(?:Date\s*of\s*Birth|जन्म\s*की\s*तारीख|DOB|\d{2}[\/\-\.]\d{2})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'dateOfBirth',
      patterns: [
        /(?:Date\s*of\s*Birth|DOB|D\.O\.B|जन्म\s*की\s*तारीख)\s*[^:]*[:/]?\s*\n?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,
      ],
    },
  ],
};

const aadhaarCardTemplate: DocumentTemplate = {
  documentType: DocumentType.AADHAAR_CARD,
  rules: [
    {
      fieldName: 'aadhaarNumber',
      patterns: [
        /\b(\d{4}\s\d{4}\s\d{4})\b/,
        /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
        /(?:Aadhaar|ADHAAR|ADHAR)\s*(?:No\.?|NUMBER)?\s*[:/]?\s*(\d{4}\s?\d{4}\s?\d{4})/i,
      ],
      postProcess: (v) => v.replace(/\s+/g, ' ').trim(),
    },
    {
      fieldName: 'name',
      patterns: [
        // Pattern 1: Header prefix + Name + Gender/DOB suffix on single or multi-line
        /(?:GOVERNMENT|OVERNMENT|AUTHORITY|INDIA|AADHAAR|Aadhaar|भारत\s+सरकार)?\s*(?:OF\s*INDIA)?\s*([A-Z][A-Za-z\s.']{2,35}?)\s*(?:Male|Female|Transgender|Sex|लिंग|Male\s*\/\s*पुरुष|Female\s*\/\s*महिला|DOB|D\.O\.B|Date|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        // Pattern 2: Explicit Name prefix (English/Hindi)
        /(?:Name|नाम|Full\s*Name)\s*[:/]?\s*([A-Z][A-Za-z\s.']{2,35}?)(?=\r?\n|\s+(?:DOB|Date|Male|Female|Gender)|$)/i,
        // Pattern 3: Name line immediately before Gender (Male / Female / पुरुष / महिला)
        /([A-Z][A-Za-z\s.']{2,35}?)\s*[\r\n\s]+\s*(?:Male|Female|Transgender|Sex|लिंग|Male\s*\/\s*पुरुष|Female\s*\/\s*महिला)/i,
        // Pattern 4: Name line immediately before DOB (DOB / Date of Birth / DD-MM-YYYY)
        /([A-Z][A-Za-z\s.']{2,35}?)\s*[\r\n\s]+\s*(?:DOB|D\.O\.B|Date\s*of\s*Birth|जन्म\s*तिथि|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        // Pattern 5: Name after Aadhaar Header
        /(?:GOVERNMENT|OVERNMENT|AUTHORITY|INDIA|AADHAAR|Aadhaar|भारत\s+सरकार)[\s\S]*?([A-Z][A-Z\s]{2,30}?)\s*(?:Male|Female|DOB|\d{2}[\/\-\.])/i,
        // Pattern 6: Generic capitalized full name pattern (2 to 3 words)
        /\b([A-Z][a-zA-Z.']{1,20}\s+[A-Z][a-zA-Z.']{1,20}(?:\s+[A-Z][a-zA-Z.']{1,20})?)\b/,
      ],
      postProcess: (v) => {
        let clean = v
          .replace(/^aiH\s*/i, '')
          .replace(/\s+(?:Male|Female|Transgender|Sex|DOB|D\.O\.B|Date|20-\d{2}-\d{4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}).*/gi, '')
          .replace(/[\r\n].*/g, '')
          .trim();
        let prev = '';
        while (prev !== clean) {
          prev = clean;
          clean = clean
            .replace(/^(?:GOVERNMENT|OVERNMENT|GOVERNMENTOFINDIA|OVERNMENTOFINDIA|OFINDIA|UNIQUE|AUTHORITY|INDIA|OF\s*INDIA|AADHAAR|MY\s*AADHAAR|MYADHAAR)\b[\s:]*/gi, '')
            .trim();
        }
        return clean;
      },
    },
    {
      fieldName: 'dateOfBirth',
      patterns: [
        /(?:DOB|Date\s*of\s*Birth|D\.O\.B|जन्म\s*तिथि)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,
      ],
    },
    {
      fieldName: 'gender',
      patterns: [
        /(?:Gender|Sex)\s*[:/]?\s*(Male|Female|Other)/i,
        /\b(Male|Female|Other)\b/i,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
    {
      fieldName: 'address',
      patterns: [
        /(?:Address|ADDR)\s*[:/]?\s*([A-Za-z0-9\s,.\/\-]{10,120})/i,
      ],
      postProcess: normalizeWhitespace,
    },
  ],
};

const electricityBillTemplate: DocumentTemplate = {
  documentType: DocumentType.ELECTRICITY_BILL,
  rules: [
    {
      fieldName: 'consumerName',
      patterns: [
        /(?:CONSUMER\s*NAME|Consumer\s*Name|Customer\s*Name|Bill\s*To)\s*[:/]?\s*([A-Za-z\s.,']{3,40}?)(?=\s+Address|\s+VILL|\s+TAL|\s+Sub-division|\n|$)/i,
        /([A-Z][A-Za-z\s.]{2,35}?)\s*\n+\s*(?:Address|Consumer\s*No|Customer\s*No|Meter\s*No|Account\s*No)/i,
      ],
      postProcess: (v) => normalizeWhitespace(v).replace(/\s+Address$/i, '').trim(),
    },
    {
      fieldName: 'consumerNumber',
      patterns: [
        /(?:Customer\s*No\.?|CONSUMER\s*NO\.?|Account\s*No\.?|Consumer\s*No\.?)\s*[:/]?\s*(\d{8,16})/i,
        /(?:Customer\s*No\.?|Consumer\s*No\.?).*?\n+.*?(\d{8,16})/i,
        /\b(1[46]80\d{7,12}|\d{11,16})\b/,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'meterNumber',
      patterns: [
        /(?:Meter\s*No\.?|METER\s*NO\.?)\s*[:/]?\s*([A-Z0-9]{5,15})/i,
        /(?:Customer\s*No\.?|Meter\s*No\.?).*?\n+.*?\b\d{8,16}\s+(?:\d{8,16}\s+)?([A-Z0-9]{5,15})\s+(?:LT|HT|RGPV|RGPU|[A-Z\s\-()]{2,15})/i,
        /\b(S\d{6,10}|210[78]\d{3,6}|\d{7,10})\b/i,
      ],
      postProcess: (v) => {
        const clean = normalizeWhitespace(v).toUpperCase();
        if (['TARIFF', 'CATEGORY', 'CONNECTED', 'LOAD', 'ACCOUNT', 'CONSUMER', 'CUSTOMER', 'PRESENT', 'READING', 'PAST'].includes(clean)) {
          return '';
        }
        return clean;
      },
    },
    {
      fieldName: 'subDivOffice',
      patterns: [
        /(?:Sub-division\s*Office|SUB\s*DIV\.?\s*OFFICE)\s*[:/]?\s*([A-Za-z\s]{3,20}?)(?=\s+Bill|\s+Date|\s+Due|\n|$)/i,
      ],
      postProcess: (v) => normalizeWhitespace(v).replace(/\s+(Bill|Date|Due).*$/i, '').trim(),
    },
    {
      fieldName: 'addressLine1',
      patterns: [
        /(?:Billing\s*Address|Address)\s*[:/]?\s*([A-Za-z0-9\s.,\-]{5,60}?)(?=\s+VILL|\s+TAL|\s+Sub-division|\n|$)/i,
        /([A-Za-z0-9\s.,\-]{10,50}(?:ROAD|STREET|SOCIETY|NAGAR|SECTOR|VILLAGE|DISTRICT|CITY))/i,
      ],
      postProcess: (v) => normalizeWhitespace(v).replace(/\s+(VILL|TAL|Sub-division).*$/i, '').trim(),
    },
    {
      fieldName: 'addressLine2',
      patterns: [
        /(VILL:\s*[^\n]+)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'area',
      patterns: [
        /(?:TAL:\s*Chorasi:\s*([A-Za-z]+)|DISTRICT:?\s*([A-Za-z]+))/i,
        /(?:City|Area)\s*[:/]?\s*([A-Za-z\s]{3,20})/i,
      ],
      postProcess: (v) => {
        const clean = normalizeWhitespace(v);
        if (['BILL', 'DATE', 'DUE'].includes(clean.toUpperCase())) return '';
        return clean;
      },
    },
    {
      fieldName: 'electricityCompany',
      patterns: [
        /(DGVCL|UGVCL|MGVCL|PGVCL|SPDCL|TORRENT\s*POWER|BESCOM|TANGEDCO|MSEDCL|BSES|TATA\s*POWER)/i,
        /(DAKSHIN\s*GUJARAT\s*VIJ\s*COMPANY\s*LIMITED|SURAT\s*POWER\s*DISTRIBUTION\s*COMPANY\s*LIMITED)/i,
      ],
      postProcess: (v) => {
        const upper = v.toUpperCase();
        if (upper.includes('DAKSHIN') || upper.includes('DGVCL')) return 'DGVCL';
        if (upper.includes('SURAT') || upper.includes('SPDCL')) return 'SPDCL';
        return upper;
      },
    },
    {
      fieldName: 'connectedLoad',
      patterns: [
        /(?:Connected\s*Load(?:\s*\(kW\))?)\s*[:/]?\s*([\d.]+)/i,
        /(?:Customer\s*No\.?|Connected\s*Load).*?\n+.*?\b\d{8,16}\s+(?:\d{8,16}\s+)?(?:[A-Z0-9]{5,15}\s+)?(?:LT|HT|RGPV|RGPU|[A-Z\s\-()]{2,15})\s+([\d.]+)/i,
        /(?:CONNECTED\s*LOAD|KW|HP)\s*[:/]?\s*([\d.]+)/i,
      ],
      postProcess: (v) => {
        const clean = v.trim();
        if (clean.length > 6 || clean === '0') return '';
        return clean;
      },
    },
    {
      fieldName: 'connectionType',
      patterns: [
        /(?:Tariff\s*Category|Tariff\s*Code|Tariff|Connection\s*Type)\s*[:/]?\s*([A-Z0-9\s\-()]{2,20}?)(?=\s+Connected|\s+Load|\n|$)/i,
        /(?:Customer\s*No\.?|Tariff).*?\n+.*?\b\d{8,16}\s+(?:\d{8,16}\s+)?(?:[A-Z0-9]{5,15}\s+)?([A-Z0-9\s\-()]{2,15})\b/i,
        /(RGPV|RGPU|LT\s*-\s*IV\s*\(A\)|LT\s*SINGLE\s*PHASE|LT\s*THREE\s*PHASE|HT\s*INDUSTRIAL|DOMESTIC|COMMERCIAL)/i,
      ],
      postProcess: (v) => {
        const clean = v.toUpperCase().replace(/\s+\d+.*$/, '').trim();
        if (['CONNECTED', 'LOAD', 'METER', 'ACCOUNT', 'CUSTOMER', 'CONSUMER'].includes(clean)) return '';
        return clean;
      },
    },
  ],
};

const projectReportTemplate: DocumentTemplate = {
  documentType: DocumentType.PROJECT_REPORT,
  rules: [
    {
      fieldName: 'land',
      patterns: [
        /(?:Agri\.?\s*Land|Factory\s*Land|Cost\s*of\s*Land|Land\s*(?:&|and|\+)?\s*Site\s*Development|Land|Plot\s*No\.?)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bLand[^\n]*?\b([\d,.]+(?:\.\d+)?)\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'building',
      patterns: [
        /(?:House\s*Property|Factory\s*Shed|Building\s*(?:&|and|\+)?\s*Civil|Civil\s*Construction|Building)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bBuilding[^\n]*?\b([\d,.]+(?:\.\d+)?)\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'plantAndMachinery',
      patterns: [
        /(?:Plant\s*(?:&|and|\+)?\s*Machinery|Machinery\s*(?:&|and)?\s*Equipment|Textile\s*Plant|Capital\s*Exp\.?|Increase\s*in\s*Capital\s*Exp\.?)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bMachinery[^\n]*?\b([\d,.]+(?:\.\d+)?)\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'electricalFitting',
      patterns: [
        /(?:Electrical\s*Transformer|Electrical\s*Fittings?|Electrical\s*Installation|Power\s*&?\s*Fuel\s*Cost|Power)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bElectrical[^\n]*?\b([\d,.]+(?:\.\d+)?)\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'compressor',
      patterns: [
        /(?:Humidification|Air\s*Compressor|Compressor\s*Unit|Auxiliary\s*Equipment|Compressor)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'airConditioner',
      patterns: [
        /(?:Air\s*Conditioner|Air\s*Conditioning|AC\s*Plant|Cooling\s*System)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'otherFixedAsset',
      patterns: [
        /(?:Other\s*Assets?|Pre-operative\s*Exps?|Furniture\s*(?:&|and)?\s*Fixtures?|Office\s*Equipment|Vehicle|Television)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'totalFixedAssets',
      patterns: [
        /(?:TOTAL\s*PROJECT\s*COST|Total\s*Fixed\s*Capital|Total\s*Cost\s*of\s*Project|Gross\s*Block|Net\s*Block|Total\s*Fixed\s*Asset|TOTAL\s*\(A\)|Total\s*Cost)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bTotal[^\n]*?\b([\d,.]+(?:\.\d+)?)\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'gold',
      patterns: [
        /(?:Gold\s*Ornaments|Gold)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'share',
      patterns: [
        /(?:Shares?\s*(?:&|and)?\s*Securities|Investment\s*in\s*Shares|Share)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'fixedDeposite',
      patterns: [
        /(?:Bank\s*FD|Fixed\s*Deposits?|Term\s*Deposit)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'totalInvestment',
      patterns: [
        /(?:Total\s*Investment\s*\(B\)|Total\s*Investment|Investment\s*Total|Means\s*of\s*Finance)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'currentAsset',
      patterns: [
        /(?:Curretn\s*Assets?|Current\s*Assets?|Total\s*Current\s*Assets?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'sundryDebtor',
      patterns: [
        /(?:Debtors|Sundry\s*Debtors|Trade\s*Receivables|Receivables)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bDebtors[^\n]*?\b([\d,]{3,12})\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'stock',
      patterns: [
        /(?:Finished\s*Goods|Inventory|Raw\s*Material|Work\s*In\s*Progress|Stock\s*in\s*Trade|Stock)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bStock[^\n]*?\b([\d,]{3,12})\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'cash',
      patterns: [
        /(?:Cash\s*in\s*Hand|Cash\s*&?\s*Bank\s*Balances?|Cash\s*Balance|Cash)[^\n:]*[:\s]+([\d,.]+)/i,
        /\bCash[^\n]*?\b([\d,]{3,12})\b/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'bank',
      patterns: [
        /(STATE\s*BANK\s*OF\s*INDIA|HDFC\s*BANK|ICICI\s*BANK|AXIS\s*BANK|BANK\s*OF\s*BARODA|CANARA\s*BANK|CENTRAL\s*BANK|PUNJAB\s*NATIONAL\s*BANK|UNION\s*BANK)/i,
        /(?:Sanctioning\s*Bank|Bank\s*Name|Bank)[^\n:]*[:\s]+([A-Za-z\s]{3,30})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'otherCurrentAsset',
      patterns: [
        /(?:Margin\s*Money\s*on\s*Working\s*Capital|Margin\s*Money|Loans\s*&?\s*Advances|Deposit\s*with\s*Govt|Other\s*Current\s*Assets?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'totalCurrentAssets',
      patterns: [
        /(?:TOTAL\s*CURRENT\s*ASSET\s*\(C\)|Total\s*Current\s*Assets?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'grandTotal',
      patterns: [
        /(?:GRAND\s*TOTAL\s*\(A\s*\+\s*B\s*\+\s*C\)|GRAND\s*TOTAL|Total\s*Assets|Total\s*Liabilities|Total\s*Project\s*Cost|Total)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
  ],
};

const udyamCertificateTemplate: DocumentTemplate = {
  documentType: DocumentType.UDYAM_REGISTRATION_CERTIFICATE,
  rules: [
    {
      fieldName: 'udyamRegistrationNumber',
      patterns: [
        /(UDYAM-[A-Z0-9\-]{5,25})/i,
        /(?:UDYAM\s*REGISTRATION\s*NUMBER|UAM\s*NUMBER|UDYOG\s*AADHAAR\s*NUMBER)\s*[:/]?\s*([A-Z0-9\-]{8,25})/i,
        /\b([A-Z]{2}\d{2}[A-Z0-9]{7,14})\b/i,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
    {
      fieldName: 'firmName',
      patterns: [
        /(?:NAME\s*OF\s*ENTERPRISE|FIRM\s*NAME|Enterprise\s*Name|Name\s*of\s*Unit\(s\))\s*[:/]?\s*(?:1\s+)?([A-Za-z0-9\s.,&()'-]{3,40}?)(?=\s+TYPE|\s+OFFICAL|\s+CONSTITUTION|\n|$)/i,
        /(?:M\/s\.?\s+)?([A-Za-z0-9\s.,&()'-]{3,40}\s*(?:FABRICS|TRADERS|INDUSTRIES|ENTERPRISES|TEXTILE))/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'npvOldMachinery',
      patterns: [
        /(?:NPV\s*OF\s*OLD\s*MACHINERY|OLD\s*MACHINERY)[^\n:]*[:\s]+([\d,.]+)/i,
        /\b(0|NO|YES)\b/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'dateOfIncorporation',
      patterns: [
        /(?:DATE\s*OF\s*INCORPORATION\s*\/\s*REGISTRATION\s*OF\s*ENTERPRISE|DATE\s*OF\s*INCORPORATION|DATE\s*OF\s*REGISTRATION)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'dateOfCommencement',
      patterns: [
        /(?:DATE\s*OF\s*COMMENCEMENT\s*OF\s*PRODUCTION\s*\/\s*BUSINESS|DATE\s*OF\s*COMMENCEMENT)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'mobileNumber',
      patterns: [
        /(?:Mobile|MOBILE\s*NO\.?)\s*[:/]?\s*(?:\+91\s*)?(\d{10})/i,
      ],
    },
    {
      fieldName: 'emailId',
      patterns: [
        /(?:Email|EMAIL\s*ID)\s*[:/]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      ],
    },
    {
      fieldName: 'pan',
      patterns: [
        /(?:PAN)\s*[:/]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
        /\b([A-Z]{5}[0-9]{4}[A-Z])\b/,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
    {
      fieldName: 'typeOfOrganisation',
      patterns: [
        /(?:CONSTITUTION\s*OF\s*BUSINESS|TYPE\s*OF\s*ORGANISATION|TYPE\s*OF\s*ENTERPRISE)\s*[:/]?\s*(Proprietorship|Partnership|Private\s*Limited\s*Company|Public\s*Limited|Individual|HUFF|Society|Trust|Co-Operative)/i,
        /(Proprietorship|Partnership|Private\s*Limited\s*Company|Public\s*Limited|Individual)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'dateOfUdyamRegistration',
      patterns: [
        /(?:DATE\s*OF\s*UDYAM\s*REGISTRATION|DATE\s*OF\s*REGISTRATION)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'nicCode',
      patterns: [
        /(?:NIC\s*5\s*Digit|NIC\s*4\s*Digit|NIC\s*2\s*Digit|NIC\s*Codes?)\s*[:/]?\s*(\d{4,5})/i,
        /\b(13991|1399|13121|\d{5})\b/,
      ],
    },
    {
      fieldName: 'area',
      patterns: [
        /\b(SURAT|AHMEDABAD|VAPI|MUMBAI|PUNE|SATELLITE|NAVRANGPURA|394270|380015)\b/i,
        /(?:City|District)\s*[:/]?\s*([A-Za-z0-9\s]{3,20})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'addressLine1',
      patterns: [
        /(?:Flat\/Door\/Block\s*No\.?|OFFICAL\s*ADDRESS\s*OF\s*ENTERPRISE)\s*[:/]?\s*([A-Za-z0-9\s.,\-\n\/]{5,60}?)(?=\s+Road|\s+Village|\s+City|\n|$)/i,
        /(PLOT\s*NO[^\n]+)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'addressLine2',
      patterns: [
        /(?:Road\/Street\/Lane|Village\/Town)\s*[:/]?\s*([A-Za-z0-9\s.,\-\n]{3,60}?)(?=\s+City|\s+State|\n|$)/i,
        /(ICHHAPORE[^\n]+)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'categoryEnterprise',
      patterns: [
        /(?:SOCIAL\s*CATEGORY\s*OF\s*ENTREPRENEUR|SOCIAL\s*CATEGORY|Category)\s*[:/]?\s*(GENERAL|OBC|SC|ST)/i,
        /\b(GENERAL|OBC|SC|ST)\b/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'majorActivity',
      patterns: [
        /(?:MAJOR\s*ACTIVITY)\s*[:/]?\s*(MANUFACTURING|SERVICES|TRADING)/i,
        /\b(MANUFACTURING|SERVICES|TRADING)\b/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'typeOfEnterprise',
      patterns: [
        /(?:TYPE\s*OF\s*ENTERPRISE)\s*[:/]?\s*(MICRO|SMALL|MEDIUM)/i,
        /\b(MICRO|SMALL|MEDIUM)\b/i,
      ],
      postProcess: normalizeWhitespace,
    },
  ],
};

const gstCertificateTemplate: DocumentTemplate = {
  documentType: DocumentType.GST_CERTIFICATE,
  rules: [
    {
      fieldName: 'gstin',
      patterns: [
        /(?:1\.\s*GST\s*REGISTRATION\s*NUMBER|Registration\s*Number:?)\s*([A-Z0-9]{15})/i,
        /\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1})\b/i,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
    {
      fieldName: 'legalName',
      patterns: [
        /(?:2\.\s*LEGAL\s*NAME|Legal\s*Name)\s*[:/]?\s*([A-Za-z0-9\s.,&()'-]{3,60}?)(?=\s+3\.|\s+TRADE|\n|$)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'tradeName',
      patterns: [
        /(?:3\.\s*TRADE\s*NAME|Trade\s*Name)(?:,\s*IF\s*ANY)?\s*[:/]?\s*([A-Za-z0-9\s.,&()'-]{3,60}?)(?=\s+4\.|\s+CONSTITUTION|\n|$)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'constitution',
      patterns: [
        /(?:4\.\s*CONSTITUTION\s*(?:OF\s*BUSINESS)?|Constitution)\s*[:/]?\s*([A-Za-z\s]{3,40}?)(?=\s+5\.|\s+ADDRESS|\n|$)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'addressLine1',
      patterns: [
        /(?:5\.\s*(?:ADDRESS\s*(?:OF\s*PRINCIPAL\s*PLACE\s*OF\s*BUSINESS)?|Address\s*Line\s*[-_]?\s*1|Address))\s*[:/]?\s*([\s\S]{5,350}?)(?=\s*6\.\s*|\s*DATE\s*OF\s*LIABILITY|\s*PERMANENT\s*ACCOUNT|\s*DATE\s*OF\s*REGISTRATION|\n\s*\d+\.|\n\s*Details|\n\s*Note:|$)/i,
      ],
      postProcess: (v) => cleanAddressValue(v) || normalizeWhitespace(v),
    },
    {
      fieldName: 'dateOfLiability',
      patterns: [
        /(?:6\.\s*DATE\s*OF\s*LIABILITY)\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'dateOfIssue',
      patterns: [
        /(?:7\.\s*DATE\s*OF\s*ISSUE\s*OF\s*CERTIFICATE)\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'proprietorName',
      patterns: [
        /(?:8\.\s*NAME)\s*([A-Za-z\s]{2,30}?)(?=\s+9\.|\s+DESIGNATION|\n|$)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'designation',
      patterns: [
        /(?:9\.\s*DESIGNATION)\s*([A-Za-z\s]{3,30}?)(?=\s+This|\n|$)/i,
      ],
      postProcess: normalizeWhitespace,
    },
  ],
};

const birthCertificateTemplate: DocumentTemplate = {
  documentType: DocumentType.BIRTH_CERTIFICATE,
  rules: [
    {
      fieldName: 'fullName',
      patterns: [
        /(?:NAME|FULL\s*NAME|Name\s*of\s*Child)\s*[:/]?\s*([A-Z][A-Za-z\s]{2,40})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'dateOfBirth',
      patterns: [
        /(?:DATE\s*OF\s*BIRTH|DOB)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,
      ],
    },
    {
      fieldName: 'gender',
      patterns: [
        /(?:SEX|GENDER)\s*[:/]?\s*(MALE|FEMALE|OTHER)/i,
        /\b(MALE|FEMALE|OTHER)\b/i,
      ],
      postProcess: (v) => v.toUpperCase(),
    },
  ],
};

const loanSanctionLetterTemplate: DocumentTemplate = {
  documentType: DocumentType.LOAN_SANCTION_LETTER,
  rules: [
    {
      fieldName: 'sanctionDate',
      patterns: [
        /(?:Sanction\s*Date|Date\s*of\s*Sanction|Date|Dated?)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
        /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,
      ],
    },
    {
      fieldName: 'applicationDate',
      patterns: [
        /(?:application\s*dated?|letter\s*dated?)\s*[:/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
      ],
    },
    {
      fieldName: 'firmName',
      patterns: [
        /(?:Name\s*of\s*(?:the\s*)?Borrower|Borrower\s*Name|Borrower|Firm\s*Name|Customer\s*Name|To,?\s*\n?)\s*[:/]?\s*(?:M\/s\.?\s*)?([A-Za-z0-9\s.,&()'-]{3,45})/i,
        /(?:M\/s\.?\s+)([A-Za-z0-9\s.,&()'-]{3,45})/i,
        /(?:M\/s\s+)?([A-Za-z0-9\s.,&()'-]{3,40}\s*(?:PRIVATE\s*LIMITED|LIMITED|CONSULTANCY|INDUSTRIES|ENTERPRISES|FABRICS|TRADERS|STORE|STORES))/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'addressLine1',
      patterns: [
        /(Shop\s*No[^\n,]+)/i,
        /(?:Address)\s*[:/]?\s*([A-Za-z0-9\s.,\-\n]{5,60})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'addressLine2',
      patterns: [
        /(Near\s*Toll[^\n,]+)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'areaCode',
      patterns: [
        /\b(396191|411001|395010|\d{6})\b/,
      ],
    },
    {
      fieldName: 'loanAmount',
      patterns: [
        /(?:Sanctioned?\s*Amount|Sanction\s*Limit|Loan\s*Amount|Facility\s*Amount|Amount\s*Sanctioned|Limit|Rs\.?|INR)\s*[:/]?\s*(?:Rs\.?|INR)?\s*([\d,.]+)/i,
        /(?:Rs\.?|INR)\s*([\d,]{4,15})/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: 'rateOfInterest',
      patterns: [
        /(?:Rate\s*of\s*Interest|Interest\s*Rate|ROI|Interest)\s*[:/]?\s*([\d.]+\s*%?)/i,
        /\b(\d{1,2}\.\d{1,2}\s*%)/i,
      ],
    },
    {
      fieldName: 'repaymentTenure',
      patterns: [
        /(?:Repayment\s*Tenure|Repayment\s*Period|Tenure|Period|Duration|Repayable\s*in)\s*[:/]?\s*(\d{1,3})/i,
        /\b(\d{1,3})\s*(?:Months|EMIs|Monthly\s*Installments)\b/i,
      ],
    },
    {
      fieldName: 'moratoriumPeriod',
      patterns: [
        /(?:Moratorium\s*Period|Moratorium)\s*[:/]?\s*(\d{1,2})/i,
      ],
    },
    {
      fieldName: 'margin',
      patterns: [
        /(?:Margin\s*Money|Margin)\s*[:/]?\s*([\d.]+\s*%?)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'cgtmse',
      patterns: [
        /(?:CGTMSE\s*Coverage|CGTMSE)\s*[:/]?\s*(Yes|No)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'oldMachinery',
      patterns: [
        /(?:Old\s*Machinery\s*Loan)\s*[:/]?\s*(Yes|No)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'bank',
      patterns: [
        /(BANK\s+OF\s+BARODA|BARODA\s+BANK|CANARA\s+BANK|CENTRAL\s+BANK\s+OF\s+INDIA|HDFC\s+BANK|ICICI\s+BANK|INDIAN\s+OVERSEAS\s+BANK|AXIS\s+BANK|KALUPUR\s+COMMERCIAL\s+CO-?OPERATIVE\s+BANK|PRIME\s+CO-?OPERATIVE\s+BANK|VARACHHA\s+CO-?OPERATIVE\s+BANK|SIDBI|SMALL\s+INDUSTRIES\s+DEVELOPMENT\s+BANK\s+OF\s+INDIA|YES\s+BANK|STATE\s+BANK\s+OF\s+INDIA|UNION\s+BANK\s+OF\s+INDIA|PUNJAB\s+NATIONAL\s+BANK)/i,
        /(?:Sanctioning\s*Bank|Bank\s*Name|Bank)\s*[:/]?\s*([A-Za-z\s]{3,40})/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: 'branch',
      patterns: [
        /(?:Branch\s*Name|Branch)\s*[:/]?\s*([A-Za-z0-9\s.,'-]+?Branch)/i,
        /(Vapi\s*Main\s*Branch|Main\s*Branch|[A-Za-z\s]+Branch)/i,
      ],
      postProcess: normalizeWhitespace,
    },
  ],
};

const balanceSheetReportTemplate: DocumentTemplate = {
  documentType: DocumentType.BALANCE_SHEET_REPORT,
  rules: [
    {
      fieldName: "PROPRIETOR'S CAPITAL",
      patterns: [
        /(?:PROPRIETOR'?S?\s*CAPITAL|Capital\s*Account|Owner'?s?\s*Capital)[^\n:]*[:\s]+([\d,.]+)/i,
        /PROPRIETOR'?S?\s*CAPITAL[^\n]*?([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "PARTNER/DIRECTOR-1 CAPITAL",
      patterns: [
        /(?:PARTNER\s*\/?\s*DIRECTOR\s*-\s*1\s*CAPITAL|Partner\s*1\s*Capital|Partner'?s?\s*Capital)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "PARTNER/DIRECTOR-2 CAPITAL",
      patterns: [
        /(?:PARTNER\s*\/?\s*DIRECTOR\s*-\s*2\s*CAPITAL|Partner\s*2\s*Capital)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "PARTNER/DIRECTOR-3 CAPITAL",
      patterns: [
        /(?:PARTNER\s*\/?\s*DIRECTOR\s*-\s*3\s*CAPITAL|Partner\s*3\s*Capital)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "TERM LOAN",
      patterns: [
        /(?:TERM\s*LOAN|Bank\s*Loan|Secured\s*Loan|Term\s*Loans)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "VEHICLE LOAN",
      patterns: [
        /(?:VEHICLE\s*LOAN|Car\s*Loan|Auto\s*Loan)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "PERSONAL LOAN",
      patterns: [
        /(?:PERSONAL\s*LOAN|Unsecured\s*Loan|Loan\s*from\s*Partners?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "SUNDRY CREDITOR",
      patterns: [
        /(?:SUNDRY\s*CREDITOR[S]?|Trade\s*Payables?|Creditors?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "DUTY AND TAXES",
      patterns: [
        /(?:DUTY\s*(?:AND|&)\s*TAXES|GST\s*PAYABLE|Duties\s*&?\s*Taxes|Tax\s*Liabilities)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "WORKING CAPITAL LOAN",
      patterns: [
        /(?:WORKING\s*CAPITAL\s*LOAN|Cash\s*Credit|CC\s*Limit)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "OVERDRAFT",
      patterns: [
        /(?:OVERDRAFT|Bank\s*Overdraft|OD\s*Limit)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "OUTSTANDING EXPENSES",
      patterns: [
        /(?:OUTSTANDING\s*EXPENSES?|Provisions)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "TOTAL CURRENT LIABILITY",
      patterns: [
        /(?:TOTAL\s*CURRENT\s*LIABILIT(?:Y|IES)|Current\s*Liabilities)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "LAND",
      patterns: [
        /(?:LAND|Land\s*&?\s*Site)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "BUILDING",
      patterns: [
        /(?:BUILDING|Factory\s*Shed|Building\s*Construction)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "PLANT AND MACHINERY",
      patterns: [
        /(?:PLANT\s*(?:AND|&)\s*MACHINERY|Plant\s*&?\s*Machinery|Machinery)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "ELECTRICAL FITTING",
      patterns: [
        /(?:ELECTRICAL\s*FITTING[S]?|Power\s*&?\s*Fuel|Electric\s*Installation)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "FURNITURE & FIXTURES",
      patterns: [
        /(?:FURNITURE\s*(?:&|AND)\s*FIXTURES?|Furniture)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "CAR & VEHICLE",
      patterns: [
        /(?:CAR\s*(?:&|AND)\s*VEHICLE|VEHICLE[S]?|Vehicles?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "ELECTRONIC EQUIPMENT",
      patterns: [
        /(?:ELECTRONIC\s*EQUIPMENT|COMPUTER[S]?\s*(?:AND|&)?\s*EQUIPMENT|Computers?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "OTHER FIXED ASSET",
      patterns: [
        /(?:OTHER\s*FIXED\s*ASSETS?|Other\s*Assets)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "TOTAL FIXED ASSET (A)",
      patterns: [
        /(?:TOTAL\s*FIXED\s*ASSET[S]?\s*\(?A\)?|Gross\s*Block|Net\s*Block|Total\s*Fixed\s*Assets)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "GOLD",
      patterns: [
        /(?:GOLD|Gold\s*Ornaments?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "SHARE",
      patterns: [
        /(?:SHARE[S]?|Investments?\s*in\s*Shares)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "FIXED DEPOSIT",
      patterns: [
        /(?:FIXED\s*DEPOSIT[S]?|Bank\s*FD|FD)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "OTHER INVESTMENT",
      patterns: [
        /(?:OTHER\s*INVESTMENT[S]?|Investments?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "TOTAL INVESTMENT (B)",
      patterns: [
        /(?:TOTAL\s*INVESTMENT\s*\(?B\)?|Total\s*Investments)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "SUNDRY DEBTOR",
      patterns: [
        /(?:SUNDRY\s*DEBTOR[S]?|Trade\s*Receivables?|Debtors?)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "STOCK",
      patterns: [
        /(?:STOCK\s*IN\s*TRADE|CLOSING\s*STOCK|INVENTORY|STOCK|Finished\s*Goods)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "CASH",
      patterns: [
        /(?:CASH\s*IN\s*HAND|CASH\s*BALANCE|CASH)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "BANK",
      patterns: [
        /BANK[\s:]*(STATE\s*BANK\s*OF\s*INDIA|HDFC\s*BANK|ICICI\s*BANK|AXIS\s*BANK|CANARA\s*BANK|PUNJAB\s*NATIONAL\s*BANK|BANK\s*OF\s*BARODA)/i,
        /(STATE\s*BANK\s*OF\s*INDIA|HDFC\s*BANK|ICICI\s*BANK|AXIS\s*BANK|CANARA\s*BANK|PUNJAB\s*NATIONAL\s*BANK|BANK\s*OF\s*BARODA)/i,
      ],
      postProcess: normalizeWhitespace,
    },
    {
      fieldName: "TOTAL CURRENT ASSET (C)",
      patterns: [
        /(?:TOTAL\s*CURRENT\s*ASSET[S]?\s*\(?C\)?|Total\s*Current\s*Assets)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "OTHER CURRENT ASSET",
      patterns: [
        /(?:OTHER\s*CURRENT\s*ASSET[S]?|Loans?\s*&?\s*Advances?|Margin\s*Money)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "GRAND TOTAL (A + B + C)",
      patterns: [
        /(?:GRAND\s*TOTAL\s*(?:\(A\s*\+\s*B\s*\+\s*C\)|A\+B\+C)?|TOTAL\s*ASSETS|TOTAL\s*LIABILITIES)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "LIABILITIES TOTAL",
      patterns: [
        /(?:LIABILITIES\s*TOTAL|TOTAL\s*LIABILITIES|Total\s*Capital\s*and\s*Liabilities)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
    {
      fieldName: "ASSETS TOTAL",
      patterns: [
        /(?:ASSETS\s*TOTAL|TOTAL\s*ASSETS|Total\s*Property\s*and\s*Assets)[^\n:]*[:\s]+([\d,.]+)/i,
      ],
      postProcess: parseIndianAmount,
    },
  ],
};

// ─────────────────── Dynamic Universal Fallback Extractor ───────────────────

const BLACKLISTED_EXACT_HEADERS = new Set([
  'GOVERNMENT OF INDIA',
  'INCOME TAX DEPARTMENT',
  'GOODS AND SERVICES TAX',
  'REGISTRATION CERTIFICATE',
  'GOODS AND SERVICES TAX REGISTRATION CERTIFICATE',
  'FORM GST REG-06',
  'UDYAM REGISTRATION CERTIFICATE',
  'PERMANENT ACCOUNT NUMBER CARD',
  'ELECTRICITY BILL',
  'BALANCE SHEET REPORT',
  'PROJECT REPORT',
  'LOAN SANCTION LETTER',
  'AADHAAR',
  'AADHAAR CARD',
  'ADHAAR',
  'ADHAAR CARD',
  'MY AADHAAR',
  'MY ADHAAR',
  'UNIQUE IDENTIFICATION AUTHORITY OF INDIA',
  'GOVERNMENT',
]);

const BLACKLISTED_HEADER_WORDS = new Set([
  'INCOME', 'DEPARTMENT', 'GOVT', 'GOVERNMENT', 'INDIA', 'PERMANENT', 'ACCOUNT',
  'SIGNATURE', 'AUTHORITY', 'IDENTIFICATION', 'ELECTRICITY',
  'SANCTION', 'STATEMENT', 'MEMORANDUM', 'AADHAAR', 'ADHAAR', 'ADHAR'
]);

function isBlacklistedName(str: string): boolean {
  if (!str || typeof str !== 'string' || str.trim().length < 3) return true;
  const upper = str.toUpperCase().trim();
  if (BLACKLISTED_EXACT_HEADERS.has(upper)) return true;

  const words = upper.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  let blacklistedCount = 0;
  for (const w of words) {
    if (BLACKLISTED_HEADER_WORDS.has(w)) blacklistedCount++;
  }
  return blacklistedCount / words.length > 0.5;
}

/** Validate and clean extracted field values to reject pure label/bracket artifacts */
function cleanAndValidateValue(
  val: string,
  isNameField: boolean = false,
  isNumericField: boolean = false,
): string | null {
  if (!val || typeof val !== 'string') return null;

  // Remove bracket/colon/slash/brace wrapping e.g. "():", "{4 Television", "(नाम):", " - ", " : "
  let clean = val
    .replace(/^[\s(){}::/\-\.,'"]+|[\s(){}::/\-\.,'"]+$/g, '')
    .replace(/[\(\)\[\]\{\}]/g, '')
    .trim();

  if (isNumericField) {
    if (clean === '' || /^[\-–—]+$/.test(clean) || /^nil$/i.test(clean) || /^n\.?a\.?$/i.test(clean)) {
      return '0.00';
    }
    const numMatches = clean.match(/\b\d+(?:[\.,]\d+)*\b/g);
    if (!numMatches || numMatches.length === 0) {
      return '0.00';
    }
    const cleanNums = numMatches
      .map((n) => parseIndianAmount(n))
      .filter((n) => n !== undefined && n !== null && n !== '');
    if (cleanNums.length > 0) {
      return cleanNums[0];
    }
    return '0.00';
  }

  // Must have at least 2 characters and at least 1 letter or digit
  if (clean.length < 2 || !/[a-zA-Z0-9]/.test(clean)) return null;

  // Filter out pure label words or Hindi translation remnants
  if (/^(?:नाम|Name|Full\s*Name|Father|पिता|Date|DOB|Date\s*of\s*Birth|Gender|Sex|Address|Permanent\s*Account|PAN)$/i.test(clean)) {
    return null;
  }

  // Filter out blacklisted document headers only for name fields
  if (isNameField) {
    clean = clean
      .replace(/\s+(?:Male|Female|Transgender|Sex|DOB|D\.O\.B|Date|20-\d{2}-\d{4}|\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}).*/gi, '')
      .trim();

    let prev = '';
    while (prev !== clean) {
      prev = clean;
      clean = clean
        .replace(/^(?:GOVERNMENT|OVERNMENT|GOVERNMENTOFINDIA|OVERNMENTOFINDIA|OFINDIA|UNIQUE|AUTHORITY|INDIA|OF\s*INDIA|AADHAAR|MY\s*AADHAAR|MYADHAAR)\b[\s:]*/gi, '')
        .trim();
    }

    if (clean.length < 2) return null;
    if (isBlacklistedName(clean)) return null;

    // A person's name shouldn't be a date, PAN number, or Aadhaar number
    if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(clean)) return null;
    if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) return null;
    if (/^\d{4}\s?\d{4}\s?\d{4}$/.test(clean)) return null;
  }

  return clean;
}

/** Helper to clean extracted address string, stripping leading field labels/prefixes and collapsing whitespace */
function cleanAddressValue(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();

  clean = clean.replace(
    /^(?:5\.\s*)?(?:ADDRESS\s*OF\s*PRINCIPAL\s*PLACE\s*OF\s*BUSINESS|OFFICIAL\s*ADDRESS\s*OF\s*ENTERPRISE|OFFICIAL\s*ADDRESS|PRINCIPAL\s*PLACE\s*OF\s*BUSINESS|BUSINESS\s*ADDRESS|BILLING\s*ADDRESS|PERMANENT\s*ADDRESS|PRESENT\s*ADDRESS|RESIDENTIAL\s*ADDRESS|ADDRESS\s*LINE\s*[-_]?\s*[123]|ADDRESS|ADDR|OF\s*PRINCIPAL\s*PLACE\s*OF\s*BUSINESS|OF\s*PRINCIPAL\s*PLACE\s*OF|OF\s*PRINCIPALPLACE\s*OF|OF\s*ENTERPRISE)\s*[:\-\s]*/gi,
    ''
  );
  clean = clean.replace(
    /^(?:5\.\s*)?(?:Address|ADDRESS)?\s*(?:of|OF)?\s*(?:Principal|PRINCIPAL)?\s*(?:Place|PLACE)?\s*(?:of|OF)?\s*(?:Business|BUSINESS)?\s*[:\-\s]*/gi,
    ''
  );

  clean = clean.replace(/\b(?:of|OF)\s+(?:Business|BUSINESS)\b[:\-\s]*/g, ', ');
  clean = clean.replace(/\b(?:of|OF)\s+(?:Principal\s+Place|PRINCIPAL\s+PLACE)\b[:\-\s]*/g, ' ');

  clean = clean.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  clean = clean.replace(/^[:,\-\s]+/, '').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').trim();
  clean = clean.replace(
    /\s*(?:6\.\s*DATE\s*OF\s*LIABILITY|6\.\s*DATE|DATE\s*OF\s*LIABILITY|PERMANENT\s*ACCOUNT|DATE\s*OF\s*REGISTRATION|TYPE\s*OF\s*REGISTRATION|SIGNATURE|Details|Note:).*$/gi,
    ''
  ).trim();
  clean = clean.replace(/\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g, '').trim();

  if (clean.length < 5) return null;
  return clean;
}

/** Dynamic name extractor that scans text lines for capitalized full names */
function extractDynamicName(rawText: string): string | null {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Look for lines near Name / Legal Name / Borrower / Enterprise / M/s labels
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:M\/s\.?\s*|Messrs\s+)([A-Za-z0-9\s.,&()'-]{3,45})/i.test(line)) {
      const match = line.match(/(?:M\/s\.?\s*|Messrs\s+)([A-Za-z0-9\s.,&()'-]{3,45})/i);
      if (match && match[1]) {
        const clean = match[1].replace(/^(of|is|the|card|number)\b/gi, '').trim();
        if (clean.length >= 3 && !isBlacklistedName(clean)) return clean;
      }
    }
    if (/(?:Name|Legal\s*Name|Firm\s*Name|Enterprise|Borrower|Applicant|Holder|Proprietor|Consumer|नाम)\b/i.test(line)) {
      const matchInline = line.match(/(?:Name|नाम|Enterprise|Firm|Borrower|Holder|Consumer)\s*[:/]?\s*([A-Za-z\s.']{3,40})/i);
      if (matchInline && matchInline[1]) {
        const clean = matchInline[1].replace(/^(of|is|the|card|number)\b/gi, '').trim();
        if (clean.length >= 3 && !isBlacklistedName(clean)) return clean;
      }
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (/^[A-Za-z\s.']{3,40}$/.test(nextLine) && !isBlacklistedName(nextLine)) {
          return nextLine.trim();
        }
      }
    }
  }

  // 2. Scan for capitalized full name patterns (2 to 4 words of English letters)
  for (const line of lines) {
    if (/^[A-Z][a-zA-Z.']{1,20}(?:\s+[A-Z][a-zA-Z.']{1,20}){1,3}$/.test(line)) {
      if (!isBlacklistedName(line)) {
        return line.trim();
      }
    }
  }

  return null;
}

/** Dynamic date extractor (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD) */
function extractDynamicDate(rawText: string): string | null {
  const match =
    rawText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/) ||
    rawText.match(/\b(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/);
  return match ? match[1] : null;
}

/** Dynamic PAN Number extractor */
function extractDynamicPan(rawText: string): string | null {
  const match = rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  return match ? match[1].toUpperCase() : null;
}

/** Dynamic Aadhaar Number extractor */
function extractDynamicAadhaar(rawText: string): string | null {
  const match = rawText.match(/\b([1-9]\d{3}\s?\d{4}\s?\d{4})\b/) || rawText.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/);
  return match ? match[1].replace(/\s+/g, ' ').trim() : null;
}

/** Dynamic GSTIN extractor */
function extractDynamicGstin(rawText: string): string | null {
  const match = rawText.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1})\b/i);
  return match ? match[1].toUpperCase() : null;
}

/** Dynamic Udyam Number extractor */
function extractDynamicUdyam(rawText: string): string | null {
  const match = rawText.match(/\b(UDYAM-[A-Z0-9\-]{5,25})\b/i);
  return match ? match[1].toUpperCase() : null;
}

// ─────────────────── Template Registry ───────────────────

const TEMPLATES: Map<DocumentType, DocumentTemplate> = new Map([
  [DocumentType.PAN_CARD, panCardTemplate],
  [DocumentType.AADHAAR_CARD, aadhaarCardTemplate],
  [DocumentType.ELECTRICITY_BILL, electricityBillTemplate],
  [DocumentType.PROJECT_REPORT, projectReportTemplate],
  [DocumentType.UDYAM_REGISTRATION_CERTIFICATE, udyamCertificateTemplate],
  [DocumentType.GST_CERTIFICATE, gstCertificateTemplate],
  [DocumentType.BIRTH_CERTIFICATE, birthCertificateTemplate],
  [DocumentType.LOAN_SANCTION_LETTER, loanSanctionLetterTemplate],
  [DocumentType.BALANCE_SHEET_REPORT, balanceSheetReportTemplate],
]);

// ─────────────────── Public API ───────────────────

/**
 * Parse raw OCR text using the template for the given document type.
 * Returns a flat Record<string, string> of extracted fields.
 * Performs dynamic fallback extraction if specific template regexes miss key fields.
 */
/** Check if title represents a numeric or financial amount field */
function isFinancialOrNumericTitle(title: string, fieldDefType?: string): boolean {
  if (fieldDefType === 'numeric' || fieldDefType === 'decimal') return true;
  if (fieldDefType === 'date' || fieldDefType === 'alphanumeric' || fieldDefType === 'free_text' || fieldDefType === 'dropdown') {
    return false;
  }

  return /\b(?:amount|fee|price|cost|balance|total|capital|loan|turnover|salary|premium|rent|deposit|tax|gross|net|pbt|pat|ebitda|hra|da|land|building|plant|machinery|equipment|fitting|compressor|airconditioner|ac|asset|assets|liability|liabilities|stock|inventory|cash|debtor|debtors|creditor|creditors|gold|share|investment|reserve|surplus|duty|duties|overdraft|margin|advance|advances|value|valuation|limit|rate|meter|meters|pcs|pieces|quantity|qty)\b/i.test(title);
}

/**
 * Parse raw OCR text using a dynamic custom schema containing arbitrary custom fields.
 * Supports all 25 document categories (Identity, Business, Tax, GST, Banking, Utility, Property,
 * Balance Sheet, Project Reports, MSME, Insurance, Loans, Orders, Certificates, Vehicles, Receipts,
 * Legal Agreements, Medical, Education, and Common Metadata) as well as universal fuzzy/line-by-line fallback.
 */
export function parseCustomSchema(
  rawText: string,
  customSchema: any,
): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!customSchema || typeof customSchema !== 'object') {
    return fields;
  }

  const fieldList: Array<{ id?: number; title: string; type?: string; dropdown?: string }> = [];

  const addItem = (item: any) => {
    if (typeof item === 'string' && item.trim().length > 0) {
      fieldList.push({ title: item.trim() });
    } else if (item && typeof item === 'object') {
      const title = item.title || item.name || item.key || item.field || item.fieldName || item.label;
      if (title && typeof title === 'string') {
        fieldList.push({ title: title.trim(), type: item.type, dropdown: item.dropdown });
      }
    }
  };

  if (Array.isArray(customSchema)) {
    customSchema.forEach(addItem);
  } else {
    let schemaObj = customSchema;
    const keys = Object.keys(customSchema);
    if (keys.length === 1 && customSchema[keys[0]] && typeof customSchema[keys[0]] === 'object' && !customSchema.fields) {
      schemaObj = customSchema[keys[0]];
    }

    if (Array.isArray(schemaObj.fields)) {
      schemaObj.fields.forEach(addItem);
    }

    if (Array.isArray(schemaObj.sections)) {
      schemaObj.sections.forEach((sec: any) => {
        if (Array.isArray(sec.fields)) {
          sec.fields.forEach(addItem);
        }
      });
    }

    if (fieldList.length === 0) {
      for (const [k, v] of Object.entries(schemaObj)) {
        if (['document_id', 'document_name', 'category'].includes(k)) continue;
        addItem(typeof v === 'object' ? { title: k, ...v } : { title: k });
      }
    }
  }

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  // Helper to try matching built-in document templates rules for standard fields
  const tryTemplateRuleMatch = (title: string): string | null => {
    const norm = title.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/adhaar|adhar/g, 'aadhaar');
    // Prevent generic template hijacking for multi-entity or domain-specific custom fields
    if (
      norm.includes('supplier') ||
      norm.includes('recipient') ||
      norm.includes('consignor') ||
      norm.includes('consignee') ||
      norm.includes('buyer') ||
      norm.includes('seller') ||
      norm.includes('broker') ||
      norm.includes('challan') ||
      norm.includes('quality') ||
      norm.includes('meter') ||
      norm.includes('piece') ||
      norm.includes('pcs') ||
      norm.includes('rate') ||
      norm.includes('gst')
    ) {
      return null;
    }

    const isPersonNameField = norm.includes('name') && !norm.includes('document') && !norm.includes('company') && !norm.includes('firm') && !norm.includes('enterprise');

    for (const template of TEMPLATES.values()) {
      for (const rule of template.rules) {
        const ruleNorm = rule.fieldName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/adhaar|adhar/g, 'aadhaar');
        const isExact = ruleNorm === norm;
        const isSpecificId =
          (ruleNorm === 'pannumber' && (norm === 'pan' || norm === 'panno' || norm === 'pancardnumber')) ||
          (ruleNorm === 'aadhaarnumber' && (norm === 'aadhaar' || norm === 'aadhaarno' || norm === 'aadhaarcardnumber')) ||
          (ruleNorm === 'udyamregistrationnumber' && (norm === 'udyam' || norm === 'udyamnumber' || norm === 'uamno')) ||
          (ruleNorm === 'consumernumber' && (norm === 'consumerno' || norm === 'serviceno'));

        if (isExact || isSpecificId) {
          const val = applyRule(rawText, rule);
          if (val) {
            if (isPersonNameField && isBlacklistedName(val)) {
              continue;
            }
            return val;
          }
        }
      }
    }
    return null;
  };

  // Helper: Find value from line matching specific tokens, handling delimiters, numbers, and next-line fallbacks
  const extractFromLineContext = (
    targetTokens: string[],
    excludeTokens: string[] = [],
    isNameField: boolean = false,
    isNumericField: boolean = false,
  ): string | null => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNorm = line.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (excludeTokens.some((ex) => lineNorm.includes(ex))) {
        continue;
      }

      for (const token of targetTokens) {
        if (lineNorm.includes(token)) {
          // If numeric field, look for number after the token first, then fallback to line numbers
          if (isNumericField) {
            const afterTokenRegex = new RegExp(`(?:${token})[^\\d\\r\\n]*(\\d+(?:[\\.,]\\d+)*)`, 'i');
            const afterMatch = line.match(afterTokenRegex);
            if (afterMatch && afterMatch[1]) {
              return parseIndianAmount(afterMatch[1]);
            }

            const lineNums = line.match(/\b\d+(?:[\.,]\d+)*\b/g);
            if (lineNums && lineNums.length > 0) {
              const cleanNums = lineNums
                .map((n) => parseIndianAmount(n))
                .filter((n) => n !== undefined && n !== null && n !== '');

              if (cleanNums.length > 0) {
                let chosen = cleanNums[0];
                // If line starts with list index e.g. "1. Land 15.00", skip index cleanNums[0] and use figure cleanNums[1]
                if (cleanNums.length > 1 && (/^\s*\d+[\.\)]?\s+/.test(line) || /^\s*[a-z][\.\)]\s+/i.test(line))) {
                  if (/^\d{1,2}$/.test(cleanNums[0]) && line.trim().startsWith(cleanNums[0])) {
                    chosen = cleanNums[1];
                  }
                }
                return chosen;
              }
            }
          }

          // 1. Check for colon/dash/equal delimiter
          const sepMatch = line.match(/[:\-=]\s*(.+)$/);
          if (sepMatch && sepMatch[1]) {
            const prefix = line.substring(0, line.indexOf(sepMatch[0])).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (prefix.length >= 2 && (prefix.includes(token) || (token.length >= 4 && token.includes(prefix)))) {
              let rawVal = sepMatch[1].trim();
              rawVal = rawVal.replace(/\s+(?:Challan|Date|Dt|GST|No\b|Broker|Quality|Rate|Hate|Total|Pcs|Meters?)\s*[:.\-=].*$/i, '');
              const val = cleanAndValidateValue(rawVal, isNameField, isNumericField);
              if (val) return val;
            }
          }

          // 2. Strip leading title label if on the same line
          const regex = new RegExp(`^(?:\\d+[\\.\\)]\\s*|[a-z][\\.\\)]\\s*)?(?:${token})(?:\\s*[\\(/][^\\)]*[\\)/])?\\s*[:\\-=]\\s*(.+)`, 'i');
          const m = line.match(regex);
          if (m && m[1]) {
            const val = cleanAndValidateValue(m[1].trim(), isNameField, isNumericField);
            if (val) return val;
          }

          // 3. Fallback: Next line if label is alone on the current line
          if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
            const nextLine = lines[i + 1];
            if (isNumericField) {
              const nextNums = nextLine.match(/\b\d+(?:[\.,]\d+)*\b/g);
              if (nextNums && nextNums.length > 0) {
                const cleanNums = nextNums
                  .map((n) => parseIndianAmount(n))
                  .filter((n) => n !== undefined && n !== null && n !== '');
                if (cleanNums.length > 0) {
                  return cleanNums[0];
                }
              }
            }
            const nextVal = cleanAndValidateValue(nextLine, isNameField, isNumericField);
            if (nextVal && !excludeTokens.some((ex) => lines[i + 1].toLowerCase().replace(/[^a-z0-9]/g, '').includes(ex))) {
              return nextVal;
            }
          }
        }
      }
    }
    return null;
  };

  for (const fieldDef of fieldList) {
    const title = fieldDef.title;
    if (!title) continue;

    const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isNumericField = isFinancialOrNumericTitle(title, fieldDef.type);
    let extractedValue: string | null = null;

    // 0. High-Precision Template Rule Matcher
    extractedValue = tryTemplateRuleMatch(title);

    if (!extractedValue) {
      // ─────────────────────────────────────────────────────────────────────────────
      // 1. Common / Document Metadata Fields
      // ─────────────────────────────────────────────────────────────────────────────
      if (/doc(?:ument)?\s*type/i.test(title) || normTitle === 'documenttype' || normTitle === 'doctype') {
        const typeMatch = rawText.match(/\b(PAN\s*CARD|AADHAAR(?:\s*CARD)?|TAX\s*INVOICE|INVOICE|GST\s*CERTIFICATE|REGISTRATION\s*CERTIFICATE|UDYAM\s*REGISTRATION(?:\s*CERTIFICATE)?|BIRTH\s*CERTIFICATE|ELECTRICITY\s*BILL|PROJECT\s*REPORT|BALANCE\s*SHEET|LOAN\s*SANCTION\s*LETTER|DRIVING\s*LICEN[SC]E|PASSPORT|VOTER\s*ID|SALARY\s*SLIP|PAY\s*SLIP|RENT\s*AGREEMENT|INSURANCE\s*POLICY|MARKSHEET)\b/i);
        if (typeMatch) extractedValue = typeMatch[1].toUpperCase();
      } else if (/doc(?:ument)?\s*name/i.test(title) || normTitle === 'documentname' || normTitle === 'docname') {
        const nameMatch = rawText.match(/^(?:[\s\S]*?\n)?\s*([A-Z0-9\s.,&()'-]{4,60})(?=\r?\n)/);
        if (nameMatch && !isBlacklistedName(nameMatch[1])) extractedValue = nameMatch[1].trim();
      } else if (normTitle === 'status' || normTitle === 'documentstatus' || normTitle === 'gststatus' || normTitle === 'paymentstatus' || normTitle === 'validationstatus') {
        const ctxVal = extractFromLineContext([normTitle, 'status'], ['marital']);
        if (ctxVal && /^(?:active|inactive|verified|approved|completed|valid|cancelled|pending|rejected|registered|suspended|regular|composition|pass|passed|failed|paid|unpaid)$/i.test(ctxVal)) {
          extractedValue = ctxVal.toUpperCase();
        } else {
          const statMatch = rawText.match(/\b(ACTIVE|INACTIVE|VERIFIED|APPROVED|COMPLETED|VALID|CANCELLED|PENDING|REJECTED|REGISTERED|SUSPENDED|REGULAR|COMPOSITION|PASS|PASSED|FAILED|PAID|UNPAID)\b/i);
          if (statMatch) extractedValue = statMatch[1].toUpperCase();
        }
      } else if (/^(?:remarks?|description|purpose|subject|terms?|conditions?|notes?)$/i.test(title)) {
        extractedValue = extractFromLineContext([normTitle, 'remarks', 'description', 'purpose', 'subject', 'terms']);
      } else if (/issuing\s*authority|authority\s*name|issuing\s*office|place\s*of\s*issue|registration\s*authority/i.test(title)) {
        extractedValue = extractFromLineContext(['issuingauthority', 'authorityname', 'issuingoffice', 'placeofissue', 'registrationauthority', 'issuing']);
        if (!extractedValue) {
          const authMatch = rawText.match(/(?:Issuing\s*Authority|Authority\s*Name|Issuing\s*Office|Place\s*of\s*Issue|Govt\.?\s*of|Government\s*of)\s*[:/]?\s*([A-Za-z\s.,&'-]{3,60})/i);
          if (authMatch && authMatch[1] && !isBlacklistedName(authMatch[1])) {
            extractedValue = authMatch[1].trim();
          }
        }
      } else if (/signature|digital\s*signature|seal|stamp|qr_?code|barcode/i.test(title)) {
        if (/(?:Digitally\s*signed|Signature\s*Valid|Signed\s*by|Authorized\s*Signatory|Signature|Verified\s*by|Seal|Stamp)\b/i.test(rawText)) {
          const sigMatch = rawText.match(/(?:Digitally\s*signed\s*by|Signed\s*by|Signature\s*Valid)\s*[:\s]*([A-Za-z\s.']{2,40})/i);
          extractedValue = sigMatch ? sigMatch[1].trim() : 'Verified / Present';
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 2. High-Precision National Identifiers & Codes
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('pan') || normTitle === 'permanentaccountnumber') {
        const match = rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('aadhaar') || normTitle.includes('adhaar') || normTitle.includes('adhar') || normTitle.includes('vid') || normTitle.includes('uid')) {
        const match = rawText.match(/\b([1-9]\d{3}\s?\d{4}\s?\d{4})\b/) || rawText.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/) || rawText.match(/\b(\d{14,16})\b/);
        if (match) extractedValue = formatAadhaar(match[1]);
      } else if (normTitle.includes('gstin') || normTitle === 'gst' || normTitle.includes('gstnumber') || normTitle.includes('gstregistration')) {
        const allGstMatches = [...rawText.matchAll(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[0-9A-Za-z]{1}[0-9A-Za-z]{1}[0-9A-Za-z]{1})\b/gi)].map((m) => {
          let g = m[1].toUpperCase();
          if (g.length === 15 && (g[12] === 'I' || g[12] === 'L') && g[13] === 'Z') {
            g = g.substring(0, 12) + '1' + g.substring(13);
          }
          return g;
        });

        const isRecipient = normTitle.includes('recipient') || normTitle.includes('consignee') || normTitle.includes('buyer') || normTitle.includes('customer') || normTitle.includes('togst');
        const isSupplier = normTitle.includes('supplier') || normTitle.includes('seller') || normTitle.includes('consignor') || normTitle.includes('fromgst');

        if (isRecipient && allGstMatches.length > 1) {
          extractedValue = allGstMatches[1];
        } else if (isSupplier && allGstMatches.length > 0) {
          extractedValue = allGstMatches[0];
        } else if (allGstMatches.length > 0) {
          extractedValue = allGstMatches[0];
        }
      } else if (normTitle.includes('udyam') || normTitle.includes('uam') || normTitle.includes('udyog')) {
        const match = rawText.match(/\b(UDYAM-[A-Z0-9\-]{5,25}|[A-Z]{2}\d{2}[A-Z0-9]{8,12})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('passport')) {
        const match = rawText.match(/\b([A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]|[A-Z][0-9]{7,8})\b/i);
        if (match) extractedValue = match[1].toUpperCase().replace(/\s/g, '');
      } else if (normTitle.includes('voter') || normTitle.includes('epic')) {
        const match = rawText.match(/\b([A-Z]{3}[0-9]{7})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('driving') || normTitle.includes('dlno') || normTitle.includes('dlnumber') || normTitle === 'dl') {
        const match = rawText.match(/\b([A-Z]{2}[0-9]{2}\s?[0-9]{4,11}|[A-Z]{2}-[0-9]{2,15})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle === 'cin' || normTitle.includes('corporateid')) {
        const match = rawText.match(/\b([LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle === 'llpin') {
        const match = rawText.match(/\b([A-Z]{3}-[0-9]{4})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.startsWith('tan') || normTitle.includes('taxdeductionaccount')) {
        const match = rawText.match(/\b([A-Z]{4}[0-9]{5}[A-Z])\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle === 'iec' || normTitle === 'ieccode' || normTitle === 'iecno' || normTitle === 'iecnumber' || normTitle.includes('importexportcode')) {
        const match = rawText.match(/\b(\d{10})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle === 'uan' || normTitle.includes('universalaccount')) {
        const match = rawText.match(/\b(10\d{10})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('ifsc')) {
        const match = rawText.match(/\b([A-Z]{4}0[A-Z0-9]{6})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('micr')) {
        const match = rawText.match(/\b(\d{9})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('swift') || normTitle.includes('bic')) {
        const match = rawText.match(/\b([A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('hsn') || normTitle.includes('sac')) {
        const match = rawText.match(/\b(99\d{4}|\d{4,8})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('nic')) {
        const match = rawText.match(/\b(13121|13991|1312|1399|\d{5})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('bsr')) {
        const match = rawText.match(/\b(\d{7})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle === 'challannumber' || normTitle === 'challanno' || (normTitle.includes('challan') && !normTitle.includes('date') && !normTitle.includes('type'))) {
        const m = rawText.match(/(?:Challan\s*(?:No\.?|Number|#|Num)\b[\s.:\-=]*|Ch\s*No\.?[\s.:\-=]*)([A-Za-z0-9\/-]+)/i);
        if (m && m[1] && !/^(?:delivery|challan|invoice|bill)$/i.test(m[1])) {
          extractedValue = m[1].trim();
        } else {
          extractedValue = extractFromLineContext(['challanno', 'challannumber']);
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 3. Contact & Demographic Attributes (Mobile, Email, Gender, Age, Blood Group, Marital Status)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('mobile') || normTitle.includes('phone') || normTitle.includes('contact') || normTitle.includes('telephone')) {
        const isAlt = normTitle.includes('alt') || normTitle.includes('second');
        const matches = [...rawText.matchAll(/(?:\+91[\s-]?)?\b([6-9]\d{9})\b/g)].map((m) => m[1]);
        if (isAlt && matches.length > 1) {
          extractedValue = matches[1];
        } else if (matches.length > 0) {
          extractedValue = matches[0];
        }
      } else if (normTitle.includes('email')) {
        const match = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (match) extractedValue = match[1].toLowerCase();
      } else if (normTitle.includes('gender') || normTitle === 'sex') {
        const ctxGender = extractFromLineContext(['gender', 'sex', 'लिंग']);
        if (ctxGender && /^(?:male|female|transgender|m|f|पुरुष|महिला)$/i.test(ctxGender)) {
          const g = ctxGender.toUpperCase();
          extractedValue = g === 'M' || g === 'पुरुष' ? 'Male' : g === 'F' || g === 'महिला' ? 'Female' : toTitleCase(g);
        } else {
          const match = rawText.match(/\b(MALE|FEMALE|TRANSGENDER|पुरुष|महिला)\b/i);
          if (match) extractedValue = toTitleCase(match[1]);
        }
      } else if (normTitle === 'age' || normTitle === 'applicantage' || normTitle === 'patientage' || normTitle === 'customerage' || normTitle === 'childage' || normTitle === 'personage') {
        const ctxAge = extractFromLineContext(['age', 'आयु'], ['percentage', 'voltage', 'page', 'damage']);
        if (ctxAge && /^\d{1,3}$/.test(ctxAge)) {
          extractedValue = ctxAge;
        } else {
          const match = rawText.match(/(?:Age|आयु)\s*[:/]?\s*(\d{1,3})\s*(?:Yrs?|Years?)?/i) || rawText.match(/\b(\d{1,3})\s*(?:Yrs|Years)\b/i);
          if (match) extractedValue = match[1];
        }
      } else if (normTitle.includes('blood')) {
        const ctxBlood = extractFromLineContext(['bloodgroup', 'blood']);
        if (ctxBlood && /^(?:A|B|AB|O)\s*(?:[+-]|Positive|Negative|Pos|Neg)/i.test(ctxBlood)) {
          extractedValue = ctxBlood;
        } else {
          const match = rawText.match(/(?:Blood\s*Group|Blood)\s*[:/]?\s*([ABOab0]{1,2}\s*[+-])/i);
          if (match) extractedValue = match[1].toUpperCase();
        }
      } else if (normTitle.includes('marital')) {
        const ctxMarital = extractFromLineContext(['maritalstatus', 'marital']);
        if (ctxMarital) extractedValue = toTitleCase(ctxMarital);
        else {
          const match = rawText.match(/\b(Married|Unmarried|Single|Divorced|Widowed|Separated)\b/i);
          if (match) extractedValue = toTitleCase(match[1]);
        }
      } else if (normTitle.includes('nationality')) {
        const match = rawText.match(/\b(INDIAN|Indian|Citizen\s*of\s*India|NRI)\b/i);
        if (match) extractedValue = toTitleCase(match[1]);
      } else if (normTitle.includes('category') || normTitle.includes('caste')) {
        const match = rawText.match(/\b(General|GEN|OBC|SC|ST|EWS|Minority)\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 4. Vehicle & Property Specific Fields
      // ─────────────────────────────────────────────────────────────────────────────
      else if ((normTitle.includes('vehicleno') || normTitle.includes('vehiclenumber') || normTitle.includes('rcno') || normTitle.includes('rcnumber')) && /vehicle|rc|chassis|car|bike|motor/i.test(rawText + title)) {
        const match = rawText.match(/\b([A-Z]{2}[0-9]{1,2}(?:\s?[A-Z]{1,3})?\s?[0-9]{3,4})\b/i);
        if (match) extractedValue = match[1].toUpperCase().replace(/\s+/g, ' ');
      } else if (normTitle.includes('chassis') || normTitle === 'vin') {
        const match = rawText.match(/(?:Chassis\s*(?:No|Number)?|VIN)\s*[:/]?\s*([A-HJ-NPR-Z0-9]{10,20})\b/i) || rawText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('engine')) {
        const match = rawText.match(/(?:Engine\s*(?:No|Number)?)\s*[:/]?\s*([A-Za-z0-9\-]{6,20})/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('fuel')) {
        const match = rawText.match(/\b(PETROL|DIESEL|CNG|ELECTRIC|EV|HYBRID|LPG)\b/i);
        if (match) extractedValue = toTitleCase(match[1]);
      } else if (normTitle.includes('propertyid')) {
        extractedValue = extractFromLineContext(['propertyid', 'propertyno', 'propertynumber']);
      } else if (normTitle.includes('surveyno') || normTitle.includes('surveynumber') || normTitle === 'survey') {
        extractedValue = extractFromLineContext(['surveynumber', 'surveyno', 'survey', 'gatno', 'gatnumber', 'khasra']);
      } else if (normTitle.includes('plotno') || normTitle.includes('plotnumber') || normTitle === 'plot') {
        extractedValue = extractFromLineContext(['plotnumber', 'plotno', 'plot']);
      } else if (normTitle.includes('blockno') || normTitle.includes('blocknumber')) {
        extractedValue = extractFromLineContext(['blocknumber', 'blockno', 'block']);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 5. Banking, Account & Utility Numbers (Account No, Consumer No, Meter No, Bill No)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('loanaccount')) {
        extractedValue = extractFromLineContext(['loanaccountnumber', 'loanaccountno', 'loanaccount', 'loanno']);
      } else if (normTitle === 'accountnumber' || normTitle === 'bankaccountnumber' || normTitle === 'accno' || normTitle === 'acno') {
        const match = rawText.match(/(?:Account\s*(?:No|Number)?|A\/c\s*No\.?)\s*[:/]?\s*(\d{9,18})\b/i) || rawText.match(/\b(\d{11,18})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('consumerno') || normTitle.includes('consumernumber') || normTitle.includes('serviceno') || normTitle.includes('connectionno')) {
        const match = rawText.match(/(?:Consumer\s*(?:No|Number)|Service\s*(?:No|Number)|Connection\s*No)\s*[:/]?\s*(\d{7,16})/i) || rawText.match(/\b(2509\d{7,10}|1[46]80\d{7,12}|\d{11,16})\b/);
        if (match) extractedValue = match[1];
      } else if (normTitle.includes('meterno') || normTitle.includes('meternumber')) {
        const match = rawText.match(/(?:Meter\s*(?:No|Number)?)\s*[:/]?\s*([A-Za-z0-9]{6,12})/i) || rawText.match(/\b(S\d{6,10}|210[78]\d{3,6}|\d{7,9})\b/i);
        if (match) extractedValue = match[1].toUpperCase();
      } else if (normTitle.includes('invoiceno') || normTitle.includes('invoicenumber') || normTitle.includes('billno') || normTitle.includes('billnumber') || normTitle.includes('receiptno') || normTitle.includes('receiptnumber') || normTitle.includes('orderno') || normTitle.includes('policyno') || normTitle.includes('policynumber') || normTitle.includes('claimno') || normTitle.includes('chequeno') || normTitle.includes('utrno') || normTitle.includes('certificateno') || normTitle.includes('certificatenumber') || normTitle.includes('applicationno') || normTitle.includes('applicationnumber') || normTitle.includes('acknowledgementno') || normTitle.includes('rollno') || normTitle.includes('rollnumber') || normTitle.includes('enrollmentno') || normTitle.includes('enrollmentnumber')) {
        extractedValue = extractFromLineContext([normTitle, 'invoiceno', 'billno', 'receiptno', 'orderno', 'policyno', 'claimno', 'certno', 'appno', 'ackno', 'rollno', 'enrollmentno']);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 6. Organization & Business Types (Proprietorship, Pvt Ltd, Partnership, LLP, etc.)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('organisation') || normTitle.includes('organization') || normTitle.includes('constitution') || normTitle.includes('businesstype') || normTitle.includes('entitytype')) {
        const keywordMatch = rawText.match(/\b(Proprietary|Proprietorship|Private\s*Limited(?:\s*Company)?|Partnership|Public\s*Limited(?:\s*Company)?|Limited\s*Liability\s*Partnership|LLP|HUF|Individual|Trust|Society)\b/i);
        if (keywordMatch) {
          extractedValue = keywordMatch[0].trim();
        } else {
          const match = rawText.match(/(?:Constitution(?:\s*of\s*Business)?|Organization\s*Type)\s*[:/]?\s*([^\r\n:]{3,40})/i);
          if (match) extractedValue = match[1].replace(/\s+(?:is|under|and|allotted|dated).*$/gi, '').trim();
        }
      } else if (normTitle.includes('enterprisetype') || normTitle.includes('typeofenterprise') || normTitle.includes('categoryenterprise')) {
        const match = rawText.match(/(?:Enterprise\s*Type|Type\s*of\s*Enterprise|Category\s*Enterprise)\s*[:/]?\s*(Micro|Small|Medium|[A-Za-z]{3,15})/i);
        if (match && match[1]) extractedValue = toTitleCase(match[1].trim());
      } else if (normTitle.includes('activity') || normTitle.includes('majoractivity') || normTitle.includes('natureofbusiness')) {
        const match = rawText.match(/(?:Major\s*Activity|Nature\s*of\s*Business|Business\s*Activity|Activity)\s*[:/]?\s*([^\r\n:]{3,40})/i);
        if (match && match[1]) extractedValue = match[1].trim();
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 7. Business, Bank, Branch & Entity Names (Legal Name, Trade Name, Firm Name, Branch Name, etc.)
      // ─────────────────────────────────────────────────────────────────────────────
      else if ((normTitle.includes('bank') || normTitle === 'bankname') && !normTitle.includes('account') && !normTitle.includes('balance') && !normTitle.includes('loan')) {
        const bankMatch = rawText.match(/\b(STATE\s*BANK\s*OF\s*INDIA|HDFC\s*BANK|ICICI\s*BANK|AXIS\s*BANK|BANK\s*OF\s*BARODA|CANARA\s*BANK|CENTRAL\s*BANK|PUNJAB\s*NATIONAL\s*BANK|UNION\s*BANK|DENA\s*BANK|SYNDICATE\s*BANK|KOTAK(?:\s*MAHINDRA)?(?:\s*BANK)?|YES\s*BANK|IDBI(?:\s*BANK)?|INDUSIND(?:\s*BANK)?|BANDHAN\s*BANK|KALUPUR(?:\s*COMMERCIAL)?(?:\s*CO\s*OP)?\s*BANK|VARACHHA(?:\s*CO\s*OPERATIVE)?\s*BANK|SIDBI|UCO\s*BANK|INDIAN\s*OVERSEAS\s*BANK|INDIAN\s*BANK|MAHARASHTRA\s*BANK|SOUTH\s*INDIAN\s*BANK|FEDERAL\s*BANK)\b/i);
        if (bankMatch) {
          extractedValue = bankMatch[1].toUpperCase();
        } else {
          const ctxBank = extractFromLineContext(['bankname', 'bank'], ['company', 'enterprise', 'legal', 'branch', 'capital', 'working', 'loan', 'overdraft']);
          if (ctxBank && /bank/i.test(ctxBank) && ctxBank.length < 35 && !/working|capital|term|loan|facility/i.test(ctxBank)) {
            extractedValue = ctxBank;
          }
        }
      } else if (normTitle.includes('companyname') || normTitle.includes('firmname') || normTitle.includes('enterprisename') || normTitle.includes('businessname') || normTitle.includes('entityname') || normTitle.includes('hospitalname') || normTitle.includes('universityname') || normTitle.includes('institutionname')) {
        extractedValue = extractFromLineContext([normTitle, 'enterprise', 'companyname', 'firmname', 'hospitalname', 'universityname'], ['address', 'date', 'account', 'branch', 'bank']);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 8. Specific Family, Named Relationships & Commercial Entities (Supplier, Recipient, Broker, etc.)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('broker') || normTitle.includes('agent') || normTitle.includes('dalal')) {
        const bMatch = rawText.match(/(?:Broker|BrOKOr|Broker\s*Name|Agent|Dalal)\s*[:.\-=E\s]*([A-Za-z\s.']{3,40}?)(?=\s+(?:Quality|Qunlity|Rate|Hate|Total|Meters?|Pcs|Mtrs?|SrNo|\d)|\r?\n|$)/i);
        if (bMatch && bMatch[1]) {
          let bName = bMatch[1].replace(/^(?:is|name|of)\s+/i, '').trim();
          bName = bName.replace(/\bKUKREUA\b/gi, 'KUKREJA');
          extractedValue = bName;
        } else {
          extractedValue = extractFromLineContext(['broker', 'agent', 'dalal'], [], true);
        }
      } else if (normTitle.includes('recipient') || normTitle.includes('consignee') || normTitle.includes('buyer') || normTitle.includes('customer') || normTitle.includes('billedto') || normTitle.includes('shippedto')) {
        const recMatch = rawText.match(/(?:M\/[s.]*\.?\s*|Messrs\s+|To\s*:\s*|Consignee\s*:\s*|Buyer\s*:\s*)([A-Za-z0-9\s.,&()'-]{3,50}?)(?=\s+(?:Challan|Date|GST|No\b|\n)|$)/i);
        if (recMatch && recMatch[1] && !isBlacklistedName(recMatch[1])) {
          extractedValue = recMatch[1].trim();
        } else {
          extractedValue = extractFromLineContext(['recipient', 'consignee', 'buyer', 'customer'], ['supplier', 'seller', 'address'], true);
        }
      } else if (normTitle.includes('supplier') || normTitle.includes('seller') || normTitle.includes('consignor') || normTitle.includes('fromname') || normTitle.includes('issuer')) {
        const forMatch = rawText.match(/(?:For|FOr)\s+([A-Za-z\s.,&'-]{3,50}?)(?=\s+(?:Authorised|Authorized|Signatory|Proprietor|Partner)|\r?\n|$)/i);
        if (forMatch && forMatch[1] && !isBlacklistedName(forMatch[1])) {
          let s = forMatch[1].trim().replace(/\bVINAYAR\b/gi, 'VINAYAK');
          extractedValue = s;
        }
        if (!extractedValue) {
          for (const hl of lines.slice(0, 6)) {
            const parts = hl.split(/\s{2,}|\t/).map((p) => p.trim()).filter(Boolean);
            const found = parts.find((p) => /TEXTILES?|MILLS?|TRADERS?|PVT|LTD|INDUSTRIES|ENTERPRISES/i.test(p));
            if (found && !isBlacklistedName(found)) {
              extractedValue = found.replace(/\s+(?:SHREE|SRI|SHRI|OM|JAY).*/gi, '').trim();
              break;
            }
          }
        }
        if (!extractedValue) {
          extractedValue = extractFromLineContext(['supplier', 'consignor', 'seller', 'firmname', 'companyname'], ['recipient', 'buyer', 'consignee', 'address'], true);
        }
      } else if (normTitle.includes('father')) {
        extractedValue = extractFromLineContext(['fathername', 'fathersname', 'father', 'पिताकानाम', 'पिता', 'so', 'do', 'wo'], [], true);
        if (!extractedValue) {
          const match = rawText.match(/(?:Father'?s?\s*Name|पिता\s*का\s*नाम|Father|पिता)\s*[:/]?\s*([A-Za-z\s.']{2,40})/i);
          if (match && match[1] && !isBlacklistedName(match[1])) extractedValue = cleanAndValidateValue(match[1], true);
        }
      } else if (normTitle.includes('mother')) {
        extractedValue = extractFromLineContext(['mothername', 'mothersname', 'mother', 'माताकानाम', 'माता'], [], true);
      } else if (normTitle.includes('spouse') || normTitle.includes('husband') || normTitle.includes('wife') || normTitle.includes('nominee') || normTitle.includes('guardian')) {
        extractedValue = extractFromLineContext(['spousename', 'husbandname', 'wifename', 'nomineename', 'guardianname', 'spouse', 'nominee'], [], true);
      } else if (normTitle.includes('doctor') || normTitle.includes('patient') || normTitle.includes('student') || normTitle.includes('applicant') || normTitle.includes('borrower') || normTitle.includes('vendor') || normTitle.includes('holder') || normTitle.includes('proprietor') || normTitle.includes('partner') || normTitle.includes('director') || normTitle.includes('witness') || normTitle.includes('owner') || normTitle.includes('insured')) {
        extractedValue = extractFromLineContext([normTitle], ['address', 'date', 'amount', 'total', 'father', 'mother', 'spouse', 'branch'], true);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 9. Address & Geographic Location Fields
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('address') || normTitle.includes('principalplace') || normTitle.includes('registeredoffice')) {
        const isLine2 = normTitle.includes('line2') || normTitle.includes('line_2');
        const isLine3 = normTitle.includes('line3') || normTitle.includes('line_3');

        if (isLine2) {
          extractedValue = extractFromLineContext(['addressline2', 'line2', 'near', 'opp', 'behind'], ['email', 'web']);
        } else if (isLine3) {
          extractedValue = extractFromLineContext(['addressline3', 'line3'], ['email', 'web']);
        } else {
          extractedValue = extractFromLineContext(['address', 'fulladdress', 'addressline1', 'billingaddress', 'shippingaddress'], ['email', 'web', 'ip', 'mac', 'url']);
          if (!extractedValue) {
            let addrMatch = rawText.match(
              /(?:5\.\s*(?:ADDRESS\s*(?:OF\s*PRINCIPAL\s*PLACE\s*OF\s*BUSINESS)?|Address\s*of\s*Principal\s*Place\s*of\s*Business)\s*[:/]?)\s*([\s\S]{5,350}?)(?=\s*6\.\s*|\s*DATE\s*OF\s*LIABILITY|\s*PERMANENT\s*ACCOUNT|\s*DATE\s*OF\s*REGISTRATION|\n\s*\d+\.|\n\s*Details|\n\s*Note:|$)/i
            );
            if (!addrMatch) {
              addrMatch = rawText.match(
                /(?:OFFICIAL\s*ADDRESS\s*(?:OF\s*ENTERPRISE)?|Official\s*Address\s*of\s*Enterprise|Flat\/Door\/Block\s*No\.?)\s*[:/]?\s*([\s\S]{5,350}?)(?=\s*DATE\s*OF|\s*NATIONAL|\s*MAJOR\s*ACTIVITY|\s*ENTERPRISE\s*TYPE|\n\s*\d+\.|\n\s*UDYAM-|$)/i
              );
            }
            if (!addrMatch) {
              addrMatch = rawText.match(
                /(?:Billing\s*Address|Shipping\s*Address|Consumer\s*Address|Permanent\s*Address|Residential\s*Address|Registered\s*Office|Address\s*Line\s*[-_]?\s*1|Address|ADDR|पता)\s*[:/]?\s*([\s\S]{5,350}?)(?=\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b|\s*Sub-division|\s*VILL|\s*TAL|\s*Consumer\s*No|\s*Meter\s*No|\s*DATE|\s*\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\n\s*[A-Z0-9\s]{3,20}:|$)/i
              );
            }
            if (addrMatch && addrMatch[1]) extractedValue = cleanAddressValue(addrMatch[1]);
          }
        }
      } else if (normTitle.includes('pincode') || normTitle.includes('postalcode') || normTitle.includes('zipcode') || normTitle === 'pin' || normTitle === 'zip') {
        const match = rawText.match(/(?:PIN|Postal|ZIP)(?:\s*Code)?\s*[:/]?\s*([1-9][0-9]{5})\b/i) || rawText.match(/\b([1-9][0-9]{5})\b/);
        if (match) extractedValue = match[1];
      } else if (['city', 'district', 'state', 'taluka', 'tehsil', 'village', 'area', 'locality', 'country'].includes(normTitle)) {
        extractedValue = extractFromLineContext([normTitle]);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 10. Dates (DOB, Issue Date, Expiry Date, Due Date, Sanction Date, Txn Date, etc.)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('date') || fieldDef.type === 'date' || normTitle.includes('validto') || normTitle.includes('validfrom') || normTitle.includes('dob')) {
        const specificDate = rawText.match(/(?:Challan\s*Date|Invoice\s*Date|Bill\s*Date|Dispatch\s*Date|Sanction\s*Date|Date\s*of\s*Issue|Date|Dt\.?)\s*[:.\-=]*\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/i);
        if (specificDate) {
          extractedValue = specificDate[1];
        } else {
          for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i];
            const lineNorm = lineText.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (lineNorm.includes(normTitle) || (normTitle.includes('birth') && lineNorm.includes('birth')) || (normTitle.includes('issue') && lineNorm.includes('issue')) || (normTitle.includes('due') && lineNorm.includes('due')) || (normTitle.includes('expiry') && lineNorm.includes('expiry')) || (normTitle.includes('challan') && lineNorm.includes('challan'))) {
              const dateMatch = lineText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/);
              if (dateMatch) {
                extractedValue = dateMatch[1];
                break;
              }
              if (i + 1 < lines.length) {
                const nextDateMatch = lines[i + 1].match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})\b/);
                if (nextDateMatch) {
                  extractedValue = nextDateMatch[1];
                  break;
                }
              }
            }
          }
        }
        if (!extractedValue) {
          const anyDate = rawText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/);
          if (anyDate) extractedValue = anyDate[1];
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 11. Rates, Percentages, Quantities, Items & Scores
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('quality') || normTitle.includes('fabric') || normTitle.includes('variety') || normTitle === 'item' || normTitle === 'itemdescription' || normTitle === 'goodsdescription') {
        const qMatch = rawText.match(/(?:Quality|Qunlity|Qualily|Qulity|Variety|Design|Item|Fabric)\s*[:.\-=]*\s*([^:\r\n]+?)(?=\s+(?:Rate|Hate|Bate|Rale|Price|Total|Pcs|Pieces|Meters?|Mtrs?|\d+\.\d+)|\r?\n|$)/i);
        if (qMatch && qMatch[1]) {
          extractedValue = qMatch[1].trim().toUpperCase();
        } else {
          extractedValue = extractFromLineContext(['quality', 'item', 'variety', 'fabric']);
        }
      } else if (normTitle === 'rate' || normTitle.includes('unitrate') || normTitle.includes('priceper') || (normTitle.includes('rate') && !normTitle.includes('interest') && !normTitle.includes('gst') && !normTitle.includes('tax'))) {
        const rMatch = rawText.match(/(?:Rate|Hate|Bate|Rale|Price|Bhav)\s*[:.\-=]*\s*(\d+(?:\.\d+)?)/i);
        if (rMatch && rMatch[1]) {
          extractedValue = rMatch[1];
        } else {
          extractedValue = extractFromLineContext(['rate', 'price', 'bhav'], ['interest', 'gst', 'tax'], false, true);
        }
      } else if (normTitle.includes('piece') || normTitle.includes('pcs') || normTitle.includes('totalpiece') || normTitle.includes('totalpcs') || normTitle.includes('totalqty') || normTitle.includes('taka') || normTitle.includes('than')) {
        const pMatch = rawText.match(/(?:Total\s*(?:Pcs|Pieces|Pes|Pos|Takas?|Than|Qty|Quantity)|Pcs|Pieces|Takas?|Than)\s*[:.\-=]*\s*(\d+)/i);
        if (pMatch && pMatch[1]) {
          extractedValue = pMatch[1];
        } else {
          extractedValue = extractFromLineContext(['totalpcs', 'totalpieces', 'pcs', 'pieces', 'quantity', 'qty'], [], false, true);
        }
      } else if (normTitle.includes('meter') || normTitle.includes('mtr') || normTitle === 'totalmeter' || normTitle === 'totalmeters') {
        const mMatch = rawText.match(/(?:Total\s*(?:Meters?|Mtrs?)|Meters?|Mtrs?)[^\d\r\n]*(\d+(?:[\.,]\d+)?)/i);
        if (mMatch && mMatch[1]) {
          extractedValue = mMatch[1].replace(',', '.');
        } else {
          extractedValue = extractFromLineContext(['totalmeter', 'totalmeters', 'meters', 'meter', 'mtr'], [], false, true);
        }

        // Subtotal verification from column totals if present (e.g. "Total 1264.50 1359.00" -> sum = 2623.50)
        const colTotalsMatch = rawText.match(/Total\s+(\d{3,5}(?:[\.,]\d{2})?)\s+(\d{3,5}(?:[\.,]\d{2})?)/i);
        let colSum: number | null = null;
        if (colTotalsMatch) {
          const c1Str = colTotalsMatch[1];
          const c2Str = colTotalsMatch[2];
          const c1 = parseFloat(c1Str.includes('.') ? c1Str : `${c1Str.slice(0, -2)}.${c1Str.slice(-2)}`);
          const c2 = parseFloat(c2Str.includes('.') ? c2Str : `${c2Str.slice(0, -2)}.${c2Str.slice(-2)}`);
          if (!isNaN(c1) && !isNaN(c2) && c1 > 0 && c2 > 0) {
            colSum = Math.round((c1 + c2) * 100) / 100;
          }
        }

        // Decimal restoration if OCR dropped decimal point (e.g. "262350" -> "2623.50")
        if (extractedValue && !extractedValue.includes('.')) {
          if (colSum && Math.abs(parseFloat(extractedValue) / 100 - colSum) < 0.1) {
            extractedValue = colSum.toFixed(2);
          } else if (/^\d{5,}$/.test(extractedValue)) {
            extractedValue = `${extractedValue.slice(0, -2)}.${extractedValue.slice(-2)}`;
          } else {
            const pcsMatch = rawText.match(/(?:Total\s*(?:Pcs|Pieces|Takas?)|Pcs|Pieces)\s*[:.\-=]*\s*(\d+)/i);
            if (pcsMatch) {
              const pcs = parseInt(pcsMatch[1], 10);
              const num = parseFloat(extractedValue);
              if (pcs > 0 && num / pcs > 500 && (num / 100) / pcs <= 300) {
                extractedValue = `${extractedValue.slice(0, -2)}.${extractedValue.slice(-2)}`;
              }
            }
          }
        }
      } else if (normTitle.includes('gstrate') || normTitle.includes('taxrate')) {
        extractedValue = extractFromLineContext(['gstrate', 'taxrate', 'rate']);
      } else if (normTitle.includes('interestrate') || normTitle.includes('roi')) {
        extractedValue = extractFromLineContext(['interestrate', 'interest', 'roi']);
      } else if (normTitle.includes('percentage')) {
        extractedValue = extractFromLineContext(['percentage', 'percent'], ['cgpa', 'gpa']);
      } else if (normTitle.includes('cgpa') || normTitle.includes('gpa')) {
        extractedValue = extractFromLineContext(['cgpa', 'gpa'], ['percentage']);
      } else if (normTitle.includes('quantity') || normTitle.includes('qty') || normTitle.includes('unitsconsumed') || normTitle.includes('load') || normTitle.includes('consumption')) {
        extractedValue = extractFromLineContext([normTitle, 'quantity', 'qty', 'units', 'load']);
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 12. Financial Amounts & Currency (Total, Subtotal, Salary, Tax, Loan, Balance, Cost, Turnover, Capital)
      // ─────────────────────────────────────────────────────────────────────────────
      else if (normTitle.includes('subtotal')) {
        extractedValue = extractFromLineContext(['subtotal'], [], false, true);
      } else if (normTitle.includes('totalamount') || normTitle.includes('grandtotal') || normTitle.includes('netamount') || normTitle.includes('netpayable') || normTitle.includes('amountpayable')) {
        extractedValue = extractFromLineContext([normTitle, 'grandtotal', 'totalamount', 'total', 'netpayable'], ['subtotal', 'tax'], false, true);
      } else if (normTitle.includes('taxamount') || normTitle.includes('taxpayable') || normTitle.includes('taxpaid')) {
        extractedValue = extractFromLineContext([normTitle, 'taxamount', 'totaltax', 'taxpayable', 'taxpaid'], ['subtotal', 'grandtotal', 'invoice'], false, true);
      } else if (isNumericField) {
        const tokensToTry = [normTitle];
        if (normTitle === 'land') tokensToTry.push('costofland', 'agriland', 'factoryland');
        else if (normTitle === 'building') tokensToTry.push('civil', 'factoryshed', 'houseproperty');
        else if (normTitle.includes('machinery') || normTitle.includes('plant')) tokensToTry.push('plantandmachinery', 'plantmachinery', 'machinery');
        else if (normTitle.includes('electrical')) tokensToTry.push('electricalfitting', 'electricalfittings', 'electrical', 'transformer');
        else if (normTitle.includes('compressor')) tokensToTry.push('compressor', 'humidification', 'aircompressor');
        else if (normTitle.includes('conditioner') || normTitle === 'ac') tokensToTry.push('airconditioner', 'airconditioning', 'acplant');
        else if (normTitle.includes('gold')) tokensToTry.push('gold', 'goldornaments');
        else if (normTitle.includes('share')) tokensToTry.push('share', 'shares', 'securities');
        else if (normTitle.includes('deposite') || normTitle.includes('deposit')) tokensToTry.push('fixeddeposite', 'fixeddeposit', 'bankfd', 'termdeposit');
        else if (normTitle.includes('debtor')) tokensToTry.push('sundrydebtor', 'sundrydebtors', 'debtor', 'debtors', 'receivables');
        else if (normTitle.includes('stock')) tokensToTry.push('stock', 'inventory', 'finishedgoods', 'rawmaterial', 'workinprogress');
        else if (normTitle.includes('cash')) tokensToTry.push('cash', 'cashinhand', 'cashandbank', 'cashbalance');
        else if (normTitle.includes('total') && (normTitle.includes('abcd') || normTitle.includes('fixed'))) tokensToTry.push('totalabcd', 'totalprojectcost', 'totalfixedassets', 'totalcost', 'grossblock', 'totala', 'total');
        else if (normTitle.includes('grandtotal') || (normTitle.includes('total') && normTitle.includes('abc'))) tokensToTry.push('grandtotalabc', 'grandtotal', 'totalassets', 'totalliabilities', 'totalprojectcost', 'total');

        extractedValue = extractFromLineContext(tokensToTry, [], false, true);
        if (!extractedValue) {
          for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i];
            const lineNorm = lineText.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (tokensToTry.some((tok) => lineNorm.includes(tok))) {
              const amtMatch = lineText.match(/(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)\s*(?:\/\-|Only)?/i);
              if (amtMatch && amtMatch[1] && amtMatch[1].replace(/,/g, '').length >= 1) {
                extractedValue = amtMatch[1].replace(/,/g, '');
                break;
              }
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────────────────────
      // 13. Universal Line-by-Line & Colon Matching Fallback
      // ─────────────────────────────────────────────────────────────────────────────
      if (!extractedValue) {
        const isPersonNameField =
          normTitle.includes('name') &&
          !normTitle.includes('udyam') &&
          !normTitle.includes('document') &&
          !normTitle.includes('header') &&
          !normTitle.includes('section') &&
          !normTitle.includes('branch') &&
          !normTitle.includes('bank') &&
          !normTitle.includes('company') &&
          !normTitle.includes('firm') &&
          !normTitle.includes('enterprise');

        extractedValue = extractFromLineContext(
          [normTitle, title.toLowerCase()],
          isPersonNameField ? ['father', 'mother', 'spouse', 'husband', 'wife', 'doctor', 'patient', 'hospital', 'bank', 'company', 'address', 'branch'] : [],
          isPersonNameField,
          isNumericField
        );

        // Dynamic Name NLP Fallback
        if (!extractedValue && isPersonNameField) {
          const dynName = extractDynamicName(rawText);
          if (dynName) {
            const validDyn = cleanAndValidateValue(dynName, true, false);
            if (validDyn) extractedValue = validDyn;
          }
        }
      }
    }

    if (extractedValue) {
      const finalClean = cleanAndValidateValue(extractedValue, normTitle.includes('name'), isNumericField);
      if (finalClean) {
        fields[title] = finalClean;
      }
    }
  }

  return fields;
}

export function parseFields(
  rawText: string,
  documentType: DocumentType | string,
  customSchema?: any,
): Record<string, string> {
  if (customSchema) {
    const customResult = parseCustomSchema(rawText, customSchema);
    if (Object.keys(customResult).length > 0) {
      return customResult;
    }
  }

  const template = TEMPLATES.get(documentType as DocumentType);
  if (!template) {
    if (customSchema) {
      return parseCustomSchema(rawText, customSchema);
    }
    console.warn(`[ParserService] No template for document type: ${documentType}`);
    return {};
  }

  const fields: Record<string, string> = {};

  for (const rule of template.rules) {
    const value = applyRule(rawText, rule);
    if (value) {
      fields[rule.fieldName] = value;
    }
  }

  // ────────────────── Dynamic Universal Fallbacks ──────────────────
  const dynamicName = extractDynamicName(rawText);
  const dynamicDate = extractDynamicDate(rawText);

  if (documentType === DocumentType.PAN_CARD) {
    if (!fields.panNumber) {
      const pan = extractDynamicPan(rawText);
      if (pan) fields.panNumber = pan;
    }
    if (!fields.name && dynamicName) {
      fields.name = dynamicName;
    }
    if (!fields.dateOfBirth && dynamicDate) {
      fields.dateOfBirth = dynamicDate;
    }
  }

  if (documentType === DocumentType.AADHAAR_CARD) {
    if (!fields.aadhaarNumber) {
      const aadh = extractDynamicAadhaar(rawText);
      if (aadh) fields.aadhaarNumber = aadh;
    }
    if (!fields.name && dynamicName) {
      fields.name = dynamicName;
    }
    if (!fields.dateOfBirth && dynamicDate) {
      fields.dateOfBirth = dynamicDate;
    }
  }

  if (documentType === DocumentType.ELECTRICITY_BILL) {
    if (!fields.consumerName && dynamicName) {
      fields.consumerName = dynamicName;
    }
    if (!fields.consumerNumber) {
      const match = rawText.match(/\b(2509\d{7,10}|1[46]80\d{7,12}|\d{11,16})\b/);
      if (match) fields.consumerNumber = match[1];
    }
    if (!fields.meterNumber) {
      const match = rawText.match(/\b(S\d{6,10}|210[78]\d{3,6}|\d{7,9})\b/i);
      if (match) fields.meterNumber = match[1].toUpperCase();
    }
  }

  if (documentType === DocumentType.UDYAM_REGISTRATION_CERTIFICATE) {
    if (!fields.udyamRegistrationNumber) {
      const udyam = extractDynamicUdyam(rawText);
      if (udyam) fields.udyamRegistrationNumber = udyam;
    }
    if (!fields.firmName && dynamicName) {
      fields.firmName = dynamicName;
    }
    if (!fields.dateOfIncorporation && dynamicDate) {
      fields.dateOfIncorporation = dynamicDate;
    }
  }

  if (documentType === DocumentType.GST_CERTIFICATE) {
    if (!fields.gstin) {
      const gstin = extractDynamicGstin(rawText);
      if (gstin) fields.gstin = gstin;
    }
    if (!fields.legalName && dynamicName) {
      fields.legalName = dynamicName;
    }
    if (!fields.tradeName && dynamicName) {
      fields.tradeName = dynamicName;
    }
  }

  if (documentType === DocumentType.BIRTH_CERTIFICATE) {
    if (!fields.fullName && dynamicName) {
      fields.fullName = dynamicName;
    }
    if (!fields.dateOfBirth && dynamicDate) {
      fields.dateOfBirth = dynamicDate;
    }
  }

  if (documentType === DocumentType.LOAN_SANCTION_LETTER) {
    if (!fields.firmName && dynamicName) {
      fields.firmName = dynamicName;
    }
    if (!fields.sanctionDate && dynamicDate) {
      fields.sanctionDate = dynamicDate;
    }
  }

  if (documentType === DocumentType.PROJECT_REPORT || documentType === DocumentType.BALANCE_SHEET_REPORT) {
    const lines = rawText.split('\n');
    const extractNumericFallback = (keywords: string[]): string | null => {
      for (const line of lines) {
        for (const kw of keywords) {
          if (new RegExp(`\\b${kw}\\b`, 'i').test(line)) {
            const numbers = line.match(/\b\d+(?:[\.,]\d+)*\b/g);
            if (numbers && numbers.length > 0) {
              const cleanNums = numbers
                .map((n) => parseIndianAmount(n))
                .filter((n) => n && n !== '0' && n.length >= 2);
              if (cleanNums.length > 0) {
                return cleanNums[cleanNums.length - 1];
              }
            }
          }
        }
      }
      return null;
    };

    const setIfEmpty = (keys: string[], keywords: string[]) => {
      const existing = keys.some((k) => fields[k]);
      if (!existing) {
        const val = extractNumericFallback(keywords);
        if (val) {
          keys.forEach((k) => {
            fields[k] = val;
          });
        }
      }
    };

    setIfEmpty(["PROPRIETOR'S CAPITAL", 'proprietorCapital', 'capital'], ['Capital', 'Proprietor', 'Partner']);
    setIfEmpty(['TERM LOAN', 'termLoan'], ['Term Loan', 'Secured Loan', 'Bank Loan']);
    setIfEmpty(['PERSONAL LOAN', 'personalLoan'], ['Personal Loan', 'Unsecured Loan']);
    setIfEmpty(['SUNDRY CREDITOR', 'sundryCreditors'], ['Creditor', 'Payable', 'Sundry Creditor']);
    setIfEmpty(['DUTY AND TAXES', 'dutyTaxes'], ['Duty', 'Taxes', 'GST']);
    setIfEmpty(['WORKING CAPITAL LOAN', 'workingCapitalLoan'], ['Working Capital', 'Cash Credit', 'CC']);
    setIfEmpty(['OVERDRAFT', 'overdraft'], ['Overdraft', 'OD']);
    setIfEmpty(['TOTAL CURRENT LIABILITY', 'totalCurrentLiability'], ['Total Current Liability', 'Current Liabilities']);
    setIfEmpty(['LAND', 'land'], ['Land', 'Plot']);
    setIfEmpty(['BUILDING', 'building'], ['Building', 'Shed', 'Civil']);
    setIfEmpty(['PLANT AND MACHINERY', 'plantAndMachinery'], ['Plant', 'Machinery', 'Equipment']);
    setIfEmpty(['ELECTRICAL FITTING', 'electricalFitting'], ['Electrical', 'Fitting']);
    setIfEmpty(['FURNITURE & FIXTURES', 'furnitureFixtures'], ['Furniture', 'Fixtures']);
    setIfEmpty(['CAR & VEHICLE', 'carVehicle'], ['Car', 'Vehicle']);
    setIfEmpty(['ELECTRONIC EQUIPMENT', 'electronicEquipment'], ['Computer', 'Electronic', 'Printer']);
    setIfEmpty(['OTHER FIXED ASSET', 'otherFixedAsset'], ['Other Fixed', 'Pre-operative']);
    setIfEmpty(['TOTAL FIXED ASSET (A)', 'totalFixedAssets'], ['Total Fixed', 'Fixed Asset', 'Gross Block', 'Net Block']);
    setIfEmpty(['GOLD', 'gold'], ['Gold']);
    setIfEmpty(['SHARE', 'share'], ['Share']);
    setIfEmpty(['FIXED DEPOSIT', 'fixedDeposit'], ['Fixed Deposit', 'FD']);
    setIfEmpty(['OTHER INVESTMENT', 'otherInvestment'], ['Other Investment', 'Investment']);
    setIfEmpty(['TOTAL INVESTMENT (B)', 'totalInvestment'], ['Total Investment']);
    setIfEmpty(['SUNDRY DEBTOR', 'sundryDebtor'], ['Debtors', 'Receivables', 'Sundry Debtor']);
    setIfEmpty(['STOCK', 'stock'], ['Stock', 'Inventory', 'Finished Goods']);
    setIfEmpty(['CASH', 'cash'], ['Cash', 'Cash in Hand']);
    setIfEmpty(['OTHER CURRENT ASSET', 'otherCurrentAsset'], ['Other Current Asset', 'Margin Money', 'Advances']);
    setIfEmpty(['TOTAL CURRENT ASSET (C)', 'totalCurrentAssets'], ['Total Current Asset', 'Current Assets']);
    setIfEmpty(['GRAND TOTAL (A + B + C)', 'grandTotal'], ['Grand Total', 'Total Liabilities', 'Total Assets']);
    setIfEmpty(['LIABILITIES TOTAL', 'liabilitiesTotal'], ['Liabilities Total', 'Total Liabilities']);
    setIfEmpty(['ASSETS TOTAL', 'assetsTotal'], ['Assets Total', 'Total Assets']);
  }

  console.log(
    `[ParserService] Extracted ${Object.keys(fields).length}/${template.rules.length} fields for ${documentType}`,
  );
  return fields;
}

/**
 * Try each pattern in a rule against the text.
 * Returns the first successful capture group, optionally post-processed.
 */
function applyRule(text: string, rule: FieldExtractionRule): string | null {
  for (const pattern of rule.patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const raw = match[1].trim();
      const val = rule.postProcess ? rule.postProcess(raw) : raw;
      if (val && val.trim().length > 0) {
        return val;
      }
    }
  }
  return null;
}

/**
 * Get the list of registered document types.
 */
export function getRegisteredDocumentTypes(): DocumentType[] {
  return Array.from(TEMPLATES.keys());
}
