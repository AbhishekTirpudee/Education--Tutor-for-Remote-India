export interface PruningMetrics {
  totalChunks: number;
  prunedChunks: number;
  reductionPct: number;
  tokensSaved: number;
  costSavedUsd: number;
}

export interface Textbook {
  id: number;
  filename: string;
  totalPages: number;
  totalChunks: number;
}

export interface GlobalMetrics {
  totalQueries: number;
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  avgReductionPct: number;
  avgLatencyMs: number;
}
