/**
 * Upload Routes
 * =============
 */

const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const { extractTextFromPdf, chunkPages, UPLOAD_DIR } = require("../services/pdfProcessor");

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted"));
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/upload
router.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  const { subject, grade } = req.body;
  const filePath = req.file.path;

  try {
    const { pages, totalPages } = await extractTextFromPdf(filePath);
    const chunks = chunkPages(pages);

    const textbook = await prisma.textbook.create({
      data: {
        filename: req.file.originalname,
        subject: subject || null,
        grade: grade || null,
        totalPages,
        totalChunks: chunks.length,
        filePath,
      },
    });

    await prisma.textChunk.createMany({
      data: chunks.map((c) => ({
        textbookId: textbook.id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        chapter: c.chapter || null,
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
router.get("/textbooks", async (req, res) => {
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

module.exports = router;
