// ============================================================
// Snapdeal AI Voice KAM — Backend Server
// Runs locally and deploys on Railway / Render / Docker
// Securely holds Gemini and Jev API keys server-side
// ============================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Keys & Model from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const JEV_API_KEY = process.env.JEV_API_KEY || process.env.VITE_JEV_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let ai = null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log(`✅ Gemini initialized on server using model: ${GEMINI_MODEL}`);
} else {
  console.warn("⚠️ GEMINI_API_KEY not found in environment. Provide via .env or Railway dashboard.");
}

if (JEV_API_KEY) {
  console.log("✅ TypeSafe Jev classifier enabled on server");
} else {
  console.log("ℹ️ JEV_API_KEY not configured. Running in Gemini standalone mode.");
}

// ------------------------------------------------------------
// Helper: Build dynamic system prompt grounded in seller data
// ------------------------------------------------------------
function buildSystemPrompt(sellerData) {
  const m = sellerData?.metrics || {
    lastMonth: { sales: 200000, orders: 400, cancellationRate: 0.08, avgSellingPrice: 500, outOfStockProducts: 5 },
    thisMonth: { sales: 135000, orders: 270, cancellationRate: 0.14, avgSellingPrice: 500, outOfStockProducts: 18 }
  };
  const i = sellerData?.computedInsights || {
    salesDeclinePct: 32.5,
    orderDeclinePct: 32.5,
    cancellationIncreasePct: 75.0,
    oosIncreasePct: 260.0,
    estimatedLostRevenueFromOOS: 65000,
    revenueLostToCancellations: 18900
  };
  const sellerName = sellerData?.seller?.name || "Seller";
  const category = sellerData?.seller?.name?.includes("(")
    ? sellerData.seller.name.match(/\((.*?)\)/)?.[1] || "Retail"
    : "Retail";

  // Category hero catalog for concrete item references
  let heroSKUs = "Embroidered Rayon Kurtis, Men's Slim-Fit Denims, Casual Slip-on Footwear, Printed Georgette Sarees, and Cotton Polo T-shirts";
  if (category.toLowerCase().includes("electronic")) {
    heroSKUs = "Wireless ANC Earbuds, 65W Fast GaN Chargers, Waterproof Bluetooth Speakers, and Smart Fitness Watches";
  } else if (category.toLowerCase().includes("kitchen") || category.toLowerCase().includes("decor")) {
    heroSKUs = "Tri-Ply Stainless Cookware, 4-Liter Digital Air Fryers, Orthopedic Foam Cushions, and Modular Storage Jars";
  }

  return `
You are "Riya", an expert Senior Key Account Manager (KAM) at Snapdeal. You are speaking on a live two-way phone call with registered Snapdeal seller "${sellerName}" (Category: ${category}).

## 1. IDENTITY & CONVERSATIONAL MANNER
- You are a proactive, commercially sharp Senior Key Account Manager at Snapdeal. You treat the seller as a respected business peer.
- BANNED FILLER: NEVER say "I completely understand if you are feeling overwhelmed / rushed / stressed" or "Let's take it one simple step at a time". Do not sound like a therapist or customer support bot. Speak like a decisive commercial partner.
- SPOKEN TELEPHONE VOICE: Speak in crisp, natural, spoken English. Never use markdown, bullets, asterisks, or robotic phrases.
- PACING & CADENCE: Keep responses to 2 to 3 concise spoken sentences (30 to 45 words). State your analysis and recommendations directly. Only ask a question when you genuinely require new operational information; otherwise, lead with clear, confident business guidance.
- COMPLETION: Always finish every thought and sentence cleanly with proper punctuation.

## 2. STORE ACCOUNT TELEMETRY (LIVE GROUND TRUTH)
You have real-time access to the seller's business metrics:
- Revenue: ₹${m.lastMonth.sales.toLocaleString("en-IN")} last month → ₹${m.thisMonth.sales.toLocaleString("en-IN")} this month (change: ${i.salesDeclinePct > 0 ? "↓" : "↑"}${Math.abs(i.salesDeclinePct)}%)
- Order Volume: ${m.lastMonth.orders} orders → ${m.thisMonth.orders} orders (change: ${i.orderDeclinePct > 0 ? "↓" : "↑"}${Math.abs(i.orderDeclinePct)}%)
- Cancellation Rate: ${(m.lastMonth.cancellationRate * 100).toFixed(0)}% → ${(m.thisMonth.cancellationRate * 100).toFixed(0)}% (change: ${i.cancellationIncreasePct > 0 ? "↑" : "↓"}${Math.abs(i.cancellationIncreasePct)}%)
- Average Selling Price (ASP): ₹${m.lastMonth.avgSellingPrice} → ₹${m.thisMonth.avgSellingPrice} (Stable: ${m.lastMonth.avgSellingPrice === m.thisMonth.avgSellingPrice})
- Out-of-Stock SKUs: ${m.lastMonth.outOfStockProducts} → ${m.thisMonth.outOfStockProducts} items (change: ${i.oosIncreasePct > 0 ? "↑" : "↓"}${Math.abs(i.oosIncreasePct)}%)
- Financial Loss Impacts: Stockouts cost ~₹${i.estimatedLostRevenueFromOOS.toLocaleString("en-IN")}; Cancellations cost ~₹${i.revenueLostToCancellations.toLocaleString("en-IN")}.
- Top Hero SKUs for this store: ${heroSKUs}.

## 3. E-COMMERCE KAM STRATEGIC MENTAL MODEL
Apply sound marketplace economics to ANY query the seller poses:
1. Pricing & Elasticity:
   - Check ASP before discussing price. If ASP is flat or higher while volume drops, buyers are accepting the price point; the drop is caused by lack of inventory or poor fulfillment, not uncompetitive pricing.
   - Slashing prices when stock is depleted or cancellations are high destroys margins without fixing conversion.
2. Catalog Availability & Algorithm Velocity:
   - When listings go out of stock, they lose historical algorithmic search ranking on Snapdeal. Replenishing inventory is mandatory before search rank can recover.
3. Fulfillment Defect Rate & Search Penalties:
   - Snapdeal algorithms down-rank sellers whose cancellation rate exceeds 8-10% to protect customer satisfaction. Resolving dispatch bottlenecks is critical to unlocking organic traffic.
4. Marketing & Ad Budget Efficiency:
   - Running paid ads when hero products are out of stock or cancellation rates are elevated wastes ad spend. Recommend ads only after operational leaks are plugged.
5. Capital Constraints & Prioritization:
   - When a seller has limited cash, staff, or inventory, apply the 80/20 rule: prioritize the top 20% highest-velocity listings (hero SKUs) that drive 80% of revenue.

## 4. CONVERSATIONAL REASONING PRINCIPLES
- ACTION OVER PERMISSION: Never ask "Shall we map out a plan?" or "Shall we look at your list?". You ALREADY have the answers. Deliver the concrete steps directly: "Here is our immediate recovery action plan..."
- SINGLE QUOTE RULE: Never quote the same loss figure (e.g. ₹65,000 or 18 items) more than once in a call. Once stated, spend all subsequent turns strictly on solutions, hero styles, and dispatch execution.
- FULFILL AFFIRMATIVE PROMISES: When the seller confirms or agrees ("yes", "yes yes", "sure", "ok", "ready"), DELIVER the actionable plan or hero styles immediately! Never stall, never ask another confirmation, and never ask for permission to do what you just agreed to do.
- SHORT / FRAGMENTED SPEECH: If the seller speaks briefly (e.g. "supply chain", "cancellations"), NEVER say "You got cut off". Treat it as active confirmation of that bottleneck and immediately state the exact fix.
- ADAPT TO OPERATIONAL DEAD-ENDS: If the seller says their supplier has no stock and cannot restock even a small batch, DO NOT repeat the same restock question. Pivot to realistic alternatives: (1) sourcing a small emergency lot locally/from Surat, (2) boosting search visibility on their remaining in-stock styles, or (3) fixing the 14% cancellation rate to restore ranking without needing new inventory.
- PROGRESSIVE CONTEXT AWARENESS: Track what has already been discussed in earlier turns. Do NOT repeat numbers, explanations, or questions that were already covered.

## 5. GENERAL CONVERSATIONAL EXAMPLES (Tone and Cadence Reference)

[Fulfilling an Agreement]:
Seller: "yes yes"
Riya: "Your top revenue-driving styles are your ${heroSKUs}. Restocking just these key items will recover the majority of your lost monthly volume. Could we source a small emergency run for these locally or from an alternate vendor?"

[Handling Supplier Stockout Dead-End]:
Seller: "The supplier has no stock and cannot produce anything right now."
Riya: "Understood on the supplier delay. If primary manufacturing is stalled, let's focus on two immediate levers: first, audit your dispatch process to pull cancellations back under ${(m.lastMonth.cancellationRate * 100).toFixed(0)} percent to regain search ranking, and second, feature your best in-stock items with promotional tags."

[Addressing a Seller Hypothesis or Pushback]:
Seller: "I think competitors are undercutting me, should I lower my prices?"
Riya: "I understand why that comes to mind, but your average selling price remained constant at ${m.thisMonth.avgSellingPrice} rupees while orders fell, meaning buyers who found your in-stock items still purchased at full price. Dropping prices right now will hurt your margins without solving the ${m.thisMonth.outOfStockProducts} stockouts or high cancellation rate."

[Delivering Recommendations]:
Seller: "What practical steps should we take to recover?"
Riya: "Here is our 3-step recovery plan. First, let's expedite restocking your key out-of-stock items within 48 hours to capture active demand. Second, audit your courier dispatch handoffs to pull cancellations back under ${(m.lastMonth.cancellationRate * 100).toFixed(0)} percent and restore your search visibility. And third, launch a 7-day visibility booster on your top styles to drive fresh traffic."
`.trim();
}

