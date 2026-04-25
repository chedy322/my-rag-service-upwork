// src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import uploadRoutes from "./routes/uploadRoutes.js";
import chatRoutes from "./routes/chatRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off for the dashboard
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "DELETE"],
}));

// ── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Static dashboard ─────────────────────────────────────────────────────────
app.use(express.static("public"));

// ── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({
  status: "ok",
  version: "2.0.0",
  timestamp: new Date().toISOString(),
}));
import path from 'path';
import { authorize } from "./middleware/authorize.js";

app.use("/admin/login",(req,res)=> res.sendFile(path.join(process.cwd(), 'public', 'login.html')))
// Login
// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api", uploadRoutes);
app.use("/api", chatRoutes);
// app.use("/admin/dashboard",authorize,(req,res)=>res.sendFile(path.join(process.cwd(), 'public', 'admin.html')));
app.use("/admin",adminRoutes);
app.use("/",(req,res)=> res.sendFile(path.join(process.cwd(), 'public', 'index.html')))
// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req,res)=> res.status(404).json({ error: "Route not found." }))
// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "An unexpected error occurred.",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

export default app;
