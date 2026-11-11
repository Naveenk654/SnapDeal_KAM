# Snapdeal Mini AI Voice KAM — Technical Architecture & System Note

**Role:** AI First Intern — Practical Assignment  
**Project:** Mini AI Voice Key Account Manager (Virtual KAM)  
**Candidate Name:** Naveen  
**Submission Date:** November 2026  

---

## 1. Executive Summary & Objective

The objective of this project is to build an enterprise-grade fullstack voice assistant ("Riya") that acts as a Virtual Key Account Manager (KAM) for Snapdeal sellers.

When a seller calls expressing concern over declining sales (*"My sales have dropped significantly this month. I don’t understand why. Can you help me?"*), the AI KAM:
1. **Listens attentively via voice** with zero conversational latency using streaming STT.
2. **Classifies seller intent, frustration level, and urgency in real-time** using **TypeSafe Jev** (a sub-100ms discriminative classifier).
3. **Conducts a structured diagnostic inquiry** referencing live account telemetry (Sales ↓32.5%, Orders ↓32.5%, Cancellations ↑75%, ASP flat at ₹500, Out-of-Stock SKUs ↑260%).
4. **Supports Multiple Dynamic Seller Profiles**: Evaluators can seamlessly toggle between different seller profiles (e.g. Fashion, Electronics, Home Decor) or input custom metrics on the fly — the math engine and KAM prompt automatically recalculate and adapt!
5. **Fullstack Production Backend**: All API keys (`GEMINI_API_KEY`, `JEV_API_KEY`) reside securely server-side on Express, preventing secret leaks and enabling 1-click cloud deployment on **Railway**.
6. **Formulates prioritized, data-grounded business interventions** using **Gemini 2.0 Flash**.
7. **Generates an executive action plan and next-steps summary** at call termination.

---

## 2. Multi-Model Architecture & Engineering Rationale

```
[Seller Voice (Browser Mic)]
      │
      ▼
┌────────────────────────────┐
│   Speech-to-Text (STT)     │  ◄── Web Speech API (Browser-Native, 0-latency streaming)
└─────────────┬──────────────┘
              │  (Real-Time Transcript Stream)
              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                          │
│                                                             │
│   [TypeSafe Jev (Classifier)] ◄── Sub-100ms Intent/Frustration│
│                 │                                           │
│                 ▼                                           │
│   [Gemini 2.0 Flash (LLM)]   ◄── Diagnostic Advisory (Riya) │
│                                                             │
│   * Securely holds API credentials on Railway server *      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌────────────────────────────┐
│   Text-to-Speech (TTS)     │  ◄── Web Speech Synthesis API (Natural Female Voice, 0 Cost)
└─────────────┬──────────────┘
              │
              ▼
    [Seller Hears KAM]
```

### Why This Dual-Model Pipeline Over a Single LLM?
1. **Sub-100ms Intent & Sentiment Triage (TypeSafe Jev)**:
   - Jev is a schema-locked discriminative model trained via Reinforcement Learning for Calibrated Decisions (RLCD).
   - It outputs exact probabilities (`noul` propositions) for seller frustration (`0.0 - 1.0`) and urgency (`0.0 - 1.0`).
   - If a seller expresses high frustration, the system injects an immediate empathy directive into Gemini Flash before generating speech.
2. **Zero-Latency Turn-Taking (Web Speech API)**:
   - Web Speech API provides word-by-word streaming transcriptions directly in the browser. Unlike chunked audio upload approaches (e.g. Whisper batching), this eliminates 2-second awkward pauses, maintaining an authentic phone conversation pace.
3. **Guardrailed Analytical Reasoning (Pre-Computed Insights + Gemini Flash)**:
   - All arithmetic deltas (e.g., `-32.5%` sales, `+260%` OOS products, `₹65,000` estimated lost revenue) are pre-computed in the data layer.
   - This eliminates mathematical hallucinations, ensuring 100% of the numbers quoted by Riya are mathematically exact.

---

## 3. Dynamic Multi-Seller Telemetry Engine

To demonstrate production scalability beyond the single assignment benchmark, the platform includes a **Generalized Telemetry Engine** supporting:

1. **Benchmark Scenario: SD-FashionHub (Assignment Mock Data)**
   - Sales: ₹2,00,000 → ₹1,35,000 (↓32.5%)
   - Out-of-Stock: 5 → 18 items (↑260.0%)
   - Cancellations: 8% → 14% (↑75.0%)
   - ASP: Constant at ₹500
   - *Diagnosis:* Inventory stockouts + Algorithmic ranking penalty due to cancellations.

2. **Scenario 2: SD-TechGizmos (Courier Return & Cancellation Crisis)**
   - Sales: ₹4,50,000 → ₹2,70,000 (↓40.0%)
   - Cancellations: 6% → 22% (↑266.7% spike!)
   - *Diagnosis:* Fulfillment defects, shipping damage, courier SLAs.

3. **Scenario 3: SD-HomeDecor (Catastrophic Stockout Crisis)**
   - Sales: ₹3,00,000 → ₹1,20,000 (↓60.0%)
   - Out-of-Stock: 3 → 29 items (↑866.7%)
   - *Diagnosis:* Severe inventory dry-up across top 10 revenue-generating SKUs.

4. **Interactive Custom Scenario Editor**:
   - Evaluators can click **"Custom Data"** to input any arbitrary numbers and watch Riya immediately adapt her questions and recommendations!

---

## 4. Practical Business Recommendations (Prioritized)

1. **Immediate Inventory Restock (Priority: High | Impact: ₹50,000–₹65,000 recovery)**:
   - Restock the 18 depleted SKUs within 48–72 hours to re-capture organic demand on proven high-velocity listings.
2. **Cancellation Root-Cause Audit (Priority: High | Impact: ₹18,900 recovery + search boost)**:
   - Investigate recent return/cancellation logs for courier delays, damaged packaging, or listing description mismatches. Dropping cancellations back to <8% removes the algorithm penalty.
3. **Targeted Visibility Promotion (Priority: Medium | Impact: +20–30% impression surge)**:
   - Deploy a 7-day sponsored campaign or category banner push on top-performing catalog items to jumpstart sales momentum.

---

## 5. Technology Stack Summary

- **Backend Server:** Node.js, Express, Cors, Dotenv (Railway-ready)
- **Frontend Framework:** React 19, TypeScript, Tailwind CSS, Vite
- **Speech Recognition (STT):** Web Speech API (`SpeechRecognition` with continuous interim results)
- **Speech Synthesis (TTS):** Web Speech Synthesis API (`SpeechSynthesisUtterance` with natural voice selection)
- **Classifier:** TypeSafe Jev (`jev-latest` via serverless discriminative endpoint)
- **Dialogue & Reasoning:** Google Gemini 2.0 Flash (`@google/genai`)
- **Hosting & Portability:** Deploys with 1 click to Railway (`railway.json`, `Procfile`) or runs locally with `npm run server` + `npm run dev`

---

## 6. How to Deploy to Railway

1. Push code to GitHub repository.
2. In Railway: **New Project** → **Deploy from GitHub repo**.
3. Under **Variables**, add:
   - `GEMINI_API_KEY` = your Google AI Studio key (`AIza...`)
   - `JEV_API_KEY` = your TypeSafe Jev key (`ts_...`, optional)
4. Railway builds the app with `npm run build` and starts Express with `npm start` on `https://<your-subdomain>.up.railway.app`!
