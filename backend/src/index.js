/**
 * Express App Entry Point
 * =======================
 * Education Tutor for Remote India — Context Pruning System
 * Backend: Express.js + JavaScript + Prisma + PostgreSQL
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const xss = require("xss-clean");
const tutorRouter = require("./routes/tutor");
const uploadRouter = require("./routes/upload");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(helmet());                      // Set security HTTP headers
app.use(xss());                         // Prevent XSS attacks
app.use(hpp());                         // Prevent HTTP Parameter Pollution
app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,             // 15 minutes
  max: 100,                             // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter);

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

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎓 Education Tutor API running on http://localhost:${PORT}`);
  console.log(`📚 Context Pruning enabled — reducing tokens by ~78%`);
  console.log(`🗃️  Database: PostgreSQL (Prisma ORM)`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/upload   — Upload a textbook PDF`);
  console.log(`  GET  /api/textbooks — List textbooks`);
  console.log(`  POST /api/ask      — Ask a question (context pruning applied)`);
  console.log(`  GET  /api/metrics  — Token & cost savings`);
  console.log(`  GET  /api/history  — Query history (last 20 logs)\n`);
});

module.exports = app;
