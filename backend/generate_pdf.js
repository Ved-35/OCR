const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createProjectReportPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const page = pdfDoc.addPage([595, 842]); // A4 Size
  const { width, height } = page.getSize();

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(0.15, 0.23, 0.38), // Dark Blue
  });

  page.drawText('PROJECT COST & FINANCIAL REPORT', {
    x: 40,
    y: height - 48,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('CONFIDENTIAL FINANCIAL SCRUTINY DOCUMENT', {
    x: 40,
    y: height - 66,
    size: 9,
    font: fontRegular,
    color: rgb(0.7, 0.8, 0.95),
  });

  // Project Info Box
  page.drawRectangle({
    x: 40,
    y: height - 165,
    width: width - 80,
    height: 70,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.8, 0.88, 0.98),
    borderWidth: 1,
  });

  page.drawText('Project Name: Manufacturing Unit Expansion', { x: 55, y: height - 115, size: 11, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('Applicant: Kunj Patel / Shah Consultancy', { x: 55, y: height - 132, size: 10, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });
  page.drawText('Document ID: PR-2026-8841', { x: 55, y: height - 149, size: 10, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });

  page.drawText('Date: 10/08/2026', { x: 380, y: height - 115, size: 10, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });
  page.drawText('Status: Pending Scrutiny', { x: 380, y: height - 132, size: 10, font: fontBold, color: rgb(0.85, 0.4, 0.0) });

  // Section 1: Cost of Project - Fixed Assets
  let currentY = height - 200;

  page.drawText('1. COST OF PROJECT - FIXED ASSETS (A)', {
    x: 40,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.15, 0.23, 0.38),
  });

  currentY -= 20;

  // Table Header
  page.drawRectangle({
    x: 40,
    y: currentY - 18,
    width: width - 80,
    height: 24,
    color: rgb(0.9, 0.93, 0.96),
  });

  page.drawText('Particulars / Asset Item', { x: 50, y: currentY - 10, size: 10, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText('Amount (in INR)', { x: 420, y: currentY - 10, size: 10, font: fontBold, color: rgb(0.2, 0.25, 0.35) });

  currentY -= 24;

  const fixedAssets = [
    { name: 'LAND & SITE DEVELOPMENT', amount: '15,00,000' },
    { name: 'PLANT AND MACHINERY', amount: '25,50,000' },
    { name: 'BUILDING CONSTRUCTION', amount: '12,00,000' },
    { name: 'ELECTRICAL FITTING', amount: '2,50,000' },
    { name: 'AIR COMPRESSOR', amount: '1,00,000' },
    { name: 'AIR CONDITIONER & HVAC', amount: '1,50,000' },
    { name: 'OTHER FIXED ASSET', amount: '2,00,000' },
  ];

  fixedAssets.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1);
    page.drawRectangle({ x: 40, y: currentY - 16, width: width - 80, height: 20, color: rowBg });

    page.drawText(item.name, { x: 50, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Rs. ${item.amount}`, { x: 420, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 20;
  });

  // Total Fixed Assets
  page.drawRectangle({ x: 40, y: currentY - 18, width: width - 80, height: 22, color: rgb(0.88, 0.93, 1.0) });
  page.drawText('TOTAL FIXED ASSETS (A)', { x: 50, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('Rs. 59,50,000', { x: 420, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });

  currentY -= 40;

  // Section 2: Investments (B)
  page.drawText('2. INVESTMENTS & DEPOSITS (B)', {
    x: 40,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.15, 0.23, 0.38),
  });

  currentY -= 20;

  const investments = [
    { name: 'GOLD & BULLION', amount: '5,00,000' },
    { name: 'EQUITY SHARES & MUTUAL FUNDS', amount: '3,00,000' },
    { name: 'FIXED DEPOSIT WITH BANK', amount: '10,00,000' },
  ];

  investments.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1);
    page.drawRectangle({ x: 40, y: currentY - 16, width: width - 80, height: 20, color: rowBg });

    page.drawText(item.name, { x: 50, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Rs. ${item.amount}`, { x: 420, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 20;
  });

  page.drawRectangle({ x: 40, y: currentY - 18, width: width - 80, height: 22, color: rgb(0.88, 0.93, 1.0) });
  page.drawText('TOTAL INVESTMENT (B)', { x: 50, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('Rs. 18,00,000', { x: 420, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });

  currentY -= 40;

  // Section 3: Current Assets (C)
  page.drawText('3. WORKING CAPITAL & CURRENT ASSETS (C)', {
    x: 40,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.15, 0.23, 0.38),
  });

  currentY -= 20;

  const currentAssets = [
    { name: 'SUNDRY DEBTORS', amount: '4,00,000' },
    { name: 'RAW MATERIAL & FINISHED STOCK', amount: '8,00,000' },
    { name: 'CASH IN HAND', amount: '1,50,000' },
    { name: 'BANK BALANCE', amount: '6,00,000' },
    { name: 'OTHER CURRENT ASSET', amount: '1,00,000' },
  ];

  currentAssets.forEach((item, idx) => {
    const rowBg = idx % 2 === 0 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1);
    page.drawRectangle({ x: 40, y: currentY - 16, width: width - 80, height: 20, color: rowBg });

    page.drawText(item.name, { x: 50, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Rs. ${item.amount}`, { x: 420, y: currentY - 12, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    currentY -= 20;
  });

  page.drawRectangle({ x: 40, y: currentY - 18, width: width - 80, height: 22, color: rgb(0.88, 0.93, 1.0) });
  page.drawText('TOTAL CURRENT ASSETS (C)', { x: 50, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText('Rs. 20,50,000', { x: 420, y: currentY - 12, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.5) });

  currentY -= 40;

  // Grand Total Banner
  page.drawRectangle({
    x: 40,
    y: currentY - 24,
    width: width - 80,
    height: 32,
    color: rgb(0.15, 0.55, 0.3),
  });

  page.drawText('GRAND TOTAL PROJECT COST (A + B + C)', { x: 50, y: currentY - 14, size: 12, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Rs. 98,00,000', { x: 420, y: currentY - 14, size: 13, font: fontBold, color: rgb(1, 1, 1) });

  // Footer
  page.drawLine({ start: { x: 40, y: 40 }, end: { x: width - 40, y: 40 }, color: rgb(0.8, 0.8, 0.8), thickness: 1 });
  page.drawText('Page 1 of 1  |  Shah Consultancy Project Verification Portal', { x: 40, y: 25, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '../frontend/public/docs/project_report_sample.pdf');
  
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`PDF successfully generated at: ${outputPath}`);
}

createProjectReportPdf().catch(console.error);