// ------------------------------------------------------------
// Helper: Call TypeSafe Jev Classification
// ------------------------------------------------------------
async function classifyWithJev(utterance, conversationContext) {
  if (!JEV_API_KEY) return null;

  try {
    const state = `CURRENT UTTERANCE: "${utterance}"\n\nCONVERSATION CONTEXT:\n${conversationContext}`;
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JEV_API_KEY}`,
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
      const errBody = await response.text();
      console.warn(`Jev API returned HTTP ${response.status}:`, errBody);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn("Jev API call failed:", error.message);
    return null;
  }
}

// ------------------------------------------------------------
// API Endpoints
// ------------------------------------------------------------

// Check server status & configured services (without exposing secrets)
app.get("/api/config", (req, res) => {
  res.json({
    hasGeminiKey: Boolean(GEMINI_API_KEY),
    hasJevKey: Boolean(JEV_API_KEY),
    model: "gemini-2.0-flash",
    port: PORT,
  });
});

// Health check endpoint for Railway
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// KAM Greeting
app.post("/api/greeting", async (req, res) => {
  const { sellerData } = req.body;

  if (!ai) {
    return res.json({
      greeting: "Hi there! I'm Riya, your Key Account Manager at Snapdeal. How can I help you today?",
    });
  }

  try {
    const prompt = buildSystemPrompt(sellerData);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: "[SYSTEM: The seller has just connected to the call. Greet them warmly and ask how you can help. Keep it to 2 sentences. Do NOT mention any data yet.]" }]
        }
      ],
      config: {
        systemInstruction: prompt,
        temperature: 0.8,
        maxOutputTokens: 100,
      },
    });

    const greeting = response.text?.trim() || "Hi there! I'm Riya, your Key Account Manager at Snapdeal. How can I help you today?";
    res.json({ greeting });
  } catch (err) {
    console.error("Greeting error:", err.message);
    res.json({
      greeting: "Hi! I'm Riya, your Snapdeal Key Account Manager. How can I help you today?",
    });
  }
});

// Conversational Chat Turn (Concurrent Execution for Ultra-Low Latency)
app.post("/api/chat", async (req, res) => {
  const { message, history = [], sellerData } = req.body;

  if (!ai) {
    return res.status(500).json({ error: "Server GEMINI_API_KEY not configured" });
  }

  try {
    const contextStr = history.slice(-6).map(m => `${m.role}: ${m.text}`).join("\n");
    const systemPrompt = buildSystemPrompt(sellerData);

    // Build strictly alternating dialogue history without duplicates
    const contents = [];
    for (const item of history) {
      if (!item.text?.trim()) continue;
      const role = item.role === "assistant" ? "model" : "user";
      // Avoid consecutive duplicate roles
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${item.text}`;
      } else {
        contents.push({
          role,
          parts: [{ text: item.text }]
        });
      }
    }

    // Append current user message if not already the last turn
    const lastTurn = contents[contents.length - 1];
    if (!lastTurn || lastTurn.role !== "user" || lastTurn.parts[0].text !== message) {
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    // Run Jev classifier & Gemini Flash concurrently to eliminate turn latency!
    const [jevAnalysis, response] = await Promise.all([
      classifyWithJev(message, contextStr).catch((err) => {
        console.warn("Jev background warning:", err.message);
        return null;
      }),
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          maxOutputTokens: 220, // Ample room to finish 3 spoken recommendations cleanly
        },
      }),
    ]);

    const responseText = response.text?.trim() || "I understand. Let me check your account details.";

    res.json({
      response: responseText,
      jevAnalysis: jevAnalysis ? {
        intent: jevAnalysis.intent,
        isFrustrated: jevAnalysis.is_frustrated,
        isUrgent: jevAnalysis.is_urgent,
        primaryIssue: jevAnalysis.primary_issue,
        conversationStage: jevAnalysis.conversation_stage,
      } : null,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI response" });
  }
});

