/**
 * PDF Processor Service
 * =====================
 */

const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const CHAPTER_PATTERNS = [
  /^chapter\s+\d+/i,
  /^unit\s+\d+/i,
  /^lesson\s+\d+/i,
  /^\d+\.\s+[A-Z]/,
];

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || "400", 10);
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || "50", 10);

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function detectChapter(text) {
  const firstLine = text.trim().split("\n")[0].trim();
  const match = CHAPTER_PATTERNS.some((p) => p.test(firstLine));
  return match ? firstLine.slice(0, 100) : null;
}

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);

  const rawText = data.text;
  const totalPages = data.numpages;

  const pageTexts = rawText.split(/\f/).filter((t) => t.trim().length > 0);
  const pages = pageTexts.map((text, i) => ({
    page: i + 1,
    text: text.trim(),
  }));

  return { pages, totalPages };
}

function chunkPages(pages) {
  const chunks = [];
  let chunkIndex = 0;
  let currentChapter = null;

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

module.exports = { extractTextFromPdf, chunkPages, UPLOAD_DIR };
