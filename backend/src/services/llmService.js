/**
 * LLM Service
 * ===========
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `You are a friendly, patient AI tutor helping students in rural India understand their textbooks.
Answer ONLY based on the provided context. If the answer is not found, say so honestly.
Keep answers clear, simple, and encouraging. Use relatable everyday Indian examples where possible.`;

/** Parse raw Gemini API errors into a clean category + message */
function parseApiError(err) {
  const raw = String(err);

  if (raw.includes("429") || raw.includes("Too Many Requests") || raw.includes("quota")) {
    // Extract retry delay if present
    const retryMatch = raw.match(/retry[^\d]*(\d+)/i);
    const retryIn = retryMatch ? `Please wait about ${retryMatch[1]} seconds and try again.` : "Please wait a moment and try again.";
    return {
      errorType: "quota",
      errorMessage: `You've hit the Gemini API free-tier rate limit. ${retryIn}`,
    };
  }

  if (raw.includes("404") || raw.includes("not found")) {
    return {
      errorType: "model",
      errorMessage: "The selected Gemini model was not found. Please contact the administrator.",
    };
  }

  if (raw.includes("403") || raw.includes("API_KEY") || raw.includes("invalid") || raw.includes("API key")) {
    return {
      errorType: "auth",
      errorMessage: "Invalid or missing Gemini API key. Check the GEMINI_API_KEY in backend/.env.",
    };
  }

  if (raw.includes("503") || raw.includes("overloaded") || raw.includes("unavailable")) {
    return {
      errorType: "overloaded",
      errorMessage: "Gemini API is currently overloaded. Please try again in a few minutes.",
    };
  }

  return {
    errorType: "unknown",
    errorMessage: "An unexpected error occurred while contacting the AI. Please try again.",
  };
}

async function askLLM(question, contextChunks) {
  const context = contextChunks.join("\n\n---\n\n");
  const prompt = `Context from textbook:\n${context}\n\nStudent's Question: ${question}\n\nProvide a clear, curriculum-aligned answer based on the above context.`;

  const start = Date.now();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
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
      model: "gemini-2.0-flash",
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
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
    const { errorType, errorMessage } = parseApiError(err);
    console.error(`[LLM Error - ${errorType}]`, err.message || err);
    return {
      answer: null,
      errorType,
      errorMessage,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - start,
    };
  }
}

module.exports = { askLLM };
