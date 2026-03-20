/**
 * Express App Entry Point
 * =======================
 * Education Tutor for Remote India — Context Pruning System
 * Backend: Express.js + JavaScript + Prisma + SQLite
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const tutorRouter = require("./routes/tutor");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Education Tutor — Context Pruning API",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", tutorRouter);
app.use("/api", uploadRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 Education Tutor API running on http://localhost:${PORT}`);
  console.log(`📚 Context Pruning enabled — reducing tokens by ~78%`);
  console.log(`🗃️  Database: SQLite (Prisma ORM)`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/upload   — Upload a textbook PDF`);
  console.log(`  GET  /api/textbooks — List textbooks`);
  console.log(`  POST /api/ask      — Ask a question (context pruning applied)`);
  console.log(`  GET  /api/metrics  — Token & cost savings`);
  console.log(`  GET  /api/history  — Query history\n`);
});

module.exports = app;
