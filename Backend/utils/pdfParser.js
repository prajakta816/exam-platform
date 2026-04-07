/*import fs from "fs";
import * as pdfParse from "pdf-parse"; // ✅ FIXED

export const extractTextFromPDF = async (path) => {
  const buffer = fs.readFileSync(path);

  const data = await pdfParse.default(buffer); // ✅ FIXED

  return data.text;
};*/
import fs from "fs";

// ✅ FIX: use dynamic import (works perfectly in Node v22)
export const extractTextFromPDF = async (path) => {
  const pdf = await import("pdf-parse");

  const buffer = fs.readFileSync(path);
  const data = await pdf.default(buffer);

  return data.text;
};