// ============================================================
// TranscriptPanel — Live two-way conversation transcript
// With quick prompt chips & interactive voice/text input
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import type { Message, CallStatus } from "../types";

interface TranscriptPanelProps {
  messages: Message[];
  status: CallStatus;
  currentTranscript: string;
  onSendMessage?: (text: string) => void;
  onInterrupt?: () => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  messages,
  status,
  currentTranscript,
  onSendMessage,
  onInterrupt,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");

  // Only scroll the internal transcript container when a new message is committed.
  // NEVER scroll the outer browser window!
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !onSendMessage) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const quickPrompts = [
    { label: "Sales Drop", text: "My sales have dropped significantly this month. I don't understand why. Can you help me?" },
    { label: "Inventory Delays", text: "We ran into severe supplier delays, causing key items to go out of stock." },
    { label: "Fulfillment Issues", text: "Delayed courier pickups made buyers cancel their orders. What should we do?" },
    { label: "Action Steps", text: "What practical steps should we take right now to recover our store?" },
    { label: "Price Strategy", text: "Would reducing our prices help win back customer volume?" },
    { label: "Paid Marketing", text: "Should we run sponsored ads or promotions to boost our visibility?" },
    { label: "Limited Budget", text: "We have limited working capital right now. How should we prioritize?" },
    { label: "Search Penalties", text: "Why are order cancellations hurting our search ranking on Snapdeal?" },
    { label: "Finalize Plan", text: "That makes sense. Thank you Riya, please prepare our recovery plan." },
  ];

  const isCallLive =
    status === "listening" ||
    status === "speaking" ||
    status === "processing";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Live Call Transcript & Audio Stream
            </h3>
            <p className="text-[11px] text-gray-500">
              Two-Way Synchronized Voice Dialogue
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {status === "speaking" && onInterrupt && (
            <button
              type="button"
              onClick={onInterrupt}
              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer animate-pulse"
              title="Interrupt Riya immediately"
            >
              <span>✋</span>
              <span>Interrupt Riya</span>
            </button>
          )}
          <span className="text-xs text-gray-600 font-medium">
            {messages.length} utterances
          </span>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1 min-h-[260px] max-h-[380px]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl mb-2">
              🎙️
            </div>
            <p className="text-sm font-semibold text-gray-600">
              Conversation has not started yet
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Click &ldquo;Start Voice Call with KAM&rdquo; to begin. Riya will greet you, and you can speak into your microphone or click the prompt chips below.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm ${
                  isUser
                    ? "bg-gray-800 text-white font-bold"
                    : "bg-red-600 text-white font-bold"
                }`}
              >
                {isUser ? "S" : "R"}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-sm ${
                  isUser
                    ? "bg-gray-900 text-white rounded-tr-none"
                    : "bg-red-50/70 border border-red-100 text-gray-900 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`text-[11px] font-bold ${
                      isUser ? "text-gray-300" : "text-red-700"
                    }`}
                  >
                    {isUser ? "Seller (You)" : "Riya (Snapdeal KAM)"}
                  </span>
                  <span
                    className={`text-[10px] ${
                      isUser ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Interim live speech preview (while user speaks) */}
        {status === "listening" && currentTranscript && (
          <div className="flex items-start gap-2.5 flex-row-reverse animate-pulse">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">
              S
            </div>
            <div className="max-w-[80%] rounded-2xl p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm rounded-tr-none">
              <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                Listening to your mic...
              </span>
              <p className="italic">&ldquo;{currentTranscript}&rdquo;</p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {status === "processing" && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span className="font-semibold">
              Riya is analyzing seller telemetry and formulating recommendations...
            </span>
          </div>
        )}

        {/* Speaking indicator with inline interrupt action */}
        {status === "speaking" && onInterrupt && (
          <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-xl my-1 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              <span className="text-xs font-semibold text-purple-900">
                Riya is currently speaking...
              </span>
            </div>
            <button
              type="button"
              onClick={onInterrupt}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
              title="Interrupt Riya to speak now"
            >
              <span>✋</span>
              <span>Interrupt & Speak</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Clickable Script Chips (Directly accessible in call — no tab switching) */}
      {isCallLive && (
        <div className="pt-2 pb-1 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Quick In-Call Dialogue Prompts (Click to say):
            </span>
            <span className="text-[10px] text-gray-400">or use microphone below</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-[105px] overflow-y-auto pr-0.5">
            {quickPrompts.map((item, i) => (
              <button
                key={i}
                type="button"
                disabled={status === "processing"}
                onClick={() => onSendMessage && onSendMessage(item.text)}
                title={item.text}
                className="text-[11px] bg-gray-50 hover:bg-red-50 hover:text-red-700 hover:border-red-300 border border-gray-200 text-gray-700 px-2 py-1 rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-200/80 px-1 py-0.2 rounded text-gray-700 shrink-0">
                  {item.label}
                </span>
                <span className="truncate max-w-[200px] sm:max-w-[240px]">
                  &ldquo;{item.text}&rdquo;
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Input Bar for Hybrid Voice + Typing */}
      {isCallLive && (
        <form onSubmit={handleSend} className="mt-2 flex gap-2">
          {status === "speaking" && onInterrupt && (
            <button
              type="button"
              onClick={onInterrupt}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 animate-pulse"
              title="Interrupt Riya mid-sentence to speak or type"
            >
              <span>✋</span>
              <span>Interrupt</span>
            </button>
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={status === "processing"}
            placeholder={
              status === "listening"
                ? "Speak into mic or type your answer here..."
                : status === "speaking"
                ? "Riya is speaking (click Interrupt or type to speak)..."
                : "Riya is analyzing..."
            }
            className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-xl outline-none focus:border-red-500 bg-gray-50 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || status === "processing"}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Send
          </button>
        </form>
      )}

      {/* Footer hint */}
      <div className="text-[11px] text-gray-500 text-center border-t border-gray-100 pt-2 mt-2">
        Speak naturally via your microphone or use the prompts above • Powered by Gemini 3.5 Flash-Lite
      </div>
    </div>
  );
};
