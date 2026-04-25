// Initialize the gemini model and embedding

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";


if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


export async function generateText(prompt) {
  try {
    const res = await genAI.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: { 
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });
    return res.text;
  } catch (err) {
    console.error("❌ Generation Error:", err.message);
    throw err;
  }
}


export async function embedText(text) {
  const res = await genAI.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return res;
}



export default genAI;
