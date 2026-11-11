# 🎙️ Snapdeal Mini AI Voice KAM

An AI-powered Virtual Key Account Manager (KAM) built for Snapdeal sellers, designed to diagnose sales drops and provide data-grounded business interventions through real-time voice conversation.

Built for the **Snapdeal AI First Intern Assignment** by **Naveen**.

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
