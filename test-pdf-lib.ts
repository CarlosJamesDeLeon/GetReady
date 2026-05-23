import * as pdfParseModule from "pdf-parse";

function getPdfParse() {
  return typeof pdfParseModule === "function" 
    ? pdfParseModule 
    : ((pdfParseModule as any).default || (pdfParseModule as any).PDFParse || pdfParseModule);
}

async function testPdf() {
  try {
      const func = getPdfParse();
      console.log(typeof func);
      console.log(func.name);
      
      const buffer = Buffer.from("%PDF-1.4\n%EOF", "utf-8"); // fake
      await func(buffer);
  } catch (e) {
    console.error("PDF PARSE ERROR:", e);
  }
}

testPdf();
