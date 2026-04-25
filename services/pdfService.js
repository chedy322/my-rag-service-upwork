// src/services/pdfService.js
// Handles PDF parsing and smart text chunking using LangChain splitters.

import fs from "fs";
import pdfParse from "pdf-parse-fork";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { supabaseDatabase } from "../config/database.js";
// import { v4 as uuidv4 } from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 800;        // characters per chunk
const CHUNK_OVERLAP = 150;     // overlap to preserve context across boundaries

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ["\n\n", "\n", ". ", " ", ""],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a stable document ID from filename + file size.
 * Avoids re-ingesting the exact same file twice.
 */
function generateDocumentId(filename, fileSize) {
  return `doc_${Buffer.from(`${filename}:${fileSize}`).toString("base64").slice(0, 16)}`;
}


function cleanText(rawText) {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")          // max 2 consecutive blank lines
    .replace(/[ \t]{2,}/g, " ")           // collapse horizontal whitespace
    .replace(/^\s*\d+\s*$/gm, "")         // remove lone page numbers
    .trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parses a PDF file and returns metadata + page text.
 * @param {string} filePath  - Absolute path to the PDF file.
 * @returns {{ text: string, numPages: number, info: object }}
 */
export async function parsePdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);

  return {
    text: cleanText(parsed.text),
    numPages: parsed.numpages,
    info: parsed.info ?? {},
  };
}

/**
 * Splits a long text into overlapping chunks suitable for embedding.
 * @param {string} text       - The full document text.
 * @param {string} source     - Original filename (for metadata).
 * @param {number} [fileSize] - Byte size (used for document ID generation).
 * @returns {Array<{ text: string, source: string, chunkIndex: number, documentId: string }>}
 */
export async function chunkText(text, source, fileSize = 0) {
  const rawChunks = await splitter.splitText(text);

  const documentId = generateDocumentId(source, fileSize);

  return rawChunks
    .map((chunk, index) => ({
      text: chunk.trim(),
      source,
      chunkIndex: index,
      documentId,
    }))
    .filter((chunk) => chunk.text.length > 50); // drop trivially small chunks
}

/**
 * Full pipeline: parse PDF → clean → chunk.
 * @param {string} filePath
 * @param {string} originalName - The user-facing filename.
 * @returns {{ chunks: Array, numPages: number, documentId: string }}
 */
export async function processPdf(filePath, originalName) {
  const stats = fs.statSync(filePath);
  const { text, numPages } = await parsePdf(filePath);
  const chunks = await chunkText(text, originalName, stats.size);

  const documentId = chunks[0]?.documentId ?? generateDocumentId(originalName, stats.size);

  console.log(
    `📄 Parsed "${originalName}": ${numPages} pages → ${chunks.length} chunks`
  );

  return { chunks, numPages, documentId };
}

const supabase=await supabaseDatabase()
export async function uploadFileToSupabase(fileObject,docId){
  const fileName = `${docId}_${fileObject.originalname}`;
const fileBuffer = fs.readFileSync(fileObject.path);
  const { data, error } = await supabase.storage
    .from('files') 
    .upload(`uploads/${fileName}`, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  return data.path; 

}

export async function deleteFilerFromSupabase(storagePath){
  await supabase.storage.from('files').remove([storagePath]);
}

export async function getSecureUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('files')
    .createSignedUrl(filePath, 3600); 

  if (error) throw error;
  return data.signedUrl;
}