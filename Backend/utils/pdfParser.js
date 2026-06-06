import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extracts all text from a PDF file using pdfjs-dist.
 * Works reliably on Node.js v22+ with ESM.
 */
export const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const uint8 = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({ data: uint8 });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return fullText;
};