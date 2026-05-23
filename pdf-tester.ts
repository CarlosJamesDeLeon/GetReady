import fs from "fs";
import * as pdfParseModule from "pdf-parse";

async function run() {
    const pdfParse = typeof pdfParseModule === "function" 
        ? pdfParseModule 
        : ((pdfParseModule as any).default || (pdfParseModule as any).PDFParse || pdfParseModule);
    console.log("pdfParse function:", typeof pdfParse);
}

run();
