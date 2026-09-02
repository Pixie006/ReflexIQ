import { ChatMessage, EntryAnalysis, ReflectionMode } from "../types";

export interface ReflectResponse {
  success: boolean;
  response: string;
  modelUsed: string;
  attempts: string[];
  mode: ReflectionMode;
  timestamp: string;
}

export class AIService {
  /**
   * Calls the secure server-side Gemini multi-turn reflection endpoint
   */
  static async sendReflectionMessage(params: {
    userId: string;
    message: string;
    mode: ReflectionMode;
    history: ChatMessage[];
  }): Promise<ReflectResponse> {
    const res = await fetch("/api/reflect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: params.userId,
        message: params.message,
        mode: params.mode,
        history: params.history.map(h => ({
          role: h.role,
          content: h.content
        }))
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Generates summary, title, mood, and cognitive tags from journal transcript
   */
  static async analyzeEntryTranscript(text: string): Promise<{
    analysis: EntryAnalysis;
    modelUsed: string;
  }> {
    const res = await fetch("/api/analyze-entry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Analysis error: ${res.status}`);
    }

    return await res.json();
  }
}
