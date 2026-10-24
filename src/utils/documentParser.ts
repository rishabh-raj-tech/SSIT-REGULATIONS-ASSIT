import * as pdfjsLib from "pdfjs-dist";
import type { DocumentPage } from "../types/rag";

// Configure pdfjs worker using CDN for reliable browser execution
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Could not set PDF worker URL", e);
}

/**
 * Extracts text from a PDF file page by page
 */
export async function extractTextFromPdf(file: File): Promise<DocumentPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: DocumentPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber: i,
      text: pageText || `[Page ${i} contains no extractable text]`,
    });
  }

  return pages;
}

/**
 * Parses a plain text or markdown file, splitting by page delimiters or roughly 300 words per page
 */
export async function extractTextFromTxt(file: File): Promise<DocumentPage[]> {
  const content = await file.text();
  return parseRawTextToPages(content);
}

/**
 * Converts a raw string (e.g. pasted text or imported text) into page objects
 */
export function parseRawTextToPages(rawText: string): DocumentPage[] {
  // Check for explicit page break markers like "--- Page 2 ---" or "\f" (form feed) or "Page 2:"
  const formFeedSplit = rawText.split(/\f|\n---+\s*(?:Page\s*\d+|break)?\s*---+\n/i);
  if (formFeedSplit.length > 1) {
    return formFeedSplit.map((text, idx) => ({
      pageNumber: idx + 1,
      text: text.trim(),
    })).filter((p) => p.text.length > 0);
  }

  // If no explicit page breaks, break by double line breaks or chunk roughly every 250-300 words
  const words = rawText.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 350) {
    return [{ pageNumber: 1, text: rawText.trim() }];
  }

  const wordsPerPage = 220;
  const pages: DocumentPage[] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    const slice = words.slice(i, i + wordsPerPage);
    pages.push({
      pageNumber: pages.length + 1,
      text: slice.join(" "),
    });
  }

  return pages;
}
