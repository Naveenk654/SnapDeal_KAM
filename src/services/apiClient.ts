// ============================================================
// API Client — Communicates with the Express Backend
// Keeps Gemini and Jev API keys securely on the server
// ============================================================

import type { CallSummary, JevAnalysis, Message, SellerData } from "../types";

export interface ServerConfig {
  hasGeminiKey: boolean;
  hasJevKey: boolean;
  model: string;
}

/** Check server status and key availability */
export async function getServerConfig(): Promise<ServerConfig | null> {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Fetch KAM opening greeting from backend */
export async function getBackendGreeting(sellerData: SellerData): Promise<string> {
  try {
    const res = await fetch("/api/greeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerData }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.greeting || "Hi there! I'm Riya, your Key Account Manager at Snapdeal. How can I help you today?";
  } catch (err) {
    console.warn("Failed to fetch greeting from backend, using default:", err);
    return "Hi there! I'm Riya, your Key Account Manager at Snapdeal. How can I help you today?";
  }
}

/** Send seller utterance to backend for Jev classification + Gemini Flash response */
export async function sendBackendChat(
  message: string,
  history: Message[],
  sellerData: SellerData
): Promise<{ response: string; jevAnalysis: JevAnalysis | null }> {
  const formattedHistory = history.map((m) => ({
    role: m.role,
    text: m.content,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: formattedHistory,
      sellerData,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Backend returned HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    response: data.response,
    jevAnalysis: data.jevAnalysis || null,
  };
}

/** Fetch end-of-call summary from backend */
export async function getBackendSummary(
  history: Message[],
  sellerData: SellerData
): Promise<CallSummary> {
  const formattedHistory = history.map((m) => ({
    role: m.role,
    text: m.content,
  }));

  const res = await fetch("/api/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history: formattedHistory,
      sellerData,
    }),
  });

  if (!res.ok) {
    throw new Error(`Summary API returned HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.summary;
}

