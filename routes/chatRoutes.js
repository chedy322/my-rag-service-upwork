// src/routes/chatRoutes.js
import { Router } from "express";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { validateChatBody } from "../middleware/validate.js";
import { chat, chatStream } from "../controllers/chatController.js";

const router = Router();

// Standard JSON response
router.post("/chat", chatLimiter, validateChatBody, chat);

// SSE streaming response
router.post("/chat/stream", chatLimiter, validateChatBody, chatStream);

export default router;
