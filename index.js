// server.js — Entry point
import "dotenv/config";
import fs from "fs";
import app from "./app.js";
import bootstrapDatabase from "./config/database.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
console.log(PORT)
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

async function startServer() {
  try {
    await bootstrapDatabase();

    app.listen(PORT, () => {
      logger.info(`RAG API v2.0 started`, { port: PORT });
      console.log(`
╔══════════════════════════════════════════════════╗
║           DocBot RAG API  v2.0                   ║
╠══════════════════════════════════════════════════╣
║  🌐  Dashboard   http://localhost:${PORT}           ║
║  📡  Health      GET  /health                    ║
╠══════════════════════════════════════════════════╣
║  POST   /api/upload              Ingest PDFs     ║
║  POST   /api/chat                Ask (JSON)      ║
║  POST   /api/chat/stream         Ask (SSE)       ║
║  GET    /api/documents           List docs       ║
║  DELETE /api/documents/:id       Remove doc      ║
╚══════════════════════════════════════════════════╝
`);
    });
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

process.on("uncaughtException",  (err) => logger.error("Uncaught exception",  { error: err.message }));
process.on("unhandledRejection", (err) => logger.error("Unhandled rejection", { error: String(err) }));

startServer();
