// ============================================================
// Jev Classification Service (TypeSafe AI)
// Uses Jev's discriminative model for:
//   - Intent classification (choice)
//   - Sentiment detection (noul)
//   - Issue diagnosis (choice)
//   - Conversation stage tracking (choice)
// ============================================================

import type { JevAnalysis, JevChoiceResult, JevNoulResult } from "../types";

const JEV_ENDPOINT = "/api/jev"; // Proxied through Vite dev server

/**
 * Classify a user utterance using Jev's discriminative model.
 * Returns structured classifications with calibrated probabilities.
 *
 * Why Jev > LLM for this:
 * - Zero hallucination (schema-locked outputs)
 * - Calibrated probabilities (not just labels)
 * - 70-500ms latency (faster than any LLM)
 * - Deterministic — same input always gives consistent classification
 */
export async function classifyUtterance(
  utterance: string,
  conversationContext: string,
  apiKey: string
): Promise<JevAnalysis> {
  const state = `CURRENT UTTERANCE: "${utterance}"\n\nCONVERSATION CONTEXT:\n${conversationContext}`;

  try {
    const response = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "jev-latest",
        state,
        questions: {
          intent: {
            type: "choice",
            instructions: "Classify the primary intent of the seller's message.",
            criteria: {
              greeting: "Seller is saying hello or introducing themselves",
              sales_complaint: "Seller is expressing concern or complaining about sales drop",
              inventory_question: "Seller mentions stock, supply, or out-of-stock items",
              cancellation_concern: "Seller discusses order cancellations, late dispatch, or courier returns",
              general_question: "General question or acknowledging KAM's advice",
              asking_for_help: "Seller is asking for practical recommendations or solutions",
            },
          },
          is_frustrated: {
            type: "noul",
            instructions: "Does the seller express frustration, anxiety, or distress about their business?",
          },
          is_urgent: {
            type: "noul",
            instructions: "Does the message convey acute urgency or critical financial pressure?",
          },
          primary_issue: {
            type: "choice",
            instructions: "Identify the primary operational issue mentioned by the seller.",
            criteria: {
              inventory_shortage: "Out-of-stock SKUs, supplier delay, or inventory stockouts",
              high_cancellations: "Customer cancellations, courier return rates, or packaging defects",
              pricing_problem: "Pricing uncompetitive or average selling price changes",
              low_visibility: "Listing impressions, views, or algorithmic search suppression",
              not_yet_identified: "Specific root cause has not yet been identified",
            },
          },
          conversation_stage: {
            type: "choice",
            instructions: "Determine the active stage of this business conversation.",
            criteria: {
              greeting: "Initial connection or pleasantries",
              problem_description: "Seller describing their sales decline",
              diagnostic_questions: "Seller answering diagnostic follow-up questions",
              recommendations: "Discussing action items and recovery steps",
              summary_closing: "Wrapping up conversation and requesting summary",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Jev API returned ${response.status}, using fallback classifications`);
      return getFallbackAnalysis();
    }

    const data = await response.json();

    return {
      intent: data.intent as JevChoiceResult,
      isFrustrated: data.is_frustrated as JevNoulResult,
      isUrgent: data.is_urgent as JevNoulResult,
      primaryIssue: data.primary_issue as JevChoiceResult,
      conversationStage: data.conversation_stage as JevChoiceResult,
    };
  } catch (error) {
    console.warn("Jev classification failed, using fallback:", error);
    return getFallbackAnalysis();
  }
}

/**
 * Fallback analysis when Jev API is unavailable.
 * Uses simple heuristics — nowhere near Jev's accuracy,
 * but keeps the app functional.
 */
function getFallbackAnalysis(): JevAnalysis {
  return {
    intent: {
      key: "general_question",
      probabilities: { general_question: 0.5 },
      confidence: 0.3,
    },
    isFrustrated: { type: "noul", noul: 0.5 },
    isUrgent: { type: "noul", noul: 0.5 },
    primaryIssue: {
      key: "not_yet_identified",
      probabilities: { not_yet_identified: 0.5 },
      confidence: 0.3,
    },
    conversationStage: {
      key: "problem_description",
      probabilities: { problem_description: 0.5 },
      confidence: 0.3,
    },
  };
}

/**
 * Format Jev analysis into a context string for the LLM.
 * This is injected into the Gemini prompt so the LLM can use
 * the classification signals to guide its response.
 */
export function formatJevContextForLLM(analysis: JevAnalysis): string {
  const topIssues = Object.entries(analysis.primaryIssue.probabilities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
    .join(", ");

  return `
[REAL-TIME CLASSIFICATION — use this to guide your response]
• Intent: ${analysis.intent.key} (confidence: ${(analysis.intent.confidence * 100).toFixed(0)}%)
• Frustration Level: ${(analysis.isFrustrated.noul * 100).toFixed(0)}%${analysis.isFrustrated.noul > 0.6 ? " ⚠️ BE EXTRA EMPATHETIC" : ""}
• Urgency: ${(analysis.isUrgent.noul * 100).toFixed(0)}%${analysis.isUrgent.noul > 0.7 ? " ⚠️ PRIORITIZE QUICK WINS" : ""}
• Top Issues: ${topIssues}
• Conversation Stage: ${analysis.conversationStage.key}
`.trim();
}

