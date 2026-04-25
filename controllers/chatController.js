// src/controllers/chatController.js
// RAG pipeline with two modes:
//   • POST /api/chat          → standard JSON response
//   • POST /api/chat/stream   → Server-Sent Events (token-by-token streaming)

import { embedQuery } from "../services/embeddingService.js";
import { querySimilarChunks } from "../services/vectorService.js";
import { generateText } from "../config/gemini.js";

const MIN_RELEVANCE_SCORE = 0.70;
const MAX_CONTEXT_CHUNKS = 5;

const NO_INFO_REPLY =
  "I'm sorry, I don't have information about that in our documentation. " +
  "Please contact our support team for further assistance.";

function buildSystemPrompt(contextChunks) {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] Source: "${c.source}"\n${c.text}`)
    .join("\n\n");

  return `You are a helpful, professional customer support assistant.
Answer questions using ONLY the context below. Follow these rules strictly:


1. Base every answer solely on the provided context — no outside knowledge.
2. If the user is greeting you or saying goodbye, respond politely and briefly.
3. If the answer is not in the context, respond with exactly: "${NO_INFO_REPLY}"
4. Be concise, friendly, and professional.
5. When citing information, mention the source document naturally.
6. Never speculate or add information not present in the context.
7. Format answers with short paragraphs. Use bullet points only when listing 3+ distinct items.

--- CONTEXT ---
${context}
--- END CONTEXT ---`;
}

async function retrieveContext(question) {
  const queryVector = await embedQuery(question);
  const rawChunks = await querySimilarChunks(queryVector, MAX_CONTEXT_CHUNKS);
  rawChunks.map((obj)=>{
    console.log(obj.text)
  })
  const relevant = rawChunks.filter((c) => c.score >= MIN_RELEVANCE_SCORE);
  console.log(`🔍 "${question.slice(0, 60)}" → ${relevant.length}/${rawChunks.length} relevant chunks`);
  return relevant;
}


function isGreeting(text) {
  const greetings = ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon'];
  const words = text.toLowerCase().split(/\W+/);
  return words.length <= 2 && greetings.some(g => words.includes(g));
}
export async function chat(req, res) {
  const { question, history = [] } = req.body;
  
  const trimmed = question.trim().toLowerCase();
  if (isGreeting(trimmed)) {
    return res.json({
      answer: "Hello! I'm your Mental Health Guide assistant. How can I help you navigate the documentation today?",
      sources: [],
      relevantChunks: 0,
      question: trimmed
    });
  }
  try {
    const relevantChunks = await retrieveContext(trimmed);
    const sources = [...new Set(relevantChunks.map((c) => c.source))];

    if (relevantChunks.length === 0) {
      return res.json({ answer: NO_INFO_REPLY, sources: [], relevantChunks: 0, question: trimmed });
    }

    const systemPrompt = buildSystemPrompt(relevantChunks);
  
  const historyText = history
    .map((t) => {
      const role = t.role === "model" ? "Assistant" : "User";
      return `${role}: ${t.parts}`;
    })
    .join("\n");

const fullPrompt = `
${systemPrompt}

Conversation so far:
${historyText}


User question:
${trimmed}
`;

const answer = await generateText(fullPrompt);
    return res.json({ answer, sources, relevantChunks: relevantChunks.length, question: trimmed });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    return res.status(500).json({
      error: "Failed to generate an answer. Please try again.",
      ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
  }
}



// ── Streaming SSE ──────────────────────────────────────────────────────────
export async function chatStream(req, res) {
  const { question, history = [] } = req.body;
  const trimmed = question.trim();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    const relevantChunks = await retrieveContext(trimmed);
    const sources = [...new Set(relevantChunks.map((c) => c.source))];

    send({ type: "sources", sources, relevantChunks: relevantChunks.length });

    if (relevantChunks.length === 0) {
      send({ type: "token", text: NO_INFO_REPLY });
      send({ type: "done" });
      return res.end();
    }

    const systemPrompt = buildSystemPrompt(relevantChunks);

      const historyText = history
  .map((t) => {
    const role = t.role === "model" ? "Assistant" : "User";
    return `${role}: ${t.parts}`;
  })
  .join("\n");
      const fullPrompt = `
${systemPrompt}


Conversation so far:
${historyText}


User question:
${trimmed}
`;
      const answer = await generateText(fullPrompt);
    send({ type: "token", text: answer });
send({ type: "done" });
res.end();
  } catch (err) {
    console.error("❌ Stream error:", err.message);
    send({ type: "error", message: "Failed to generate response. Please try again." });
    res.end();
  }
}
