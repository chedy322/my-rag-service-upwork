// Ensures the Weaviate collection (class) exists with the correct schema

import { getWeaviateClient } from "./weviate.js";
import weaviate,{ dataType } from "weaviate-client";

const CLASS_NAME = process.env.WEAVIATE_CLASS_NAME || "DocumentChunk";

/**
 * Collection schema for document chunks.
 * We store pre-computed embeddings ourselves, so vectorizer = "none".
 */
const collectionSchema = {
  name: CLASS_NAME,
  description: "Chunks of text extracted from uploaded business documents",
  vectorizers: weaviate.configure.vectorizer.none(),  
  properties: [
    {
      name: "text",
      dataType: dataType.TEXT,
      description: "The raw text content of this chunk",
    },
    {
      name: "source",
      dataType: dataType.TEXT,
      description: "Original filename / document source",
    },
    {
      name: "chunkIndex",
      dataType: dataType.INT,
      description: "Position of this chunk within its source document",
    },
    {
      name: "documentId",
      dataType:dataType.TEXT,
      description: "Unique identifier for the parent document",
    },
  ],
};

/**
 * Creates the collection if it doesn't already exist.
 * Safe to call on every startup.
 */
export async function bootstrapDatabase() {
  const client = await getWeaviateClient();

  // Lazy import to avoid circular reference with the client singleton
  // const { default: weaviate } = await import("weaviate-client");

//   Check if our colletion exists otherhwise create one
  const exists = await client.collections.exists(CLASS_NAME);
  if (exists) {
    console.log(`📦 Weaviate collection "${CLASS_NAME}" already exists.`);
    return;
  }

  await client.collections.create({
    name: CLASS_NAME,
    description: collectionSchema.description,
    properties: collectionSchema.properties,
    vectorizers: weaviate.configure.vectorizer.none(),
  });

  console.log(`✅ Weaviate collection "${CLASS_NAME}" created.`);
}
import { createClient } from '@supabase/supabase-js'

export async function supabaseDatabase(){
// Create Supabase client
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE);
  return supabase;
}

export { CLASS_NAME };
export default bootstrapDatabase;
