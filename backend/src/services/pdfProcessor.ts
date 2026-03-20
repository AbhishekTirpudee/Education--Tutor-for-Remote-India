/**
 * PDF Processor Service
 * =====================
 * Extracts text from uploaded PDFs and splits into semantic chunks.
 */

import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";

export interface PageData {
  page: number;
  text: string;
}

export interface Chunk {
  chunkIndex: number;
  pageNumber: number;
  chapter: string | null;
  content: string;
  tokenCount: number;
}

const CHAPTER_PATTERNS = [
  /^chapter\s+\d+/i,
  /^unit\s+\d+/i,
  /^lesson\s+\d+/i,
  /^\d+\.\s+[A-Z]/,
];

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "400");
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "50");

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function detectChapter(text: string): string | null {
  const firstLine = text.trim().split("\n")[0].trim();
  return CHAPTER_PATTERNS.some((p) => p.test(firstLine))
    ? firstLine.slice(0, 100)
    : null;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

export async function extractTextFromPdf(filePath: string): Promise<{ pages: PageData[]; totalPages: number }> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  // pdf-parse gives us a single text string; split roughly by page markers
  const rawText = data.text;
  const totalPages = data.numpages;

  // Split by form-feed character (page separator) or approximate
  const pageTexts = rawText.split(/\f/).filter((t: string) => t.trim().length > 0);

  const pages: PageData[] = pageTexts.map((text: string, i: number) => ({
    page: i + 1,
    text: text.trim(),
  }));

  return { pages, totalPages };
}

export function chunkPages(pages: PageData[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let currentChapter: string | null = null;

  for (const { page, text } of pages) {
    const ch = detectChapter(text);
    if (ch) currentChapter = ch;

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + CHUNK_SIZE, text.length);
      const content = text.slice(start, end).trim();
      if (content.length > 30) {
        chunks.push({
          chunkIndex,
          pageNumber: page,
          chapter: currentChapter,
          content,
          tokenCount: estimateTokens(content),
        });
        chunkIndex++;
      }
      start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
  }

  return chunks;
}
