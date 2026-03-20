import React from 'react';

export const Header: React.FC = () => {
  return (
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
  );
};
