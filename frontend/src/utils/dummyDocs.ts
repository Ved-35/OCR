// SVG Document Previews for PAN Card, Aadhaar Card, Electricity Bill, and Project Report

export const getPanCardSvg = (name = 'APPLICANT NAME', fatherName = "APPLICANT'S FATHER NAME", panNo = 'ABCDE1234F', dob = '01/06/1995') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%">
  <defs>
    <linearGradient id="panBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b6d9f7" />
      <stop offset="50%" stop-color="#dceeff" />
      <stop offset="100%" stop-color="#93c5fd" />
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>

  <!-- Card Background -->
  <rect width="600" height="380" rx="20" fill="url(#panBg)" stroke="#2563eb" stroke-width="2"/>
  
  <!-- Header Text -->
  <text x="30" y="45" font-family="sans-serif" font-weight="bold" font-size="20" fill="#1e3a8a">आयकर विभाग</text>
  <text x="30" y="70" font-family="sans-serif" font-weight="bold" font-size="18" fill="#1e293b">INCOME TAX DEPARTMENT</text>

  <text x="430" y="45" font-family="sans-serif" font-weight="bold" font-size="20" fill="#1e3a8a">भारत सरकार</text>
  <text x="430" y="70" font-family="sans-serif" font-weight="bold" font-size="18" fill="#1e293b">GOVT. OF INDIA</text>

  <!-- Emblem Illustration -->
  <g transform="translate(270, 15)">
    <circle cx="30" cy="30" r="25" fill="#1d4ed8" opacity="0.1"/>
    <path d="M30 10 L45 25 L40 45 L20 45 L15 25 Z" fill="#1e3a8a"/>
  </g>

  <!-- Profile Photo Placeholder -->
  <rect x="35" y="95" width="110" height="130" rx="8" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="90" cy="140" r="30" fill="#94a3b8"/>
  <path d="M50 210 C50 180 130 180 130 210" fill="#94a3b8"/>

  <!-- PAN Title & Details -->
  <text x="160" y="105" font-family="sans-serif" font-size="13" fill="#475569">स्थायी लेखा संख्या कार्ड</text>
  <text x="160" y="125" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">Permanent Account Number Card</text>
  <text x="200" y="160" font-family="monospace" font-weight="bold" font-size="28" fill="#0f172a" letter-spacing="3">${panNo}</text>

  <!-- Name -->
  <text x="35" y="250" font-family="sans-serif" font-size="11" fill="#475569">नाम / Name</text>
  <text x="35" y="270" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0f172a">${name}</text>

  <!-- Father's Name -->
  <text x="35" y="295" font-family="sans-serif" font-size="11" fill="#475569">पिता का नाम / Father's Name</text>
  <text x="35" y="315" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0f172a">${fatherName}</text>

  <!-- Date of Birth -->
  <text x="35" y="340" font-family="sans-serif" font-size="11" fill="#475569">जन्म की तारीख / Date of Birth</text>
  <text x="35" y="360" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">${dob}</text>

  <!-- Signature -->
  <text x="210" y="340" font-family="cursive" font-size="20" fill="#1e293b" italic="true">Signature</text>
  <text x="210" y="360" font-family="sans-serif" font-size="11" fill="#64748b">हस्ताक्षर / Signature</text>

  <!-- Mock QR Code -->
  <g transform="translate(420, 150)">
    <rect width="140" height="140" fill="#ffffff" rx="8" stroke="#cbd5e1"/>
    <!-- QR Pixels Mock -->
    <rect x="15" y="15" width="35" height="35" fill="#000"/>
    <rect x="22" y="22" width="21" height="21" fill="#fff"/>
    <rect x="28" y="28" width="9" height="9" fill="#000"/>

    <rect x="90" y="15" width="35" height="35" fill="#000"/>
    <rect x="97" y="22" width="21" height="21" fill="#fff"/>
    <rect x="103" y="28" width="9" height="9" fill="#000"/>

    <rect x="15" y="90" width="35" height="35" fill="#000"/>
    <rect x="22" y="97" width="21" height="21" fill="#fff"/>
    <rect x="28" y="103" width="9" height="9" fill="#000"/>

    <rect x="60" y="20" width="15" height="15" fill="#000"/>
    <rect x="60" y="60" width="25" height="25" fill="#000"/>
    <rect x="90" y="70" width="20" height="20" fill="#000"/>
    <rect x="70" y="100" width="25" height="25" fill="#000"/>
    <rect x="105" y="105" width="15" height="15" fill="#000"/>
  </g>
