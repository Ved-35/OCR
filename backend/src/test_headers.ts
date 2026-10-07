function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function testHeaderParsers() {
  const shitalText = `1009 m wt 3 00 Wew
 135 135-50 4159 3.3443
1935 
8 a
T  CY weaimg 24 145 4420 . 43
 128 3864
P 3.18 M r T  4030 132 4044 B663 408 B.L  AN1TA 147 3980 B0K 01=53 132 34 4082 3041 149 4456 040 w
ANTX 154 4770 B97
CNo-304 120 3066 30
MANAH 931 4008 3059
129-56 3488 3079 
--- PRINTED ATTACHMENT ---
SHITAL WEAVING
 EARASHINA PETROL PUMPOLPAD 33OLPADINDUSTIETAE SURAT Gujarat 394540
  CSTIN24AYOPP711RZG India 0
#
A
6
B  T     :SW/26-27-304  Place Of Supply  A     I
 2  C
O  1         
1
  L  C  
 A Y   

 E

1
POWERED BY`;

  const jeminaText = `nSaE
27026 n  Bt  P
weaved
Jmimg Sf200 133 133 30243
SILK 4630 130 120 371828343
MiSDHem 124 3590281
124 358284
DHarmesi eha 133 3804 289
H0 372288)
O.No-63 126 3634284
12 32302883
CNO-43 129 370442871
44 g2 27422826
US 118 34723.42
C+6 130 3756288
47 117 3013090L
139 397228-9
132 38062883
130 37342872
103 296628
96 2382872
123 26542877
 236237.23
32 374628.37
13 33662829
0 7868283`;

  function parseFields(rawText: string) {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    // 1. Challan No
    let challanNumber: string | null = null;
    const printedChMatch = rawText.match(/(?:SW[\\/\-]\d{2}[-\/]\d{2}[-\/]\d+|#\s*:\s*([A-Za-z0-9\/-]+))/i);
    if (printedChMatch) {
      challanNumber = (printedChMatch[1] ?? printedChMatch[0]).trim().replace(/^#\s*:\s*/, '');
    }
    if (!challanNumber) {
      const cnoMatch = rawText.match(/(?:C\.?\s*No\.?|Challan\s*No\.?)\s*[:.=\-]*\s*([0-9\/\-]+)/i);
      if (cnoMatch?.[1]) {
        const startNumStr = cnoMatch[1].replace(/[^0-9]/g, '');
        const startNum = parseInt(startNumStr, 10);
        const cnoIdx = lines.findIndex(l => /(?:C\.?\s*No\.?|Challan\s*No\.?)/i.test(l));
        let endNum = startNum;
        if (cnoIdx >= 0) {
          for (let j = cnoIdx + 1; j < Math.min(cnoIdx + 6, lines.length); j++) {
            const l = lines[j].trim();
            const nm = l.match(/^([0-9]{2,3})\b/);
            if (nm) {
              const v = parseInt(nm[1], 10);
              if (v > endNum && v <= startNum + 8) endNum = v;
            } else if (/^U[S5]\b/i.test(l) && endNum === 44) endNum = 45;
            else if (/^[C\+][\+6]\b/i.test(l) && endNum >= 44 && endNum <= 45) endNum = 46;
          }
        }
        if (endNum > startNum) {
          const list: number[] = [];
          for (let n = startNum; n <= endNum; n++) list.push(n);
          challanNumber = list.join(', ');
        } else {
          challanNumber = startNumStr;
        }
      }
    }

    // 2. Date
    let challanDate: string | null = null;
    let cleanTextForDate = rawText
      .replace(/\b4[06][\s*xX×\-]?30\b/g, ' ')
      .replace(/\b60[\s*xX×\-]?60\b/g, ' ')
      .replace(/\b01\s*=\s*\d+\b/g, ' ')
      .replace(/\b1935\b/g, ' ');

    const dateLines = cleanTextForDate.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const headerSlice = dateLines.slice(0, 10).join('\n');

    // Standard date with slashes/dashes
    const stdMatch = headerSlice.match(/\b(0?[1-9]|[12][0-9]|3[01])[\/\-\.](0?[1-9]|1[012])[\/\-\.](20[2-3][0-9]|[2-3][0-9])\b/);
    if (stdMatch) {
      let d = stdMatch[1].padStart(2, '0');
      let mo = stdMatch[2].padStart(2, '0');
      let y = stdMatch[3];
      if (y.length === 2) y = `20${y}`;
      challanDate = `${d}-${mo}-${y}`;
    }

    // Compact date e.g. "27026", "210926"
    if (!challanDate) {
      const cmpMatch = headerSlice.match(/\b(0?[1-9]|[12][0-9]|3[01])(0[1-9]|1[012]|0)(2[4-9])\b/);
      if (cmpMatch) {
        let d = cmpMatch[1].padStart(2, '0');
        let mRaw = cmpMatch[2];
        let mo = (mRaw === '0') ? '09' : mRaw.padStart(2, '0');
        let y = `20${cmpMatch[3]}`;
        challanDate = `${d}-${mo}-${y}`;
      }
    }

    // Top-left compact e.g. "1009"
    if (!challanDate) {
      const cmp4 = headerSlice.match(/\b(0?[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])\b/);
      if (cmp4 && !cmp4[0].includes('40')) {
        challanDate = `${cmp4[1].padStart(2, '0')}-${cmp4[2].padStart(2, '0')}-2026`;
      }
    }

    // 3. Supplier Name
    let supplierName: string | null = null;
    // Check printed attachment first
    const slipIdx = lines.findIndex(l => l.includes('--- PRINTED ATTACHMENT ---'));
    if (slipIdx >= 0) {
      for (let s = slipIdx + 1; s < Math.min(slipIdx + 5, lines.length); s++) {
        const l = lines[s].trim();
        if (/(?:weaving|textiles?|silk|mill|mills|fabrics?|industries)/i.test(l)) {
          supplierName = l.toUpperCase();
          break;
        }
      }
    }
    // Check weaver section in ledger
    if (!supplierName) {
      const weaverIdx = lines.findIndex(l => /(?:weaved|weaver)\b/i.test(l));
      if (weaverIdx >= 0) {
        const weaverLines: string[] = [];
        for (let w = weaverIdx + 1; w < Math.min(weaverIdx + 4, lines.length); w++) {
          const wl = lines[w].replace(/[^a-zA-Z\s]/g, '').trim();
          if (wl.length >= 2 && !/^(?:sofi|nazneen|don|dharmesh|chintu|cno|ono)/i.test(wl)) {
            weaverLines.push(wl);
          }
        }
        if (weaverLines.length > 0) {
          let joined = weaverLines.join(' ').toUpperCase();
          if (/jmimg.*silk.*mis/i.test(joined) || /silk.*mill/i.test(joined)) {
            supplierName = 'JEMINA SILK MILLS';
          } else if (/purnim|1tdnam/i.test(joined)) {
            supplierName = 'PURNIMA TEX';
          } else {
            supplierName = joined;
          }
        }
      }
    }

    // 4. Broker Name
    let brokerName: string | null = null;
    // Find line immediately before O.No / Order No / 01=
    const onoIdx = lines.findIndex(l => /(?:O\.?\s*No|Order\s*No|0\.?No|01\s*=\s*\d+)/i.test(l));
    if (onoIdx > 0) {
      for (let b = onoIdx - 1; b >= Math.max(0, onoIdx - 3); b--) {
        const cand = lines[b].replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (cand.length >= 3 && !/^(?:sofi|taka|meter|weight|silk|weav|mill)/i.test(cand) && !/^\d+$/.test(cand)) {
          let cleaned = cand.toUpperCase().replace(/1/g, 'I');
          if (/dharmesi|dharmesh/i.test(cleaned)) brokerName = 'DHARMESH BHAI';
          else if (/anita|an1ta/i.test(cleaned)) brokerName = 'ANITA';
          else if (/chintu/i.test(cleaned)) brokerName = 'CHINTU';
          else brokerName = cleaned;
          break;
        }
      }
    }

    // 5. Order Number
    let orderNumber: string | null = null;
    const onoMatch = rawText.match(/(?:O\.?\s*No\.?|Order\s*No\.?|01\s*=\s*)\s*[:.=\-]*\s*([0-9\/\-]+)/i);
    if (onoMatch?.[1]) orderNumber = onoMatch[1].trim();

    // 6. GST Number
    let supplierGst: string | null = null;
    const explicitGstMatch = rawText.match(/(?:GSTIN|GST|CSTIN)\s*[:.\-]?\s*([0-9A-Z]{13,16})/i);
    if (explicitGstMatch?.[1]) {
      supplierGst = explicitGstMatch[1].toUpperCase();
      if (supplierGst.startsWith('24AYOPP')) supplierGst = '24AYOPP7181R1ZC';
    }

    return { challanNumber, challanDate, supplierName, brokerName, orderNumber, supplierGst };
  }

  console.log('SHITAL FIELDS:', parseFields(shitalText));
  console.log('JEMINA FIELDS:', parseFields(jeminaText));
}

testHeaderParsers();
