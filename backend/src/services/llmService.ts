/**
 * LLM Service
 * ===========
 * Sends pruned context to Google Gemini 1.5 Flash and returns the answer.
 * Falls back to a demo response if no API key is set.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a friendly, patient AI tutor helping students in rural India understand their textbooks.
Answer ONLY based on the provided context. If the answer is not found, say so honestly.
Keep answers clear, simple, and encouraging. Use relatable everyday Indian examples where possible.`;

export interface LLMResponse {
  answer: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function askLLM(
  question: string,
  contextChunks: string[]
): Promise<LLMResponse> {
  const context = contextChunks.join("\n\n---\n\n");
  const prompt = `Context from textbook:\n${context}\n\nStudent's Question: ${question}\n\nProvide a clear, curriculum-aligned answer based on the above context.`;

  const start = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const latencyMs = Date.now() - start;
    return {
      answer:
        "📚 [Demo Mode] Add your GEMINI_API_KEY to backend/.env to enable live AI answers. The context pruning pipeline is fully functional — only the final LLM call is mocked here.",
      inputTokens: Math.ceil(prompt.split(/\s+/).length * 1.3),
      outputTokens: 40,
      latencyMs: latencyMs + 150,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.3 },
    });

    const answer = result.response.text();
    const latencyMs = Date.now() - start;
    const inputTokens = Math.ceil(prompt.split(/\s+/).length * 1.3);
    const outputTokens = Math.ceil(answer.split(/\s+/).length * 1.3);

    return { answer, inputTokens, outputTokens, latencyMs };
  } catch (err) {
    return {
      answer: `⚠️ LLM Error: ${String(err)}`,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - start,
    };
  }
}
