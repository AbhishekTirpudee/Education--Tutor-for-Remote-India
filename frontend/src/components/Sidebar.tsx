import React, { useRef, useState } from 'react';
import { TutorAPI } from '../services/api';
import { Textbook, GlobalMetrics } from '../types';

interface SidebarProps {
  textbooks: Textbook[];
  selectedBookId: number | null;
  setSelectedBookId: (id: number) => void;
  globalMetrics: GlobalMetrics | null;
  onUploadSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  textbooks,
  selectedBookId,
  setSelectedBookId,
  globalMetrics,
  onUploadSuccess,
  showToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('subject', 'General');
    
    setIsUploading(true);
    try {
      await TutorAPI.uploadTextbook(file);
      showToast('Textbook processed & chunked successfully!', 'success');
      onUploadSuccess();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
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
          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
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
  );
};
