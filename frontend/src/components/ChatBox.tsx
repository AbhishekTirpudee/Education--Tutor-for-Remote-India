import React, { useState } from 'react';
import axios from 'axios';
import { PruningMetrics } from '../types';

interface ChatBoxProps {
  selectedBookId: number | null;
  hasBooks: boolean;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onNewMetrics: (metrics: PruningMetrics, chunks: string[], latency: number) => void;
  onRefreshGlobalStats: () => void;
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
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }
    setIsAsking(true);
    setAnswer('');

    try {
      const res = await axios.post('/api/ask', {
        question,
        textbookId: selectedBookId || undefined
      });
      
      setAnswer(res.data.answer);
      onNewMetrics(res.data.pruningMetrics, res.data.selectedChunks, res.data.latencyMs);
      onRefreshGlobalStats();
    } catch (err: any) {
      setAnswer(`❌ Error: ${err.response?.data?.error || err.message}`);
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

        <div className={`answer-box ${isAsking ? 'loading' : ''}`}>
          {answer || (isAsking ? 'Pruning context and querying LLM...' : 'Answer will appear here...')}
        </div>
      </div>
    </div>
  );
};
