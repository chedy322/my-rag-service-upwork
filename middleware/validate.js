// src/middleware/validate.js
// Input validation helpers to keep controllers clean.

/**
 * Validates the POST /api/chat request body.
 */
export function validateChatBody(req, res, next) {
  const { question, history } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: "'question' must be a non-empty string.",
    });
  }

  if (question.trim().length > 1000) {
    return res.status(400).json({
      error: "Validation failed",
      details: "'question' must be 1000 characters or fewer.",
    });
  }

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return res.status(400).json({
        error: "Validation failed",
        details: "'history' must be an array if provided.",
      });
    }

    for (const turn of history) {
      if (!["user", "model"].includes(turn.role) || typeof turn.parts !== "string") {
        return res.status(400).json({
          error: "Validation failed",
          details: "Each history item must have role ('user'|'model') and parts (string).",
        });
      }
    }

    if (history.length > 20) {
      return res.status(400).json({
        error: "Validation failed",
        details: "'history' must contain 20 or fewer turns.",
      });
    }
  }

  next();
}
