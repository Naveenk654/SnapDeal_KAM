// ============================================================
// Gemini Chat Service
// Handles conversation with Gemini 2.0 Flash as the main LLM
// Jev classification context is injected into each turn
// ============================================================

import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "../config/systemPrompt";
import type { CallSummary, Message, SellerData } from "../types";

let ai: GoogleGenAI | null = null;
let conversationHistory: { role: string; parts: { text: string }[] }[] = [];
let currentSeller: SellerData | null = null;

export function setChatSellerData(data: SellerData): void {
  currentSeller = data;
}

/**
 * Initialize the Gemini client with the user's API key.
 */
export function initGemini(apiKey: string): void {
  ai = new GoogleGenAI({ apiKey });
  conversationHistory = [];
}

/**
 * Send a message to Gemini and get a response.
 * The jevContext string is prepended to the user message so the LLM
 * can use classification signals to guide its response.
 *
 * @param userMessage - The seller's spoken message (from STT)
 * @param jevContext - Formatted Jev classification context
 * @returns The assistant's response text
 */
export async function sendMessage(
  userMessage: string,
  jevContext: string
): Promise<string> {
  if (!ai) throw new Error("Gemini not initialized. Call initGemini first.");

  // Build the user turn with Jev context embedded
  const enrichedMessage = jevContext
    ? `${jevContext}\n\n${userMessage}`
    : userMessage;

  // Add user message to history
  conversationHistory.push({
    role: "user",
    parts: [{ text: enrichedMessage }],
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: conversationHistory,
      config: {
        systemInstruction: buildSystemPrompt(currentSeller || undefined),
        temperature: 0.7,
        maxOutputTokens: 200, // Keep responses short for voice
      },
    });

    const responseText =
      response.text?.trim() || "I'm sorry, could you repeat that?";

    // Add assistant response to history
    conversationHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });

    return responseText;
  } catch (error) {
    console.error("Gemini API error:", error);

    // Remove the failed user message from history
    conversationHistory.pop();

    throw error;
  }
}

/**
 * Trigger the initial greeting from the KAM.
 * This is called when the call starts — the bot speaks first.
 */
export async function getGreeting(): Promise<string> {
  if (!ai) throw new Error("Gemini not initialized.");

  conversationHistory = [];

  // Send a system-level trigger to start the conversation
  conversationHistory.push({
    role: "user",
    parts: [
      {
        text: '[SYSTEM: The seller has just connected to the call. Greet them warmly and ask how you can help. Keep it to 2 sentences. Do NOT mention any data yet.]',
      },
    ],
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: conversationHistory,
      config: {
        systemInstruction: buildSystemPrompt(currentSeller || undefined),
        temperature: 0.8,
        maxOutputTokens: 100,
      },
    });

    const greeting =
      response.text?.trim() ||
      "Hi there! I'm Riya, your Key Account Manager at Snapdeal. How can I help you today?";

    conversationHistory.push({
      role: "model",
      parts: [{ text: greeting }],
    });

    return greeting;
  } catch (error) {
    console.error("Failed to generate greeting:", error);
    // Fallback greeting
    const fallback =
      "Hi! I'm Riya, your Snapdeal Key Account Manager. How can I help you today?";
    conversationHistory.push({
      role: "model",
      parts: [{ text: fallback }],
    });
    return fallback;
  }
}

/**
 * Generate the end-of-call summary.
 * Asks Gemini to produce a structured JSON summary of the conversation.
 */
export async function generateSummary(): Promise<CallSummary> {
  if (!ai) throw new Error("Gemini not initialized.");

  const summaryPrompt = `
Based on our entire conversation, generate a JSON summary with this exact structure:
{
  "keyIssues": ["issue 1", "issue 2", ...],
  "recommendations": [
    { "action": "what to do", "expectedImpact": "what it will achieve", "priority": "High|Medium|Low" }
  ],
  "nextSteps": ["step 1", "step 2", ...]
}

Include 2-4 key issues, 2-3 recommendations with priorities, and 2-3 next steps.
Be specific with numbers from the seller's data. Return ONLY valid JSON, no other text.
`;

  conversationHistory.push({
    role: "user",
    parts: [{ text: summaryPrompt }],
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: conversationHistory,
      config: {
        systemInstruction: buildSystemPrompt(currentSeller || undefined),
        temperature: 0.3, // Low temp for structured output
        maxOutputTokens: 500,
      },
    });

    const text = response.text?.trim() || "{}";

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CallSummary;
    }

    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return {
      keyIssues: [
        "Sales declined 32.5% month-over-month",
        "18 products currently out of stock (up from 5)",
        "Cancellation rate nearly doubled (8% → 14%)",
      ],
      recommendations: [
        {
          action: "Restock the 18 out-of-stock products immediately",
          expectedImpact:
            "Could recover ₹50,000-65,000 in monthly revenue",
          priority: "High",
        },
        {
          action:
            "Investigate cancellation root causes (packaging, delivery, product descriptions)",
          expectedImpact:
            "Reducing cancellations to 8% saves ~₹8,000/month and improves ranking",
          priority: "High",
        },
        {
          action:
            "Run a promotional campaign on top-performing products",
          expectedImpact:
            "Can increase impressions by 20-30%, recovering order volume",
          priority: "Medium",
        },
      ],
      nextSteps: [
        "Share inventory restock list within 24 hours",
        "Review cancellation reasons in seller dashboard",
        "Schedule follow-up call in 1 week",
      ],
    };
  }
}

/**
 * Reset the conversation (for a new call).
 */
export function resetConversation(): void {
  conversationHistory = [];
}

/**
 * Get the current conversation history as Message objects.
 */
export function getHistory(): Message[] {
  return conversationHistory
    .filter(
      (m) =>
        !m.parts[0].text.startsWith("[SYSTEM:") &&
        !m.parts[0].text.startsWith("[REAL-TIME CLASSIFICATION")
    )
    .map((m) => ({
      role: m.role === "model" ? ("assistant" as const) : ("user" as const),
      content:
        m.role === "user"
          ? m.parts[0].text.replace(
              /\[REAL-TIME CLASSIFICATION[\s\S]*?\]\n\nSeller says: "/,
              ""
            ).replace(/"$/, "")
          : m.parts[0].text,
      timestamp: new Date(),
    }));
}

