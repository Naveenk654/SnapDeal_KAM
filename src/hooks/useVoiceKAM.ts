// ============================================================
// useVoiceKAM — Main orchestration hook
// Supports both Backend API Server Mode (Railway/Production)
// and Client-Side Fallback Mode with two-way voice turn taking
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import type { CallStatus, Message, JevAnalysis, CallSummary, ApiKeys, SellerData } from "../types";
import { SELLER_PROFILES } from "../data/sellerData";
import { SpeechToText, TextToSpeech } from "../services/speechService";
import {
  getBackendGreeting,
  sendBackendChat,
  getBackendSummary,
} from "../services/apiClient";
import {
  classifyUtterance,
  formatJevContextForLLM,
} from "../services/jevClassifier";
import {
  initGemini,
  sendMessage,
  getGreeting,
  generateSummary,
  resetConversation,
  setChatSellerData,
} from "../services/geminiChat";

export interface VoiceKAMState {
  status: CallStatus;
  messages: Message[];
  currentTranscript: string; // Interim STT text while user speaks
  jevAnalysis: JevAnalysis | null;
  summary: CallSummary | null;
  error: string | null;
}

export interface VoiceKAMActions {
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  sendMessageToKAM: (text: string) => Promise<void>;
  interrupt: () => void;
  initialize: (keys?: ApiKeys) => void;
  updateSellerData: (data: SellerData) => void;
}

