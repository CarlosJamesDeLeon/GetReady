import * as pdfParse from "pdf-parse";

async function run() {
  console.log("typeof pdfParse:", typeof pdfParse);
  console.log(typeof pdfParse.PDFParse);
  console.log(Object.keys(pdfParse.PDFParse));
}
run();
