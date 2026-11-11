# 🎙️ Snapdeal Mini AI Voice KAM

An AI-powered Virtual Key Account Manager (KAM) built for Snapdeal sellers, designed to diagnose sales drops and provide data-grounded business interventions through real-time voice conversation.

Built for the **Snapdeal AI First Intern Assignment** by **Naveen**.

---

## 🌐 Live Production Demo

👉 **[https://snapdealkam.up.railway.app](https://snapdealkam.up.railway.app)**  
*(Best experienced in Google Chrome for browser-native speech recognition & voice synthesis)*

---

## 🌟 Key Features

- **Fullstack Production Architecture:** Express backend holds API keys securely server-side; ready for 1-click deployment on Railway / Render / Docker.
- **Two-Way Conversational Voice:** Browser-native STT and TTS with zero latency and turn-taking.
- **Dynamic Multi-Seller Telemetry Engine:** Pre-configured with multiple seller profiles (Fashion, Electronics, Home Decor) + interactive Custom Data Editor.
- **Discriminative Intelligence (TypeSafe Jev):** Real-time calibrated probabilities for intent, frustration, urgency, and issue root causes (~70ms).
- **Generative Strategy (Gemini 2.0 Flash):** Empathetic, concise (2-3 sentences), data-backed business advisory tailored for voice.
- **Pre-Computed Analytical Insights:** Automated calculation of deltas, percentages, and financial impacts to ensure 0% math hallucination.
- **Interactive Telemetry Dashboard:** Visual breakdown of monthly sales, cancellation rate, ASP, and out-of-stock items with MoM deltas.
- **Executive Action Plan:** Automated structured summary with prioritized recommendations and next steps upon call conclusion.
- **100% Free & Portable:** Free tiers of Google AI Studio, TypeSafe Jev, and Railway.

---

## 🛠️ Architecture

```
[Seller Voice (Mic)] ──► [Web Speech STT]
                               │ (Transcript Stream)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND                          │
│                                                             │
│   [TypeSafe Jev] ──► Calibrated Intent & Frustration        │
│          │                                                  │
│          ▼                                                  │
│   [Gemini 2.0 Flash] ──► Empathetic KAM Advisory (Riya)     │
│                                                             │
│   * API Keys (GEMINI_API_KEY, JEV_API_KEY) kept secure *    │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Spoken Response)
                               ▼
[Browser Speaker] ◄── [Web Speech Synthesis TTS]
```

---

## 📊 Sample Seller Data & Stated Assumptions (Assignment Section 4)

The assignment provides the following benchmark mock telemetry for the core diagnostic scenario:

| Metric | Last Month | This Month | MoM Delta | Status |
|---|---|---|---|---|
| **Monthly Revenue** | ₹2,00,000 | ₹1,35,000 | **↓ 32.5%** | Severe top-line contraction |
| **Completed Orders** | 400 | 270 | **↓ 32.5%** | Volume decline proportional to sales |
| **Cancellation Rate** | 8.0% | 14.0% | **↑ 75.0%** | Critical algorithmic penalty zone |
| **Average Selling Price (ASP)** | ₹500 | ₹500 | **0.0% (Constant)** | Rules out price elasticity/resistance |
| **Out-of-Stock SKUs** | 5 | 18 | **↑ 260.0%** | Primary root cause (13 key styles lost) |

### 📌 Stated Assumptions (As explicitly permitted in Section 4):
1. **Financial Loss Modeling:**
   - **Stockout Loss (~₹65,000/month):** Based on historical catalog contribution (~₹5,000/month per core SKU in a ~40-product active catalog), the 13 newly depleted SKUs account for roughly ₹65,000 in uncaptured monthly run-rate.
   - **Cancellation Loss (~₹18,900/month):** 270 orders × ₹500 ASP × 14% cancellation rate = ₹18,900 lost directly from unfulfilled orders.
2. **Marketplace Search Algorithm Ranking:**
   - Snapdeal's catalog search algorithms penalize listings with cancellation rates exceeding 8–10% to protect customer satisfaction. The surge from 8% to 14% explains the secondary loss in listing search impressions.
3. **Price Inelasticity (Ruling Out Price Cuts):**
   - Because ASP remained perfectly constant at ₹500 across both months, buyers who found in-stock items converted at full price. Slashing prices is assumed to be counter-productive (destroys margins without resolving inventory shortages).
4. **Hero SKU 80/20 Rule:**
   - The top 20% highest-velocity apparel SKUs (Embroidered Rayon Kurtis, Men's Slim-Fit Denims, Casual Slip-on Footwear) drive 80% of volume and are prioritized for 48-hour emergency restocking.
5. **Multi-Seller Generalization:**
   - The default scenario (`SD-FashionHub`) represents the exact assignment mock data. Two additional comparative profiles (`SD-TechGizmos` and `SD-HomeDecor`) and an interactive `Custom Data Editor` are provided to prove the AI engine generalizes dynamically across different metrics without hardcoded scripts.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root folder with your keys:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_key
   JEV_API_KEY=ts_...your_optional_jev_key
   PORT=5000
   ```

3. Start the application:
   - **Fullstack Mode (Frontend + Backend):**
     ```bash
     # Terminal 1: Start Backend Server
     npm run server

     # Terminal 2: Start Vite Dev Server
     npm run dev
     ```
   - Open `http://localhost:3000` in Google Chrome.

---

## 🚂 Deploying on Railway (1-Click Ready)

This repo is structured for zero-config Railway deployment:

1. Push this repository to GitHub.
2. In [Railway.app](https://railway.app), click **"New Project"** → **"Deploy from GitHub repo"**.
3. In the Railway dashboard under **Variables**, set:
   - `GEMINI_API_KEY` = your Google AI Studio key (`AIza...`)
   - `JEV_API_KEY` = your TypeSafe Jev key (`ts_...`, optional)
4. Railway automatically detects `railway.json` / `Procfile`, runs `npm run build`, and starts the production server on Railway's assigned port!
5. Open your public Railway URL (e.g. `https://your-app.up.railway.app`) in Chrome!

---

## 📄 Submission Documents

- **Candidate:** Naveen
- **Architecture Note:** [Naveen_Snapdeal_AI_Voice_KAM_System_Note.md](Naveen_Snapdeal_AI_Voice_KAM_System_Note.md) (1-page architecture, dual-model explanation, and diagnostic breakdown)
- **Original Assignment:** [Snapdeal_AI_Voice_KAM_Assignment.docx](Snapdeal_AI_Voice_KAM_Assignment.docx)
