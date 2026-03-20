const { PrismaClient } = require("@prisma/client");

// Prisma client setup (singleton pattern)
const prisma = new PrismaClient();

module.exports = prisma;
