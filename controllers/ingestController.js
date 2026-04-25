// src/controllers/ingestController.js
// Orchestrates the full PDF → chunk → embed → upsert pipeline.

import fs from "fs";
import path from "path";
import { deleteFilerFromSupabase, getSecureUrl, processPdf, uploadFileToSupabase } from "../services/pdfService.js";
import { embedChunks } from "../services/embeddingService.js";
import { upsertChunks, deleteDocumentChunks, listDocuments } from "../services/vectorService.js";
import { deleteDocumentFromFirebase, getDocumentById, registerDocument, registerLog } from "../services/firebaseService.js";

// ─── Upload & Ingest ─────────────────────────────────────────────────────────

/**
 * POST /api/upload
 * Accepts one or more PDF files, processes them, and stores them in Weaviate.
 */
export async function uploadDocuments(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No PDF files were uploaded." });
  }

  const results = [];

  for (const file of req.files) {
    const filePath = file.path;
    const originalName = file.originalname;

    try {
      console.log(`\n📂 Processing: ${originalName}`);

      // 1. Parse PDF → chunks
      // returns chunks, numPages, documentId
      const { chunks, numPages, documentId } = await processPdf(filePath, originalName);

      if (chunks.length === 0) {
        results.push({
          file: originalName,
          status: "skipped",
          reason: "No extractable text found in PDF.",
        });
        continue;
      }

      // 2. Embed all chunks
      const embeddedChunks = await embedChunks(chunks);

      // 3. Upsert into Weaviate
      const { inserted, errors } = await upsertChunks(embeddedChunks);
      await registerLog("FILE_UPLOAD",req.user.email,originalName,req.ip)
      // upload the file to supabase
      const supabasefilePath=await uploadFileToSupabase(file,documentId)
       // upload document details
      await registerDocument(documentId,originalName,supabasefilePath)


      results.push({
        file: originalName,
        status: "success",
        documentId,
        numPages,
        chunksCreated: chunks.length,
        chunksInserted: inserted,
        errors,
      });
     
      console.log(`✅ Done: ${originalName} (${inserted} chunks stored)`);
    } catch (err) {
      console.error(`❌ Failed to process ${originalName}:`, err.message);
      results.push({
        file: originalName,
        status: "error",
        message: err.message,
      });
    } finally {
      // Always clean up the temp file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  const allFailed = results.every((r) => r.status === "error");
  return res.status(allFailed ? 500 : 200).json({
    message: allFailed ? "All uploads failed." : "Upload processing complete.",
    results,
  });
}

// ─── List Documents ──────────────────────────────────────────────────────────

/**
 * GET /api/documents
 * Returns all ingested documents with their IDs.
 */
export async function getDocuments(req, res) {
  try {
    const docs = await listDocuments();
   
    return res.json({ documents: docs, count: docs.length });
  } catch (err) {
    console.error("Failed to list documents:", err.message);
    return res.status(500).json({ error: "Could not retrieve documents." });
  }
}

// ─── Delete Document ─────────────────────────────────────────────────────────

/**
 * DELETE /api/documents/:documentId
 * Removes all chunks of a specific document from Weaviate.
 */
export async function deleteDocument(req, res) {
  const { documentId } = req.params;

  if (!documentId) {
    return res.status(400).json({ error: "documentId is required." });
  }

  try {
    // get document from firestore documents tog et the filePath
      const documentData=await getDocumentById(documentId)
      if (!documentData) {
      return res.status(404).json({ error: "Document not found" });
    }
    const {storagePath}  = documentData;
    console.log(storagePath)
    const result = await deleteDocumentChunks(documentId);
    await registerLog(
        "DOCUMENT_DELETED",
        req.user.email,
      result.source,
        req.ip,

    )
    // delete document from supabase
    await deleteFilerFromSupabase(storagePath)
    // Delte documetn from firebase
    await deleteDocumentFromFirebase(documentId)
    return res.json({
      message: `Document deleted successfully.`,
      documentId,
      chunksDeleted: result.chunksDeleted,
    });

    
  } catch (err) {
    console.error("Failed to delete document:", err.message);
    return res.status(500).json({ error: "Could not delete document." });
  }
}


export async function getFileurl(req,res){
  const filePath = req.query.path; 
  console.log(filePath)
  try{
        const signedUrl = await getSecureUrl(filePath);
        res.json({ url: signedUrl });
        
      }catch(err){
    res.status(500).json({ error: "Could not generate link" });

  }
}