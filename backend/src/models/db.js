const { PrismaClient } = require("@prisma/client");

// ── Singleton Prisma Client (PostgreSQL) ──────────────────────────────────────
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Verify PostgreSQL connection on startup
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma ORM");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    console.error("   Check DATABASE_URL in .env (host, port, user, password, dbname)");
    process.exit(1); // crash fast so the issue is obvious
  }
}

connectDB();

module.exports = prisma;
