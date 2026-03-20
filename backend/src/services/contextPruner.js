/**
 * Context Pruner Service
 * ======================
 */

const natural = require("natural");
const { TfIdf } = natural;

const INPUT_COST_PER_1K = parseFloat(process.env.INPUT_COST_PER_1K || "0.00035");
const TOP_K = parseInt(process.env.TOP_K_CHUNKS || "5", 10);

function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

function normalize(arr) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  if (max === min) return arr.map(() => 0);
  return arr.map((v) => (v - min) / (max - min));
}

function pruneContext(query, chunks, topK = TOP_K) {
  const n = chunks.length;

  if (n === 0) {
    return {
      prunedChunks: [],
      selectedIndices: [],
      metrics: buildMetrics([], chunks),
    };
  }

  if (n <= topK) {
    return {
      prunedChunks: chunks,
      selectedIndices: chunks.map((_, i) => i),
      metrics: buildMetrics(chunks, chunks),
    };
  }

  const tfidf = new TfIdf();
  chunks.forEach((chunk) => tfidf.addDocument(chunk));

  const scores = new Array(n).fill(0);
  tfidf.tfidfs(query, (i, measure) => {
    scores[i] = measure;
  });

  const normalized = normalize(scores);
  const indexed = normalized.map((score, i) => ({ score, i }));
  indexed.sort((a, b) => b.score - a.score);
  
  const topIndices = indexed
    .slice(0, topK)
    .map((x) => x.i)
    .sort((a, b) => a - b);

  const selected = topIndices.map((i) => chunks[i]);

  return {
    prunedChunks: selected,
    selectedIndices: topIndices,
    metrics: buildMetrics(selected, chunks),
  };
}

function buildMetrics(selected, all) {
  const baselineTokens = all.reduce((s, c) => s + estimateTokens(c), 0);
  const prunedTokens = selected.reduce((s, c) => s + estimateTokens(c), 0);
  const tokensSaved = baselineTokens - prunedTokens;
  const reductionPct =
    baselineTokens > 0
      ? Math.round((tokensSaved / baselineTokens) * 100 * 100) / 100
      : 0;
  const baselineCostUsd = (baselineTokens / 1000) * INPUT_COST_PER_1K;
  const actualCostUsd = (prunedTokens / 1000) * INPUT_COST_PER_1K;

  return {
    totalChunks: all.length,
    prunedChunks: selected.length,
    reductionPct,
    baselineTokens,
    prunedTokens,
    tokensSaved,
    baselineCostUsd: parseFloat(baselineCostUsd.toFixed(6)),
    actualCostUsd: parseFloat(actualCostUsd.toFixed(6)),
    costSavedUsd: parseFloat((baselineCostUsd - actualCostUsd).toFixed(6)),
  };
}

module.exports = { pruneContext };
