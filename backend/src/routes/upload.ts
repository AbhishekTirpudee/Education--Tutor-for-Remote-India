/**
 * Upload Routes
 * =============
 * POST /api/upload — Upload a PDF textbook, extract chunks, store in SQLite
 * GET  /api/textbooks — List all uploaded textbooks
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { extractTextFromPdf, chunkPages, UPLOAD_DIR } from "../services/pdfProcessor";

const router = Router();
const prisma = new PrismaClient();

// Multer config — store to disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted"));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/upload
router.post("/upload", upload.single("pdf"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  const { subject, grade } = req.body as { subject?: string; grade?: string };
  const filePath = req.file.path;

  try {
    // Extract + chunk the PDF
    const { pages, totalPages } = await extractTextFromPdf(filePath);
    const chunks = chunkPages(pages);

    // Persist textbook record
    const textbook = await prisma.textbook.create({
      data: {
        filename: req.file.originalname,
        subject: subject ?? null,
        grade: grade ?? null,
        totalPages,
        totalChunks: chunks.length,
        filePath,
      },
    });

    // Persist all chunks (batch insert)
    await prisma.textChunk.createMany({
      data: chunks.map((c) => ({
        textbookId: textbook.id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        chapter: c.chapter ?? null,
        content: c.content,
        tokenCount: c.tokenCount,
      })),
    });

    return res.json({
      message: "Textbook uploaded and processed successfully",
      textbookId: textbook.id,
      filename: textbook.filename,
      totalPages,
      totalChunks: chunks.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// GET /api/textbooks
router.get("/textbooks", async (_req: Request, res: Response) => {
  try {
    const books = await prisma.textbook.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        subject: true,
        grade: true,
        totalPages: true,
        totalChunks: true,
        createdAt: true,
      },
    });
    return res.json(books);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
