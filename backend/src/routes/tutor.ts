/**
 * Tutor Routes
 * ============
 * POST /api/ask — Student asks a question; context is pruned before LLM call
 * GET  /api/metrics — Aggregated savings metrics
 * GET  /api/history — Query history
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { pruneContext } from "../services/contextPruner";
import { askLLM } from "../services/llmService";

const router = Router();
const prisma = new PrismaClient();

// POST /api/ask
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { question, textbookId } = req.body as {
      question: string;
      textbookId?: number;
    };

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: "Question is required (min 3 chars)" });
    }

    // Fetch all chunks for this textbook (or all chunks if no textbookId)
    const whereClause = textbookId ? { textbookId } : {};
    const dbChunks = await prisma.textChunk.findMany({
      where: whereClause,
      orderBy: { chunkIndex: "asc" },
    });

    const allChunkTexts = dbChunks.map((c) => c.content);

    // ── CONTEXT PRUNING (THE KEY TECHNIQUE) ──────────────────────────────────
    const { prunedChunks, selectedIndices, metrics } = pruneContext(
      question,
      allChunkTexts
    );
    // ─────────────────────────────────────────────────────────────────────────

    // Send only pruned context to LLM
    const llmResult = await askLLM(question, prunedChunks);

    // Persist query log
    const log = await prisma.queryLog.create({
      data: {
        textbookId: textbookId ?? null,
        question,
        answer: llmResult.answer,
        totalChunks: metrics.totalChunks,
        prunedChunks: metrics.prunedChunks,
        reductionPct: metrics.reductionPct,
        baselineTokens: metrics.baselineTokens,
        prunedTokens: metrics.prunedTokens,
        tokensSaved: metrics.tokensSaved,
        baselineCostUsd: metrics.baselineCostUsd,
        actualCostUsd: metrics.actualCostUsd,
        costSavedUsd: metrics.costSavedUsd,
        latencyMs: llmResult.latencyMs,
      },
    });

    return res.json({
      answer: llmResult.answer,
      queryId: log.id,
      pruningMetrics: metrics,
      latencyMs: llmResult.latencyMs,
      selectedChunks: prunedChunks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
});

// GET /api/metrics — Cumulative savings dashboard data
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const agg = await prisma.queryLog.aggregate({
      _sum: {
        tokensSaved: true,
        costSavedUsd: true,
        baselineTokens: true,
        prunedTokens: true,
      },
      _avg: {
        reductionPct: true,
        latencyMs: true,
      },
      _count: { id: true },
    });

    return res.json({
      totalQueries: agg._count.id,
      totalTokensSaved: agg._sum.tokensSaved ?? 0,
      totalCostSavedUsd: parseFloat((agg._sum.costSavedUsd ?? 0).toFixed(6)),
      avgReductionPct: parseFloat((agg._avg.reductionPct ?? 0).toFixed(2)),
      avgLatencyMs: parseFloat((agg._avg.latencyMs ?? 0).toFixed(2)),
      totalBaselineTokens: agg._sum.baselineTokens ?? 0,
      totalPrunedTokens: agg._sum.prunedTokens ?? 0,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// GET /api/history — Recent queries
router.get("/history", async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.queryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        question: true,
        answer: true,
        reductionPct: true,
        tokensSaved: true,
        costSavedUsd: true,
        latencyMs: true,
        createdAt: true,
      },
    });
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
