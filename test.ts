import * as pdfParseModule from "pdf-parse";

async function run() {
  const PDFParse = (pdfParseModule as any).PDFParse;
  console.log(typeof PDFParse);
  if (PDFParse) {
      console.log('PDFParse is available');
  }
}
run();


