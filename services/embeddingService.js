// src/services/embeddingService.js
// Generates text embeddings via the Gemini text-embedding-004 model.
// Handles batching and rate-limit back-off automatically.

import { embedText } from "../config/gemini.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const BATCH_SIZE = 20;      
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1500;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Embeds a single string with retry logic.
 */
async function embedSingle(text, attempt = 1) {
  try {
  const result=await embedText(text)
    return result.embeddings[0].values;   
  } catch (err) {
    if (attempt < RETRY_LIMIT) {
      console.warn(`⚠️  Embedding retry ${attempt}/${RETRY_LIMIT}: ${err.message}`);
      await sleep(RETRY_DELAY_MS * attempt);
      return embedSingle(text, attempt + 1);
    }
    throw new Error(`Embedding failed after ${RETRY_LIMIT} attempts: ${err.message}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Embeds a single piece of text (used for query embedding).
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedQuery(text) {
  return embedSingle(text);
}

/**
 * Embeds an array of text chunks in batches.
 * Returns an array of vectors in the same order as the input.
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts) {
  const vectors = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    console.log(
      `🔢 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`
    );

    const batchVectors = await Promise.all(batch.map((t) => embedSingle(t)));
    vectors.push(...batchVectors);

    // Small courtesy delay between batches to respect rate limits
    if (i + BATCH_SIZE < texts.length) await sleep(300);
  }

  return vectors;
}

/**
 * Convenience: embed an array of chunk objects (each with a `.text` property).
 * Returns the same array with a `.vector` field added to each chunk.
 *
 * @param {Array<{ text: string, [key: string]: any }>} chunks
 * @returns {Promise<Array<{ text: string, vector: number[], [key: string]: any }>>}
 */
export async function embedChunks(chunks) {
  // chunks=[{
  // text: chunk.trim(),
  //     source,
  //     chunkIndex: index,
  //     documentId,},etc...]
  const texts = chunks.map((c) => c.text);
  const vectors = await embedBatch(texts);
  // result is [{
  //  text: chunk.trim(),
  //     source,
  //     chunkIndex: index,
  //     documentId,
  // vector
  // }]
  return chunks.map((chunk, i) => ({ ...chunk, vector: vectors[i] }));
}
