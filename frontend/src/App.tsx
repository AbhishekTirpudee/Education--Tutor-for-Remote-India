import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface PruningMetrics {
  totalChunks: number;
  prunedChunks: number;
  reductionPct: number;
  tokensSaved: number;
  costSavedUsd: number;
}

interface Textbook {
  id: number;
  filename: string;
  totalPages: number;
  totalChunks: number;
}

interface GlobalMetrics {
  totalQueries: number;
  totalTokensSaved: number;
  totalCostSavedUsd: number;
  avgReductionPct: number;
  avgLatencyMs: number;
}

function App() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [lastMetrics, setLastMetrics] = useState<PruningMetrics | null>(null);
  const [lastChunks, setLastChunks] = useState<string[]>([]);
  const [latency, setLatency] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBooks = async () => {
    try {
      const res = await axios.get('/api/textbooks');
      setTextbooks(res.data);
      if (res.data.length > 0 && !selectedBookId) {
        setSelectedBookId(res.data[0].id);
      }
    } catch (e) { console.error('Failed to fetch books', e); }
  };

  const fetchMetrics = async () => {
    try {
      const res = await axios.get('/api/metrics');
      setGlobalMetrics(res.data);
    } catch (e) { console.error('Failed to fetch metrics', e); }
  };

  useEffect(() => {
    fetchBooks();
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('subject', 'General');
    
    setIsUploading(true);
    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Textbook processed & chunked successfully!', 'success');
      await fetchBooks();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }
    setIsAsking(true);
    setAnswer('');
    setLastMetrics(null);
    setLastChunks([]);

    try {
      const res = await axios.post('/api/ask', {
        question,
        textbookId: selectedBookId || undefined
      });
      
      setAnswer(res.data.answer);
      setLastMetrics(res.data.pruningMetrics);
      setLastChunks(res.data.selectedChunks);
      setLatency(res.data.latencyMs);
      fetchMetrics(); // Refresh global stats
    } catch (err: any) {
      setAnswer(`❌ Error: ${err.response?.data?.error || err.message}`);
      showToast('Query failed', 'error');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', padding: '6px 14px', borderRadius: '10px', 
            fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em', boxShadow: 'var(--shadow-soft)'
          }}>
            GenAI 4 GenZ
          </div>
          <h1>Education Tutor <span>| Context Pruning</span></h1>
        </div>
        <div className="badge">Challenge 3: PS 1</div>
      </header>

      <main>
        {/* Left Column: Ask & Chunks */}
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
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
                  <button className="btn btn-primary" onClick={handleAsk} disabled={isAsking || textbooks.length === 0}>
                    {isAsking ? <div className="spinner" /> : 'Ask'}
                  </button>
                </div>
              </div>

              <div className={`answer-box ${isAsking ? 'loading' : ''}`}>
                {answer || (isAsking ? 'Pruning context and querying LLM...' : 'Answer will appear here...')}
              </div>
            </div>

            {lastMetrics && (
              <div className="metrics-strip">
                <div className="metric-tile">
                  <div className="value">{lastMetrics.reductionPct}%</div>
                  <div className="label">Tokens Reduced</div>
                </div>
                <div className="metric-tile">
                  <div className="value">${lastMetrics.costSavedUsd}</div>
                  <div className="label">Cost Saved (USD)</div>
                </div>
                <div className="metric-tile">
                  <div className="value" style={{ color: 'var(--accent2)' }}>{latency}ms</div>
                  <div className="label">Latency</div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2><span className="icon">✂️</span> Pruned Context ({lastChunks.length} chunks sent to LLM)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Instead of sending the entire textbook ({lastMetrics?.totalChunks || 0} chunks), we isolate the most relevant context.
            </p>
            <div className="chunks-list">
              {lastChunks.length === 0 && <div className="chunk-item">No chunks pruned yet.</div>}
              {lastChunks.map((chunk, i) => (
                <div className="chunk-item" key={i}>
                  <strong>Top Match {i + 1}</strong>
                  {chunk}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Data */}
        <div className="sidebar">
          
          <div className="card">
            <h2><span className="icon">📚</span> Knowledge Base</h2>
            
            <div className="book-list">
              {textbooks.length === 0 && <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>No textbooks uploaded.</p>}
              {textbooks.map(b => (
                <div 
                  key={b.id} 
                  className={`book-item ${selectedBookId === b.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBookId(b.id)}
                >
                  <div className="book-name">{b.filename}</div>
                  <div className="book-meta">{b.totalPages} Pages • {b.totalChunks} Chunks</div>
                </div>
              ))}
            </div>

            <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '16px' }}>
              <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleUpload} />
              <div className="upload-icon">📄</div>
              <div style={{ fontWeight: 500, color: 'var(--text)' }}>
                {isUploading ? 'Ingesting & Chunking...' : 'Upload PDF Textbook'}
              </div>
              <div className="upload-hint">Max 20MB. Auto-chunks into database.</div>
            </div>
          </div>

          <div className="card">
            <h2><span className="icon">📈</span> Global Savings</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Total footprint reduction across all student queries.
            </p>
            <div className="stat-row">
              <span className="stat-label">Total Queries</span>
              <span className="stat-value">{globalMetrics?.totalQueries || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Token Reduction</span>
              <span className="stat-value green">{globalMetrics?.avgReductionPct || 0}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Tokens Saved</span>
              <span className="stat-value yellow">{(globalMetrics?.totalTokensSaved || 0).toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total Cost Saved</span>
              <span className="stat-value green">${globalMetrics?.totalCostSavedUsd || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Latency</span>
              <span className="stat-value blue">{globalMetrics?.avgLatencyMs || 0}ms</span>
            </div>
          </div>

        </div>
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default App;
