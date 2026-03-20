const prisma = require("../models/db");
const { extractTextFromPdf, chunkPages } = require("../services/pdfProcessor");

// @desc    Upload a textbook PDF, extract semantics, and save to DB
// @route   POST /api/upload
// @access  Public
const uploadTextbook = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  const { subject, grade } = req.body;
  const filePath = req.file.path;

  try {
    // Service call to process PDF
    const { pages, totalPages } = await extractTextFromPdf(filePath);
    const chunks = chunkPages(pages);

    // Save metadata
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

    // Save all chunked contents to the database
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
    console.error("Upload error:", err);
    next(err);
  }
};

// @desc    List all uploaded textbooks
// @route   GET /api/textbooks
// @access  Public
const listTextbooks = async (req, res, next) => {
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
    next(err);
  }
};

module.exports = {
  uploadTextbook,
  listTextbooks,
};
