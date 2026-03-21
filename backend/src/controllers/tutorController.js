const prisma = require("../models/db");
const { pruneContext } = require("../services/contextPruner");
const { askLLM } = require("../services/llmService");

// @desc    Process a student question and return the pruned context + AI answer
// @route   POST /api/ask
// @access  Public
const askQuestion = async (req, res, next) => {
  try {
    const { question, textbookId } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: "Question is required (min 3 chars)" });
    }

    const whereClause = textbookId ? { textbookId: parseInt(textbookId, 10) } : {};
    const dbChunks = await prisma.textChunk.findMany({
      where: whereClause,
      orderBy: { chunkIndex: "asc" },
    });

    const allChunkTexts = dbChunks.map((c) => c.content);

    // ── CONTEXT PRUNING (Core Technique) ─────────────────────────────────────
    const { prunedChunks, selectedIndices, metrics } = pruneContext(
      question,
      allChunkTexts
    );
    // ─────────────────────────────────────────────────────────────────────────

    const llmResult = await askLLM(question, prunedChunks);

    const log = await prisma.queryLog.create({
      data: {
        textbookId: textbookId ? parseInt(textbookId, 10) : null,
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
      llmError: llmResult.errorType ? {
        type: llmResult.errorType,
        message: llmResult.errorMessage,
      } : null,
      queryId: log.id,
      pruningMetrics: metrics,
      latencyMs: llmResult.latencyMs,
      selectedChunks: prunedChunks,
    });
  } catch (err) {
    next(err); // pass to global error handler
  }
};

// @desc    Get aggregated savings and token reduction metrics
// @route   GET /api/metrics
// @access  Public
const getMetrics = async (req, res, next) => {
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
      totalTokensSaved: agg._sum.tokensSaved || 0,
      totalCostSavedUsd: parseFloat((agg._sum.costSavedUsd || 0).toFixed(6)),
      avgReductionPct: parseFloat((agg._avg.reductionPct || 0).toFixed(2)),
      avgLatencyMs: parseFloat((agg._avg.latencyMs || 0).toFixed(2)),
      totalBaselineTokens: agg._sum.baselineTokens || 0,
      totalPrunedTokens: agg._sum.prunedTokens || 0,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get history of queries
// @route   GET /api/history
// @access  Public
const getHistory = async (req, res, next) => {
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
    next(err);
  }
};

module.exports = {
  askQuestion,
  getMetrics,
  getHistory,
};