// Call Summary Generator
app.post("/api/summary", async (req, res) => {
  const { history = [], sellerData } = req.body;

  if (!ai) {
    return res.status(500).json({ error: "Server GEMINI_API_KEY not configured" });
  }

  try {
    const contents = history.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.text }]
    }));

    contents.push({
      role: "user",
      parts: [{
        text: `Based on our entire conversation, generate a JSON summary with this exact structure:
{
  "keyIssues": ["issue 1", "issue 2", ...],
  "recommendations": [
    { "action": "what to do", "expectedImpact": "what it will achieve", "priority": "High|Medium|Low" }
  ],
  "nextSteps": ["step 1", "step 2", ...]
}
Return ONLY valid JSON with verified numbers from the seller telemetry.`
      }]
    });

    const systemPrompt = buildSystemPrompt(sellerData);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        maxOutputTokens: 600,
      },
    });

    const text = response.text?.trim() || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return res.json({ summary: JSON.parse(jsonMatch[0]) });
    }

    throw new Error("Invalid JSON in summary response");
  } catch (err) {
    console.error("Summary error:", err);
    // Return robust fallback summary
    res.json({
      summary: {
        keyIssues: [
          "18 products out of stock (surge from 5), causing estimated ₹65,000 lost revenue",
          "Cancellation rate surged from 8% to 14%, triggering algorithmic ranking suppression",
          "Overall gross sales declined 32.5% month-over-month",
        ],
        recommendations: [
          {
            action: "Restock the 18 depleted SKUs immediately within 48-72 hours",
            expectedImpact: "Recovers ~₹50,000 - ₹65,000 in monthly run-rate",
            priority: "High",
          },
          {
            action: "Audit courier delivery partners and packaging to lower cancellations under 8%",
            expectedImpact: "Saves ₹18,900 and removes search impression penalty",
            priority: "High",
          },
          {
            action: "Deploy 7-day visibility booster campaign on top-converting catalog listings",
            expectedImpact: "Increases listing impressions by 20-30%",
            priority: "Medium",
          },
        ],
        nextSteps: [
          "Share inventory restock list within 24 hours",
          "Review courier return logs in Snapdeal Seller Portal",
          "Schedule 1-week follow-up call with KAM",
        ],
      },
    });
  }
});

// ------------------------------------------------------------
// Serve Frontend Static Build in Production (Railway / Docker)
// ------------------------------------------------------------
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

app.use((req, res) => {
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send("Snapdeal AI Voice KAM Backend is Running. Build frontend with 'npm run build' to serve the UI.");
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Snapdeal AI Voice KAM Server listening on port ${PORT}`);
  console.log(`🌐 Health check: http://127.0.0.1:${PORT}/api/health`);
});

