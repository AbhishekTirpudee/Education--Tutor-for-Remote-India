import axios from 'axios';
import { Textbook, GlobalMetrics } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

export const TutorAPI = {
  fetchBooks: async (): Promise<Textbook[]> => {
    const res = await api.get('/textbooks');
    return res.data;
  },

  fetchMetrics: async (): Promise<GlobalMetrics> => {
    const res = await api.get('/metrics');
    return res.data;
  },

  askQuestion: async (question: string, textbookId?: number | null) => {
    const res = await api.post('/ask', { question, textbookId });
    return res.data;
  },

  uploadTextbook: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('subject', 'General');
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
