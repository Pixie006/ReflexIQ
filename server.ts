import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Mandatory Top-Level Request Deserialization (Ordering Guarantee)
// Mount body parsers before any endpoint routes
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Lazy initialization of GoogleGenAI SDK to prevent runtime crash when key is loaded dynamically
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Graceful check - will fail inside request handler with clean error message if used
    throw new Error("GEMINI_API_KEY environment variable is missing or unconfigured.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 2. Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash"
];

interface FallbackResult {
  text: string;
  modelUsed: string;
  attempts: string[];
}

/**
 * Executes content generation through the fallback ladder with full recovery matrix.
 */
async function generateContentWithFallback(params: {
  systemInstruction?: string;
  prompt: string | Array<{ role: string; parts: Array<{ text: string }> }>;
}): Promise<FallbackResult> {
  const ai = getGenAI();
  const attempts: string[] = [];
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      attempts.push(modelName);
      
      let contents: any;
      if (typeof params.prompt === "string") {
        contents = params.prompt;
      } else {
        contents = params.prompt.map((p) => ({
          role: p.role === "assistant" ? "model" : p.role,
          parts: p.parts
        }));
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: params.systemInstruction || "You are an empathetic, insightful, and structured cognitive journaling partner and sounding board.",
          temperature: 0.7,
        }
      });

      const responseText = response.text || "";
      if (responseText.trim()) {
        return {
          text: responseText,
          modelUsed: modelName,
          attempts
        };
      }
    } catch (err: any) {
      console.warn(`[Fallback Ladder] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All models in the fallback ladder failed. Last error: ${lastError?.message || "Unknown error"}`);
}

// Helper: Defensive payload sanitizer & zero-crash undefined stripper
function sanitizeInput(val: any, maxLength = 10000): string {
  if (typeof val !== "string") return "";
  // Strip control characters while preserving newlines and safe text
  return val.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "").slice(0, maxLength);
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health & System Diagnostic Endpoint
app.get("/api/health", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
    fallbackLadder: MODEL_FALLBACK_LADDER,
    timestamp: new Date().toISOString()
  });
});

// Multi-Turn Reflection & Chat Endpoint
app.post("/api/reflect", async (req, res) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const userId = sanitizeInput(data.userId, 128);
    const mode = sanitizeInput(data.mode, 64) || "journal";
    const userMessage = sanitizeInput(data.message, 8000);
    const conversationHistory = Array.isArray(data.history) ? data.history : [];

    if (!userMessage.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    // System prompt tailored to reflective exploration
    let systemInstruction = `You are ReflectIQ, a cognitive journaling companion and high-bandwidth thought partner.
Your goal is to help the user unpack their thoughts, identify cognitive biases, highlight emotional currents, brainstorm constructive next steps, and reflect deeply.
Formatting guidelines:
- Use clear headings, bullet points, and high-contrast bold highlights.
- Offer empathetic, non-judgmental, and intellectually stimulating feedback.
- End with 1-2 thoughtful, open-ended inquiry questions to deepen their self-reflection.`;

    if (mode === "brainstorm") {
      systemInstruction = `You are a strategic brainstorming partner. Expand on the user's idea with 3 distinct lenses: (1) First-principles mechanics, (2) Creative contrarian angles, (3) Rapid 24-hour execution roadmap.`;
    } else if (mode === "reframe") {
      systemInstruction = `You are a cognitive reframing coach. Unpack the user's situation by identifying the narrative assumptions, exploring alternative interpretations, and providing a grounded, resilient perspective.`;
    } else if (mode === "summarize") {
      systemInstruction = `You are an executive reflection analyst. Distill the user's thoughts into:
1. Core Thesis & Emotional Pulse
2. Key Decisions & Bottlenecks
3. Actionable Commitments & Next Steps.`;
    }

    // Format conversation history
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    // Add past turns (limit last 12 turns for context efficiency)
    const recentHistory = conversationHistory.slice(-12);
    for (const turn of recentHistory) {
      if (turn && typeof turn === "object" && turn.role && turn.content) {
        contents.push({
          role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
          parts: [{ text: sanitizeInput(turn.content, 4000) }]
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const result = await generateContentWithFallback({
      systemInstruction,
      prompt: contents
    });

    return res.json({
      success: true,
      response: result.text,
      modelUsed: result.modelUsed,
      attempts: result.attempts,
      mode,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Reflect Endpoint Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process reflection with Gemini AI.",
      isAuthError: error?.message?.includes("GEMINI_API_KEY")
    });
  }
});

// Auto-Categorization & Deep Summary Extraction Endpoint
app.post("/api/analyze-entry", async (req, res) => {
  try {
    const data = (req.body && typeof req.body === "object") ? req.body : {};
    const entryText = sanitizeInput(data.text, 10000);

    if (!entryText.trim()) {
      return res.status(400).json({ error: "Entry text is required for analysis." });
    }

    const analysisPrompt = `Analyze the following user journal entry / reflection. Provide a structured analysis in valid JSON matching this exact structure:
{
  "title": "A concise, evocative 3-6 word title summarizing the entry",
  "summary": "A 2-sentence executive distillation of their core insight or dilemma",
  "mood": "One of: Grounded, Curious, Energized, Anxious, Reflective, Overwhelmed, Victorious, Contemplative",
  "sentimentScore": 0.85, // Float between -1.0 (very negative) and +1.0 (very positive)
  "keyThemes": ["theme1", "theme2", "theme3"], // 2 to 4 keywords
  "actionItem": "One single high-leverage next step or affirmation"
}

Journal Content to analyze:
"""
${entryText}
"""
Respond strictly with valid JSON only, no markdown wrapping or preamble.`;

    const result = await generateContentWithFallback({
      systemInstruction: "You are an analytical cognitive parser. Output valid JSON only.",
      prompt: analysisPrompt
    });

    let parsed = null;
    try {
      const cleanJson = result.text.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        title: "Personal Reflection",
        summary: result.text.slice(0, 160),
        mood: "Reflective",
        sentimentScore: 0.5,
        keyThemes: ["Journal", "Insight"],
        actionItem: "Continue exploring your thoughts with curiosity."
      };
    }

    return res.json({
      success: true,
      analysis: parsed,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error("[Analyze Entry Error]:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze entry."
    });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC ASSET SERVING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReflectIQ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
