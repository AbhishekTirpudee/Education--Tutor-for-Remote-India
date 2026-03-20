import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatBox } from './components/ChatBox';
import { ChunksPanel } from './components/ChunksPanel';
import { Toast } from './components/Toast';
import { Textbook, GlobalMetrics, PruningMetrics } from './types';

function App() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);

  const [lastMetrics, setLastMetrics] = useState<PruningMetrics | null>(null);
  const [lastChunks, setLastChunks] = useState<string[]>([]);
  const [latency, setLatency] = useState<number>(0);

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

  return (
    <div className="app">
      <Header />

      <main>
        {/* Left Column: Ask & Chunks */}
        <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ChatBox 
            selectedBookId={selectedBookId}
            hasBooks={textbooks.length > 0}
            showToast={showToast}
            onNewMetrics={(m, c, l) => { setLastMetrics(m); setLastChunks(c); setLatency(l); }}
            onRefreshGlobalStats={fetchMetrics}
          />
          <ChunksPanel metrics={lastMetrics} chunks={lastChunks} latency={latency} />
        </div>

        {/* Right Column: Settings & Data */}
        <Sidebar 
          textbooks={textbooks}
          selectedBookId={selectedBookId}
          setSelectedBookId={setSelectedBookId}
          globalMetrics={globalMetrics}
          onUploadSuccess={fetchBooks}
          showToast={showToast}
        />
      </main>

      <Toast toast={toast} />
    </div>
  );
}

export default App;