export function useVoiceKAM(): [VoiceKAMState, VoiceKAMActions] {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [jevAnalysis, setJevAnalysis] = useState<JevAnalysis | null>(null);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sttRef = useRef<SpeechToText | null>(null);
  const ttsRef = useRef<TextToSpeech | null>(null);
  const apiKeysRef = useRef<ApiKeys | null>(null);
  const sellerDataRef = useRef<SellerData>(SELLER_PROFILES[0]);
  const isCallActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  const startCallRef = useRef<() => Promise<void>>(async () => {});

  // Initialize API clients
  const initialize = useCallback((keys?: ApiKeys) => {
    if (keys && keys.geminiApiKey) {
      apiKeysRef.current = keys;
      initGemini(keys.geminiApiKey);
    }
    sttRef.current = new SpeechToText();
    ttsRef.current = new TextToSpeech();
  }, []);

  const updateSellerData = useCallback((data: SellerData) => {
    sellerDataRef.current = data;
    setChatSellerData(data);
  }, []);

  // Add a message to the conversation
  const addMessage = useCallback((role: Message["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: new Date() },
    ]);
  }, []);

  // Forward conversation turn to AI and speak response
  const processUserTurn = useCallback(
    async (finalText: string) => {
      if (!finalText.trim() || !isCallActiveRef.current) {
        return;
      }
      if (isProcessingRef.current) {
        console.warn("Already fetching AI response, skipping duplicate turn:", finalText);
        return;
      }

      // Check for voice reset command
      const cleanCmd = finalText.trim().toLowerCase().replace(/[.,!]/g, "");
      if (
        cleanCmd === "restart" ||
        cleanCmd === "reset" ||
        cleanCmd === "start over" ||
        cleanCmd === "start again" ||
        cleanCmd === "restart call"
      ) {
        console.log("🔄 Voice command detected: Restarting session...");
        isProcessingRef.current = false;
        sttRef.current?.stop();
        ttsRef.current?.stop();
        setCurrentTranscript("");
        await startCallRef.current();
        return;
      }

      // Instantly stop any speech in progress
      ttsRef.current?.stop();

      isProcessingRef.current = true;
      sttRef.current?.stop();
      setCurrentTranscript("");
      addMessage("user", finalText);
      setStatus("processing");

      try {
        let responseText = "";
        let analysis: JevAnalysis | null = null;

        // Attempt 1: Call Backend Server API (Production / Railway)
        try {
          const backendResult = await sendBackendChat(
            finalText,
            messages,
            sellerDataRef.current
          );
          responseText = backendResult.response;
          analysis = backendResult.jevAnalysis;
        } catch (backendErr: any) {
          console.warn("Backend call failed, inspecting fallback:", backendErr.message);

          // Only attempt client fallback if client API key was explicitly entered
          if (apiKeysRef.current?.geminiApiKey) {
            let jevContext = "";
            if (apiKeysRef.current?.jevApiKey) {
              const contextStr = messages
                .map((m) => `${m.role === "user" ? "Seller" : "KAM"}: ${m.content}`)
                .slice(-6)
                .join("\n");

              analysis = await classifyUtterance(
                finalText,
                contextStr,
                apiKeysRef.current.jevApiKey
              );
              jevContext = formatJevContextForLLM(analysis);
            }

            responseText = await sendMessage(finalText, jevContext);
          } else {
            throw new Error(backendErr.message || "Failed to reach AI server");
          }
        }

        if (analysis) {
          setJevAnalysis(analysis);
        }

        addMessage("assistant", responseText);
        setError(null);

        // Crucial: Release AI generation lock BEFORE speaking so interruptions can occur!
        isProcessingRef.current = false;

        // Speak response via browser TTS with full-duplex voice barge-in
        if (ttsRef.current && isCallActiveRef.current) {
          setStatus("speaking");

          // Keep background listening active so speaking into mic cuts off Riya mid-sentence!
          sttRef.current?.start(
            (interim) => {
              if (ttsRef.current?.getIsSpeaking()) {
                console.log("⚡ Voice Barge-In: Interrupted Riya with speech:", interim);
                ttsRef.current.stop();
                setStatus("listening");
                setCurrentTranscript(interim);
              }
            },
            (final) => {
              if (ttsRef.current?.getIsSpeaking()) {
                ttsRef.current.stop();
              }
              processUserTurn(final);
            },
            (err) => console.warn("Barge-in STT:", err)
          );

          await ttsRef.current.speak(responseText);
        }

        // When Riya naturally finishes speaking without interruption, resume standard listening
        if (isCallActiveRef.current && !ttsRef.current?.getIsSpeaking()) {
          setStatus("listening");
          sttRef.current?.start(
            (interim) => setCurrentTranscript(interim),
            (final) => processUserTurn(final),
            (err) => console.warn("STT error:", err)
          );
        }
      } catch (err) {
        console.error("Conversation error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        isProcessingRef.current = false;
        if (isCallActiveRef.current) {
          setStatus("listening");
          sttRef.current?.start(
            (interim) => setCurrentTranscript(interim),
            (final) => processUserTurn(final),
            (err) => console.warn("STT error:", err)
          );
        }
      }
    },
    [addMessage, messages]
  );

  // Start a new call
  const startCall = useCallback(async () => {
    setStatus("connecting");
    setMessages([]);
    setJevAnalysis(null);
    setSummary(null);
    setError(null);
    setCurrentTranscript("");
    resetConversation();
    isCallActiveRef.current = true;
    isProcessingRef.current = false;

    // Play instant connection chime so seller knows audio channel is active!
    ttsRef.current?.playConnectChime();

    try {
      const storeName = sellerDataRef.current.seller.name || "your store";
      const greeting = `Hello, this is Riya calling from Snapdeal Key Account Management. It is wonderful to connect with ${storeName} today! How are things running on your store, and how can I best support you?`;

      addMessage("assistant", greeting);

      // Speak the greeting immediately with zero network latency and barge-in!
      if (ttsRef.current) {
        setStatus("speaking");
        sttRef.current?.start(
          (interim) => {
            if (ttsRef.current?.getIsSpeaking()) {
              console.log("⚡ Voice Barge-In on greeting:", interim);
              ttsRef.current.stop();
              setStatus("listening");
              setCurrentTranscript(interim);
            }
          },
          (final) => {
            if (ttsRef.current?.getIsSpeaking()) {
              ttsRef.current.stop();
            }
            processUserTurn(final);
          },
          (err) => console.warn("Greeting STT:", err)
        );

        await ttsRef.current.speak(greeting);
      }

      // Start listening for seller voice
      if (isCallActiveRef.current && !ttsRef.current?.getIsSpeaking()) {
        setStatus("listening");
        sttRef.current?.start(
          (interim) => setCurrentTranscript(interim),
          (final) => processUserTurn(final),
          (err) => {
            console.warn("STT error on start:", err);
            if (err === "not-allowed") {
              setError("Microphone access blocked. Please allow microphone in Chrome settings or use quick-prompts below.");
            }
          }
        );
      }
    } catch (err) {
      console.error("Failed to start call:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setStatus("idle");
      isCallActiveRef.current = false;
    }
  }, [addMessage, processUserTurn]);

  startCallRef.current = startCall;

  // End the call and generate summary
  const endCall = useCallback(async () => {
    isCallActiveRef.current = false;
    isProcessingRef.current = false;

    sttRef.current?.stop();
    ttsRef.current?.stop();

    setStatus("processing");
    setCurrentTranscript("");

    try {
      let callSummary: CallSummary | null = null;

      try {
        callSummary = await getBackendSummary(messages, sellerDataRef.current);
      } catch (err) {
        console.warn("Backend summary failed, trying client fallback:", err);
      }

      if (!callSummary) {
        if (apiKeysRef.current?.geminiApiKey) {
          callSummary = await generateSummary();
        }
      }

      setSummary(callSummary);
    } catch (err) {
      console.error("Failed to generate summary:", err);
      setSummary({
        keyIssues: ["Review the transcript above for diagnostic details"],
        recommendations: [],
        nextSteps: [],
      });
    }

    setStatus("ended");
  }, [messages]);

  // Manual / UI Interruption
  const interrupt = useCallback(() => {
    if (!isCallActiveRef.current) return;
    console.log("✋ Interruption triggered");
    ttsRef.current?.stop();
    isProcessingRef.current = false;
    setStatus("listening");
    setCurrentTranscript("");
    sttRef.current?.stop();
    sttRef.current?.start(
      (interim) => setCurrentTranscript(interim),
      (final) => processUserTurn(final),
      (err) => console.warn("Interrupted STT error:", err)
    );
  }, [processUserTurn]);

  // Allow manual input / quick-prompt click (instantly interrupts Riya if speaking!)
  const sendMessageToKAM = useCallback(
    async (text: string) => {
      if (!isCallActiveRef.current) return;
      console.log("💬 Prompt/chat message triggered:", text);
      ttsRef.current?.stop();
      isProcessingRef.current = false;
      await processUserTurn(text);
    },
    [processUserTurn]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCallActiveRef.current = false;
      sttRef.current?.stop();
      ttsRef.current?.stop();
    };
  }, []);

  const state: VoiceKAMState = {
    status,
    messages,
    currentTranscript,
    jevAnalysis,
    summary,
    error,
  };

  const actions: VoiceKAMActions = {
    startCall,
    endCall,
    sendMessageToKAM,
    interrupt,
    initialize,
    updateSellerData,
  };

  return [state, actions];
}
