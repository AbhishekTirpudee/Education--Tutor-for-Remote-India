import React, { useState } from 'react';
import { TutorAPI } from '../services/api';
import { PruningMetrics } from '../types';

interface ChatBoxProps {
  selectedBookId: number | null;
  hasBooks: boolean;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onNewMetrics: (metrics: PruningMetrics, chunks: string[], latency: number) => void;
  onRefreshGlobalStats: () => void;
}

interface LlmError {
  type: 'quota' | 'model' | 'auth' | 'overloaded' | 'unknown';
  message: string;
}

const ERROR_META: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  quota:     { icon: '⏳', label: 'Rate Limit Reached',    color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  model:     { icon: '🔧', label: 'Model Unavailable',     color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
  auth:      { icon: '🔑', label: 'API Key Error',         color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  overloaded:{ icon: '🌐', label: 'Service Overloaded',    color: '#0369a1', bg: '#eff6ff', border: '#93c5fd' },
  unknown:   { icon: '⚠️', label: 'Unexpected Error',      color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
};

function LlmErrorCard({ error }: { error: LlmError }) {
  const meta = ERROR_META[error.type] ?? ERROR_META.unknown;
  return (
    <div style={{
      background: meta.bg,
      border: `1.5px solid ${meta.border}`,
      borderRadius: '12px',
      padding: '18px 20px',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{meta.icon}</span>
      <div>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '0.95rem',
          color: meta.color,
          marginBottom: '4px',
        }}>
          {meta.label}
        </div>
        <div style={{
          fontSize: '0.88rem',
          color: '#475569',
          lineHeight: 1.6,
        }}>
          {error.message}
        </div>
        {error.type === 'quota' && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#64748b',
            fontWeight: 500,
          }}>
            💡 <strong>Tip:</strong> Free tier has limited requests/minute. Wait a moment, then try again — or enable billing at{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
               style={{ color: meta.color, textDecoration: 'underline' }}>
              aistudio.google.com
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  selectedBookId,
  hasBooks,
  showToast,
  onNewMetrics,
  onRefreshGlobalStats
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [llmError, setLlmError] = useState<LlmError | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }
    setIsAsking(true);
    setAnswer('');
    setLlmError(null);

    try {
      const data = await TutorAPI.askQuestion(question, selectedBookId);

      if (data.llmError) {
        // Structured LLM error — render the nice card
        setLlmError(data.llmError);
        showToast(data.llmError.message.slice(0, 60) + '…', 'error');
      } else {
        setAnswer(data.answer ?? '');
        showToast('Answer received!', 'success');
      }

      onNewMetrics(data.pruningMetrics, data.selectedChunks, data.latencyMs);
      onRefreshGlobalStats();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Request failed';
      setAnswer('');
      setLlmError({ type: 'unknown', message: msg });
      showToast('Query failed', 'error');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="card">
      <h2><span className="icon">💬</span> Ask the AI Tutor</h2>
      <div className="qa-form">
        <div className="ask-row">
          <textarea
            placeholder="e.g. Explain Newton's First Law of Motion based on the textbook..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk(); }
            }}
          />
          <div className="ask-btn-col">
            <button className="btn btn-primary" onClick={handleAsk} disabled={isAsking || !hasBooks}>
              {isAsking ? <div className="spinner" /> : 'Ask'}
            </button>
          </div>
        </div>

        {/* Answer / Error / Placeholder */}
        {llmError ? (
          <LlmErrorCard error={llmError} />
        ) : (
          <div className={`answer-box ${isAsking ? 'loading' : ''}`}>
            {answer || (isAsking ? 'Pruning context and querying LLM...' : 'Answer will appear here...')}
          </div>
        )}
      </div>
    </div>
  );
};
