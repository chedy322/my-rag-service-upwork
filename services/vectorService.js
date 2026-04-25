// src/services/vectorService.js
// Handles all Weaviate operations: upsert (ingest) and similarity search (query).

import { getWeaviateClient } from "../config/weviate.js";
import { CLASS_NAME } from "../config/database.js";
import { getDocuments } from "./firebaseService.js";

const UPSERT_BATCH_SIZE = 100;  
const TOP_K_RESULTS = 3;        


/**
 * Upserts an array of embedded chunks into Weaviate.
 * Each chunk must have: { text, source, chunkIndex, documentId, vector }
 *
 * @param {Array<{ text: string, source: string, chunkIndex: number, documentId: string, vector: number[] }>} embeddedChunks
 * @returns {Promise<{ inserted: number, errors: number }>}
 */
export async function upsertChunks(embeddedChunks) {
  const client = await getWeaviateClient();
  const collection = client.collections.get(CLASS_NAME);

  let inserted = 0;
  let errors = 0;

  // Process in batches to stay within Weaviate's batch limits
  for (let i = 0; i < embeddedChunks.length; i += UPSERT_BATCH_SIZE) {
    const batch = embeddedChunks.slice(i, i + UPSERT_BATCH_SIZE);

    const objects = batch.map((chunk) => ({
      properties: {
        text: chunk.text,
        source: chunk.source,
        chunkIndex: chunk.chunkIndex,
        documentId: chunk.documentId,
      },
      vectors: chunk.vector,
    }));

    const result = await collection.data.insertMany(objects);

    if (result.hasErrors) {
      const errCount = Object.keys(result.errors).length;
      console.error(`❌ Batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1} had ${errCount} errors`);
      errors += errCount;
    }

    inserted += batch.length - (result.hasErrors ? Object.keys(result.errors).length : 0);
    console.log(`📥 Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}: ${inserted} total inserted`);
  }

  return { inserted, errors };
}

// ─── Query ───────────────────────────────────────────────────────────────────

/**
 * Performs a vector similarity search and returns the top-K matching chunks.
 *
 * @param {number[]} queryVector  - Embedding of the user's question.
 * @param {number}   [topK]       - Number of results to return (default: 5).
 * @returns {Promise<Array<{ text: string, source: string, chunkIndex: number, score: number }>>}
 */
export async function querySimilarChunks(queryVector, topK = TOP_K_RESULTS) {
  const client = await getWeaviateClient();
  const collection = client.collections.get(CLASS_NAME);
console.log("Query similutaor triggered")
  const result = await collection.query.nearVector(queryVector, {
    limit: topK,
    returnMetadata: ["certainty", "distance"],
    returnProperties: ["text", "source", "chunkIndex", "documentId"],
  });
  return result.objects.map((obj) => ({
    text: obj.properties.text,
    source: obj.properties.source,
    chunkIndex: obj.properties.chunkIndex,
    documentId: obj.properties.documentId,
    score: obj.metadata?.certainty ?? 0,
  }));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Deletes all chunks belonging to a specific document.
 * Useful when re-uploading an updated version of a document.
 *
 * @param {string} documentId
 * @returns {Promise<number>} Number of deleted objects.
 */
export async function deleteDocumentChunks(documentId) {
  const client = await getWeaviateClient();
  const collection = client.collections.get(CLASS_NAME);
 

  const objectsToDelete = await collection.query.fetchObjects({
    filters: collection.filter.byProperty("documentId").equal(documentId),
  returnProperties: ["source"] 
});

let source=objectsToDelete.objects[0].properties.source;

  const result = await collection.data.deleteMany(
    collection.filter.byProperty("documentId").equal(documentId)
  );
  
  console.log(`Deleted ${result.successful} chunks for document: ${documentId}`);
  let returnedResult={
    source,
    chunksDeleted:result.successful
  }
 
  return returnedResult;
}

/**
 * Returns a list of all unique document sources ingested.
 * @returns {Promise<string[]>}
 */
export async function listDocuments() {

  const result=await getDocuments();

   return result.map((obj) => ({
   documentId: obj.id,
    source:obj.name,
    storagePath:obj.storagePath
  }));
}
