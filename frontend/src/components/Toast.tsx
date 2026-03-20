import React from 'react';

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
}

export const Toast: React.FC<{ toast: ToastProps | null }> = ({ toast }) => {
  if (!toast) return null;
  
  return (
    <div className={`toast ${toast.type}`}>
      {toast.msg}
    </div>
  );
};
