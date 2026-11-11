// ============================================================
// VoiceInterface — Main call control & audio animation
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import type { CallStatus } from "../types";

interface VoiceInterfaceProps {
  status: CallStatus;
  currentTranscript: string;
  onStartCall: () => void;
  onEndCall: () => void;
  onReset: () => void;
  onInterrupt?: () => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  status,
  currentTranscript,
  onStartCall,
  onEndCall,
  onReset,
  onInterrupt,
}) => {
  // Live call duration timer
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isCallActive = status === "listening" || status === "speaking" || status === "processing" || status === "connecting";
    if (isCallActive && !timerRef.current) {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else if (!isCallActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (status === "idle") setCallSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Browser compatibility check
  const isChrome = typeof navigator !== "undefined" && /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
  const isEdge = typeof navigator !== "undefined" && /Edg/.test(navigator.userAgent);
  const isSupportedBrowser = isChrome || isEdge;

  const getStatusBadge = () => {
    switch (status) {
      case "idle":
        return {
          text: "Ready to Call",
          color: "bg-gray-100 text-gray-700 border-gray-300",
          dot: "bg-gray-400",
        };
      case "connecting":
        return {
          text: "Connecting to AI KAM...",
          color: "bg-amber-50 text-amber-800 border-amber-300 animate-pulse",
          dot: "bg-amber-500",
        };
      case "listening":
        return {
          text: "Listening to Seller (Speak now)...",
          color: "bg-emerald-50 text-emerald-800 border-emerald-300",
          dot: "bg-emerald-500 animate-ping",
        };
      case "processing":
        return {
          text: "Analyzing Data & Formulating Advice...",
          color: "bg-blue-50 text-blue-800 border-blue-300",
          dot: "bg-blue-500 animate-spin",
        };
      case "speaking":
        return {
          text: "Riya is Speaking (Click to Interrupt)",
          color: "bg-purple-50 text-purple-800 border-purple-300",
          dot: "bg-purple-500 animate-bounce",
        };
      case "ended":
        return {
          text: "Call Completed — Summary Ready",
          color: "bg-gray-100 text-gray-800 border-gray-300",
          dot: "bg-red-500",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-between relative overflow-hidden">
      {/* Background ambient glow based on state */}
      {status === "listening" && (
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" />
      )}
      {status === "speaking" && (
        <div className="absolute inset-0 bg-purple-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Chrome browser warning */}
      {!isSupportedBrowser && status === "idle" && (
        <div className="w-full mb-3 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Best in Google Chrome.</strong> Voice features require Chrome or Edge for full speech recognition support.</span>
        </div>
      )}

      {/* Top status indicator */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
            Voice Channel
          </span>
          {callSeconds > 0 && status !== "idle" && (
            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
              🕐 {formatTime(callSeconds)}
            </span>
          )}
        </div>
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          {badge.text}
        </div>
      </div>

      {/* Center Interactive Orb / Waveform Visualizer */}
      <div className="my-4 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center">
          {/* Pulsing rings */}
          {status === "listening" && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-emerald-400/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/30 animate-pulse" />
            </>
          )}
          {status === "speaking" && (
            <>
              <div className="absolute w-32 h-32 rounded-full bg-purple-400/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-purple-500/30 animate-pulse" />
            </>
          )}
          {status === "processing" && (
            <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-blue-500 animate-spin" />
          )}

          {/* Core Avatar Button — Clickable to Interrupt when Speaking */}
          <button
            type="button"
            onClick={() => {
              if (status === "speaking" && onInterrupt) {
                onInterrupt();
              } else if (status === "idle") {
                onStartCall();
              }
            }}
            title={
              status === "speaking"
                ? "Click to interrupt Riya immediately"
                : status === "idle"
                ? "Click to start call"
                : undefined
            }
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 z-10 cursor-pointer ${
              status === "listening"
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white scale-110 shadow-emerald-500/30"
                : status === "speaking"
                ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white scale-105 shadow-purple-500/40 hover:scale-110 ring-4 ring-purple-300/60 animate-pulse"
                : status === "processing"
                ? "bg-gradient-to-tr from-blue-600 to-cyan-600 text-white shadow-blue-500/30"
                : status === "ended"
                ? "bg-gray-100 text-gray-400 border-2 border-gray-300"
                : "bg-gradient-to-tr from-red-600 to-rose-500 text-white hover:scale-105 shadow-red-500/30"
            }`}
          >
            {status === "listening" ? (
              <svg className="w-9 h-9 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : status === "speaking" ? (
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : status === "ended" ? (
              <svg className="w-9 h-9 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Real-time audio wave visualization bar */}
        <div className="flex items-center gap-1.5 h-7 mt-3.5">
          {[...Array(9)].map((_, i) => {
            const isActive = status === "speaking" || status === "listening";
            const delays = [0.1, 0.3, 0.2, 0.4, 0.15, 0.35, 0.25, 0.45, 0.2];
            const heights = isActive ? ["h-3.5", "h-6", "h-4.5", "h-7", "h-5", "h-7", "h-4.5", "h-6", "h-2.5"] : ["h-1.5"];
            return (
              <span
                key={i}
                style={{ animationDelay: `${delays[i]}s` }}
                className={`w-1 rounded-full transition-all duration-200 ${
                  status === "speaking"
                    ? "bg-purple-500 animate-pulse"
                    : status === "listening"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-gray-300"
                } ${isActive ? heights[i] : "h-1.5"}`}
              />
            );
          })}
        </div>

        {/* Live speech feedback string */}
        {currentTranscript && (
          <div className="mt-2.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-full font-medium max-w-xs truncate animate-fadeIn">
            🎤 &ldquo;{currentTranscript}&rdquo;
          </div>
        )}

        {/* Prominent Single Interruption Pill Button */}
        {status === "speaking" && onInterrupt && (
          <button
            type="button"
            onClick={onInterrupt}
            className="mt-2.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer animate-pulse"
            title="Interrupt Riya mid-sentence to speak"
          >
            <span>✋</span>
            <span>Tap to Interrupt Riya (or speak)</span>
          </button>
        )}
      </div>

      {/* Action controls button */}
      <div className="w-full flex items-center justify-center pt-2">
        {status === "idle" && (
          <button
            onClick={onStartCall}
            className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Start Voice Call with KAM
          </button>
        )}

        {(status === "listening" || status === "speaking" || status === "processing" || status === "connecting") && (
          <button
            onClick={onEndCall}
            className="w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.279 3H5z" />
            </svg>
            End Call & Generate Summary
          </button>
        )}

        {status === "ended" && (
          <button
            onClick={onReset}
            className="w-full py-3 px-6 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start New Session
          </button>
        )}
      </div>

      <p className="text-gray-600 text-center text-xs mt-3">
        Natural two-way voice with automatic turn-taking • Real-time STT/TTS
      </p>
    </div>
  );
};

