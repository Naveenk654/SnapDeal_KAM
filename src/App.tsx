// ============================================================
// App.tsx — Main Snapdeal AI Voice KAM Dashboard
// Fullstack production architecture (Railway ready)
// ============================================================

import React, { useState, useEffect } from "react";
import type { SellerData } from "./types";
import { SELLER_PROFILES } from "./data/sellerData";
import { useVoiceKAM } from "./hooks/useVoiceKAM";
import { getServerConfig } from "./services/apiClient";
import { Header } from "./components/Header";
import { VoiceInterface } from "./components/VoiceInterface";
import { SellerDashboard } from "./components/SellerDashboard";
import { ClassificationPanel } from "./components/ClassificationPanel";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { SummaryCard } from "./components/SummaryCard";
import { SellerEditorModal } from "./components/SellerEditorModal";

export const App: React.FC = () => {
  const [serverHasKey, setServerHasKey] = useState<boolean>(true);
  const [serverHasJevKey, setServerHasJevKey] = useState<boolean>(true);
  const [activeSeller, setActiveSeller] = useState<SellerData>(SELLER_PROFILES[0]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [state, actions] = useVoiceKAM();

  // Initialize voice services and check backend status
  useEffect(() => {
    actions.initialize();
    actions.updateSellerData(activeSeller);

    getServerConfig().then((cfg) => {
      if (cfg?.hasGeminiKey) {
        setServerHasKey(true);
        setServerHasJevKey(cfg.hasJevKey);
      }
    });
  }, [actions, activeSeller]);

  // When summary is generated, smoothly bring it into view without leaving the call
  useEffect(() => {
    if (state.summary) {
      const summaryEl = document.getElementById("action-plan-summary");
      if (summaryEl) {
        summaryEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [state.summary]);

  const handleSellerChange = (newData: SellerData) => {
    setActiveSeller(newData);
    actions.updateSellerData(newData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-900">
      <Header />

      {/* Sub-navigation bar with Account Selector & Quick Settings */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Active Seller Scenario Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800">
              Active Seller:
            </span>
            <select
              value={activeSeller.seller.name}
              onChange={(e) => {
                const found = SELLER_PROFILES.find((p) => p.seller.name === e.target.value);
                if (found) handleSellerChange(found);
              }}
              className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md px-2 py-1 outline-none cursor-pointer"
            >
              {SELLER_PROFILES.map((p, idx) => (
                <option key={idx} value={p.seller.name}>
                  {p.seller.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="text-xs text-red-600 hover:text-red-700 font-bold underline ml-1 cursor-pointer"
            >
              Custom Data
            </button>
          </div>

          <div className="flex items-center gap-3">
            {serverHasKey && (
              <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Backend Secured Mode
              </span>
            )}

            {state.summary && (
              <a
                href="#action-plan-summary"
                className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>📋</span>
                <span>View Action Plan ↓</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Error alert banner */}
      {state.error && (
        <div className="max-w-7xl mx-auto px-4 mt-3 w-full">
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-semibold">{state.error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="underline text-xs font-bold cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area — Single Unified Workspace (No Tab Switching) */}
      <main className="max-w-7xl mx-auto px-4 py-5 w-full flex-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 4 Cols: Voice Control Interface */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <VoiceInterface
              status={state.status}
              currentTranscript={state.currentTranscript}
              onStartCall={actions.startCall}
              onEndCall={actions.endCall}
              onReset={() => {
                actions.startCall();
              }}
              onInterrupt={actions.interrupt}
            />

            <ClassificationPanel
              analysis={state.jevAnalysis}
              hasJevKey={Boolean(serverHasJevKey)}
            />
          </div>

          {/* Right 8 Cols: Dynamic Seller Dashboard + Real-time Transcript */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <SellerDashboard
              data={activeSeller}
              onEdit={() => setIsEditorOpen(true)}
            />

            <div className="flex-1">
              <TranscriptPanel
                messages={state.messages}
                status={state.status}
                currentTranscript={state.currentTranscript}
                onSendMessage={actions.sendMessageToKAM}
                onInterrupt={actions.interrupt}
              />
            </div>
          </div>
        </div>

        {/* Executive Action Plan (Seamlessly rendered in-call) */}
        {state.summary && (
          <div id="action-plan-summary" className="pt-2 animate-fadeIn">
            <SummaryCard
              summary={state.summary}
              onNewCall={() => {
                actions.startCall();
              }}
            />
          </div>
        )}
      </main>

      {/* Custom Telemetry / Scenario Switcher Modal */}
      {isEditorOpen && (
        <SellerEditorModal
          currentData={activeSeller}
          onSave={handleSellerChange}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-500">
        Snapdeal AI First Assignment • Mini AI Voice KAM • Fullstack Express + Web Speech STT/TTS + Gemini 3.5 Flash-Lite + TypeSafe Jev
      </footer>
    </div>
  );
};