</svg>
`;

export const getAadhaarCardSvg = (name = 'KUNJ PATEL', aadharNo = '5482 9102 3841', dob = '14/08/1992', gender = 'MALE') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="100%" height="100%">
  <rect width="600" height="380" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Header Bar -->
  <rect width="600" height="60" fill="#ea580c" rx="16 16 0 0"/>
  <text x="30" y="38" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff">भारत सरकार</text>
  <text x="380" y="38" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">GOVERNMENT OF INDIA</text>

  <!-- Photo -->
  <rect x="35" y="85" width="120" height="145" fill="#f1f5f9" rx="6" stroke="#cbd5e1"/>
  <circle cx="95" cy="135" r="32" fill="#94a3b8"/>
  <path d="M50 215 C50 180 140 180 140 215" fill="#94a3b8"/>

  <!-- Info -->
  <text x="180" y="110" font-family="sans-serif" font-weight="bold" font-size="20" fill="#0f172a">${name}</text>
  <text x="180" y="140" font-family="sans-serif" font-size="14" fill="#475569">DOB: ${dob}</text>
  <text x="180" y="165" font-family="sans-serif" font-size="14" fill="#475569">GENDER: ${gender}</text>
  <text x="180" y="190" font-family="sans-serif" font-size="13" fill="#64748b">Address: 102, Shivalik Towers, Satellite, Ahmedabad</text>

  <!-- Aadhaar Number Footer -->
  <line x1="30" y1="260" x2="570" y2="260" stroke="#ea580c" stroke-width="3"/>
  <text x="180" y="310" font-family="monospace" font-weight="bold" font-size="32" fill="#0f172a" letter-spacing="4">${aadharNo}</text>
  <text x="210" y="345" font-family="sans-serif" font-weight="bold" font-size="15" fill="#ea580c">मेरा आधार, मेरी पहचान</text>
</svg>
`;

export const getElectricityBillSvg = (name = 'KUNJ SHAH', consumerNo = '9821034821', meterNo = 'MTR-88219') => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <rect width="600" height="450" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  
  <rect width="600" height="70" fill="#0284c7"/>
  <text x="20" y="45" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ffffff">UGVCL ELECTRICITY BILL</text>
  <text x="430" y="45" font-family="sans-serif" font-size="14" fill="#e0f2fe">Date: 01/08/2026</text>

  <rect x="20" y="90" width="560" height="110" fill="#f0f9ff" rx="8" stroke="#bae6fd"/>
  <text x="40" y="120" font-family="sans-serif" font-weight="bold" font-size="15" fill="#0369a1">Consumer Name: ${name}</text>
  <text x="40" y="145" font-family="sans-serif" font-size="14" fill="#334155">Consumer No: ${consumerNo}</text>
  <text x="40" y="170" font-family="sans-serif" font-size="14" fill="#334155">Meter No: ${meterNo}</text>

  <rect x="20" y="220" width="560" height="180" fill="#fafafa" rx="8" stroke="#e5e5e5"/>
  <text x="40" y="250" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">Bill Summary</text>
  <text x="40" y="285" font-family="sans-serif" font-size="14" fill="#475569">Units Consumed: 342 kWh</text>
  <text x="40" y="315" font-family="sans-serif" font-size="14" fill="#475569">Connection Type: LT Single Phase</text>
  <text x="40" y="345" font-family="sans-serif" font-weight="bold" font-size="18" fill="#16a34a">Total Amount Due: ₹ 2,480.00</text>
</svg>
`;

export const getProjectReportSvg = () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <rect width="600" height="450" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  
  <rect width="600" height="60" fill="#475569"/>
  <text x="20" y="38" font-family="sans-serif" font-weight="bold" font-size="20" fill="#ffffff">PROJECT COST &amp; FINANCIAL REPORT</text>

  <rect x="20" y="80" width="560" height="340" fill="#f8fafc" rx="8" stroke="#e2e8f0"/>
  <text x="40" y="115" font-family="sans-serif" font-weight="bold" font-size="16" fill="#1e293b">COST OF PROJECT - FIXED ASSET SUMMARY</text>

  <!-- Table Header -->
  <rect x="40" y="130" width="520" height="30" fill="#e2e8f0"/>
  <text x="50" y="150" font-family="sans-serif" font-weight="bold" font-size="13" fill="#334155">Asset Category</text>
  <text x="420" y="150" font-family="sans-serif" font-weight="bold" font-size="13" fill="#334155">Amount (₹)</text>

  <text x="50" y="185" font-family="sans-serif" font-size="13" fill="#475569">Land &amp; Site Development</text>
  <text x="420" y="185" font-family="sans-serif" font-size="13" fill="#0f172a">15,00,000</text>

  <text x="50" y="215" font-family="sans-serif" font-size="13" fill="#475569">Plant &amp; Machinery</text>
  <text x="420" y="215" font-family="sans-serif" font-size="13" fill="#0f172a">25,50,000</text>

  <text x="50" y="245" font-family="sans-serif" font-size="13" fill="#475569">Building &amp; Shed</text>
  <text x="420" y="245" font-family="sans-serif" font-size="13" fill="#0f172a">12,00,000</text>

  <text x="50" y="275" font-family="sans-serif" font-size="13" fill="#475569">Electrical Fitting &amp; AC</text>
  <text x="420" y="275" font-family="sans-serif" font-size="13" fill="#0f172a">3,50,000</text>

  <line x1="40" y1="300" x2="560" y2="300" stroke="#cbd5e1" stroke-width="2"/>

  <text x="50" y="330" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">TOTAL FIXED ASSETS</text>
  <text x="420" y="330" font-family="sans-serif" font-weight="bold" font-size="15" fill="#2563eb">₹ 56,00,000</text>
</svg>
`;
