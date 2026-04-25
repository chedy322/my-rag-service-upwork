import rateLimit from "express-rate-limit";

export const chatLimiter=rateLimit({
    max:30,
    windowMS: 60*1000,
    standardHeaders: true,
  legacyHeaders: false,
    message: {
    error: "Too many questions sent. Please wait a moment before trying again.",
  },
})
export const uploadLimiter=rateLimit({
    max:10,
    windowMS: 15*60*1000,
    standardHeaders: true,
  legacyHeaders: false,
    message: {
    error: "Upload limit reached. Please wait 15 minutes before uploading more documents.",
  },
})