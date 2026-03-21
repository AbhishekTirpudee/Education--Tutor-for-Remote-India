-- CreateTable
CREATE TABLE "Textbook" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "subject" TEXT,
    "grade" TEXT,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextChunk" (
    "id" SERIAL NOT NULL,
    "textbookId" INTEGER NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "chapter" TEXT,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "embedding" TEXT,

    CONSTRAINT "TextChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryLog" (
    "id" SERIAL NOT NULL,
    "textbookId" INTEGER,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "totalChunks" INTEGER,
    "prunedChunks" INTEGER,
    "reductionPct" DOUBLE PRECISION,
    "baselineTokens" INTEGER,
    "prunedTokens" INTEGER,
    "tokensSaved" INTEGER,
    "baselineCostUsd" DOUBLE PRECISION,
    "actualCostUsd" DOUBLE PRECISION,
    "costSavedUsd" DOUBLE PRECISION,
    "latencyMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringSession" (
    "id" TEXT NOT NULL,
    "studentName" TEXT,
    "grade" TEXT,
    "subject" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalQueries" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tokensSaved" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TutoringSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TextChunk" ADD CONSTRAINT "TextChunk_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryLog" ADD CONSTRAINT "QueryLog_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
