import React from 'react';
import { PruningMetrics } from '../types';

interface ChunksPanelProps {
  metrics: PruningMetrics | null;
  chunks: string[];
  latency: number;
}

export const ChunksPanel: React.FC<ChunksPanelProps> = ({ metrics, chunks, latency }) => {
  if (!metrics) return null;

  return (
    <>
      <div className="metrics-strip">
        <div className="metric-tile">
          <div className="value">{metrics.reductionPct}%</div>
          <div className="label">Tokens Reduced</div>
        </div>
        <div className="metric-tile">
          <div className="value">${metrics.costSavedUsd}</div>
          <div className="label">Cost Saved (USD)</div>
        </div>
        <div className="metric-tile">
          <div className="value" style={{ color: 'var(--primary)' }}>{latency}ms</div>
          <div className="label">Latency</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2><span className="icon">✂️</span> Pruned Context ({chunks.length} chunks sent to LLM)</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Instead of sending the entire textbook ({metrics.totalChunks || 0} chunks), we isolate the most relevant context.
        </p>
        <div className="chunks-list">
          {chunks.length === 0 && <div className="chunk-item">No chunks pruned yet.</div>}
          {chunks.map((chunk, i) => (
            <div className="chunk-item" key={i}>
              <strong>Top Match {i + 1}</strong>
              {chunk}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
