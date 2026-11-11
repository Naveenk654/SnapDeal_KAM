// ============================================================
// SetupScreen — API key entry before starting the call
// ============================================================

import { useState } from "react";
import type { ApiKeys } from "../types";

interface SetupScreenProps {
  onSetup: (keys: ApiKeys) => void;
}

export function SetupScreen({ onSetup }: SetupScreenProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [jevKey, setJevKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    onSetup({
      geminiApiKey: geminiKey.trim(),
      jevApiKey: jevKey.trim(),
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        {/* Hero section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎙️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            AI Voice KAM Setup
          </h2>
          <p className="text-gray-500 mt-2">
            Enter your API keys to power the voice assistant
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gemini API Key — Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gemini API Key{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type={showKeys ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get free from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:underline"
              >
                Google AI Studio
              </a>{" "}
              — Powers the conversation brain (Gemini 2.0 Flash)
            </p>
          </div>

          {/* Jev API Key — Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jev API Key{" "}
              <span className="text-gray-400 text-xs font-normal">
                (optional — enables smart classification)
              </span>
            </label>
            <input
              type={showKeys ? "text" : "password"}
              value={jevKey}
              onChange={(e) => setJevKey(e.target.value)}
              placeholder="ts_..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              From{" "}
              <a
                href="https://typesafe.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:underline"
              >
                TypeSafe AI
              </a>{" "}
              — Adds real-time intent, sentiment & issue classification
            </p>
          </div>

          {/* Show/hide toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showKeys}
              onChange={() => setShowKeys(!showKeys)}
              className="rounded border-gray-300"
            />
            Show API keys
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!geminiKey.trim()}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            🚀 Start Voice KAM
          </button>
        </form>

        {/* Tech stack info */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">
            Powered by (all free)
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span className="bg-gray-50 px-2.5 py-1 rounded">
              🗣️ Web Speech API
            </span>
            <span className="bg-gray-50 px-2.5 py-1 rounded">
              🧠 Gemini Flash
            </span>
            <span className="bg-gray-50 px-2.5 py-1 rounded">
              🎯 Jev AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

