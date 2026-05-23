import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

async function run() {
  try {
    const buffer = new Uint8Array(Buffer.from("%PDF-1.4\n%EOF"));
    const parser = new pdfParse.PDFParse(buffer);
    const data = await parser.getText();
    console.log("Success:", data.text);
  } catch (e) {
    console.error("PDF_ERROR:", e);
  }
}
run();
