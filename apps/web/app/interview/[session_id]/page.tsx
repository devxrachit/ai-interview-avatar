"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";

import AvatarViewer from "@/components/avatar/AvatarViewer";
import VoiceCapture, { speakText } from "@/components/voice/VoiceCapture";
import { InterviewWebSocket } from "@/lib/websocket";
import { useInterviewStore, useAuthStore } from "@/stores/interviewStore";

const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), { ssr: false });

interface Message {
  speaker: "interviewer" | "candidate" | "system";
  text: string;
  timestamp: number;
}

interface Question {
  id: string;
  text: string;
  index: number;
  type: string;
}

interface ScoreData {
  correctness: number;
  communication: number;
  edge_case_handling: number;
  time_complexity_awareness: number;
  overall: number;
  feedback: string;
  suggested_follow_up_topics: string[];
}

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.session_id as string;
  const router = useRouter();
  const { data: nextAuthSession, status: authStatus } = useSession();
  const token = useAuthStore((s) => s.token);
  const store = useInterviewStore();

  const wsRef = useRef<InterviewWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [textInput, setTextInput] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [ending, setEnding] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get auth token (NextAuth session token or manual JWT)
  const authToken = token || nextAuthSession?.backendToken || "";

  useEffect(() => {
    if (authStatus === "unauthenticated" && !token) {
      router.push("/login");
      return;
    }
    if (!sessionId) return;
    store.reset();
    store.setSession(sessionId);
    connectWS();

    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      wsRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, authToken]);

  function connectWS() {
    const ws = new InterviewWebSocket(sessionId, authToken);
    wsRef.current = ws;

    ws.on("connected", () => {
      store.setConnected(true);
      store.setStatus("setup");
      setTimeout(() => ws.sendReady(), 500);
    });

    ws.on("question", (msg: Record<string, unknown>) => {
      const data = msg.data as Question;
      store.setCurrentQuestion(data);
      store.setAvatarState("speaking");
      store.addMessage({ speaker: "interviewer", text: data.text });
      speakText(data.text, () => store.setAvatarState("listening"));
    });

    ws.on("interviewer_response", (msg: Record<string, unknown>) => {
      const text = msg.text as string;
      store.addMessage({ speaker: "interviewer", text });
      store.setAvatarState("speaking");
      speakText(text, () => store.setAvatarState("idle"));
    });

    ws.on("score_update", (msg: Record<string, unknown>) => {
      store.setLastScore(msg.data as ScoreData);
    });

    ws.on("transcript", (msg: Record<string, unknown>) => {
      store.addMessage({ speaker: "candidate", text: msg.text as string });
    });

    ws.on("session_end", (msg: Record<string, unknown>) => {
      store.setReportId(msg.report_id as string);
      store.setStatus("done");
      router.push(`/results/${sessionId}`);
    });

    ws.on("error", (msg: Record<string, unknown>) => {
      console.error("WS error:", msg.message);
    });

    ws.connect().catch((e) => console.error("WS connect failed:", e));
  }

  function handleVoiceTranscript(text: string) {
    if (!store.currentQuestion) return;
    store.addMessage({ speaker: "candidate", text });
    store.setAvatarState("thinking");
    wsRef.current?.sendTextAnswer(store.currentQuestion.id, text, showCode ? store.code : undefined);
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textInput.trim() || !store.currentQuestion) return;
    const answer = textInput.trim();
    setTextInput("");
    store.addMessage({ speaker: "candidate", text: answer });
    store.setAvatarState("thinking");
    wsRef.current?.sendTextAnswer(store.currentQuestion.id, answer, showCode ? store.code : undefined);
  }

  function handleNextQuestion() {
    store.setAvatarState("thinking");
    wsRef.current?.sendNextQuestion();
  }

  async function handleEndSession() {
    setEnding(true);
    wsRef.current?.sendEndSession();
    setTimeout(() => {
      if (ending) router.push(`/results/${sessionId}`);
    }, 8000);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [store.messages]);

  const elapsed = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a3e] glass z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[#6b6b80] hover:text-white text-sm transition-colors">← Exit</Link>
          <div className="h-4 w-px bg-[#2a2a3e]" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-[#a0a0b0]">Live Interview</span>
          </div>
          <span className="text-sm text-[#6b6b80] font-mono">{elapsed}</span>
        </div>

        <div className="flex items-center gap-2">
          {store.currentQuestion && (
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">
              Q{store.currentQuestion.index + 1} · {store.currentQuestion.type}
            </span>
          )}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${showCode ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" : "border-[#2a2a3e] text-[#6b6b80] hover:border-indigo-500/50"}`}
          >
            {showCode ? "Hide Code" : "Show Code"}
          </button>
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            {ending ? "Ending..." : "End Session"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Avatar + Chat */}
        <div className={`flex flex-col ${showCode ? "w-1/2" : "w-full"} border-r border-[#2a2a3e]`}>
          {/* Avatar area */}
          <div className="flex items-center justify-center py-6 border-b border-[#2a2a3e] bg-[#0d0d15]">
            <AvatarViewer state={store.avatarState} name="Alex (AI)" />
          </div>

          {/* Score badge */}
          {store.lastScore && (
            <div className="px-4 py-2 border-b border-[#2a2a3e] bg-[#12121a]">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#6b6b80]">Last answer:</span>
                <span className={`font-bold ${store.lastScore.overall >= 30 ? "text-emerald-400" : store.lastScore.overall >= 20 ? "text-yellow-400" : "text-red-400"}`}>
                  {store.lastScore.overall}/40
                </span>
                <span className="text-[#6b6b80] text-xs truncate max-w-xs">{store.lastScore.feedback}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!store.isConnected && (
              <div className="flex items-center gap-3 text-[#6b6b80] text-sm py-8 justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Connecting to interview session...
              </div>
            )}
            {store.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.speaker === "interviewer"
                    ? "bg-[#1e1e2e] border border-[#2a2a3e] text-[#e8e8f0]"
                    : "bg-indigo-600 text-white"
                }`}>
                  {msg.speaker === "interviewer" && (
                    <div className="text-xs text-indigo-400 mb-1 font-medium">Alex (AI)</div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[#2a2a3e] space-y-2">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <VoiceCapture onTranscript={handleVoiceTranscript} disabled={!store.isConnected} />
              {store.currentQuestion && (
                <button
                  onClick={handleNextQuestion}
                  className="text-sm text-[#6b6b80] hover:text-white border border-[#2a2a3e] hover:border-indigo-500/50 px-3 py-2 rounded-xl transition-all"
                >
                  Next Question →
                </button>
              )}
            </div>

            {/* Text input */}
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your answer here..."
                disabled={!store.isConnected}
                className="flex-1 bg-[#1e1e2e] border border-[#2a2a3e] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#3a3a4e] disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || !store.isConnected}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right: Code Editor */}
        {showCode && (
          <div className="w-1/2 flex flex-col">
            <CodeEditor
              value={store.code}
              onChange={store.setCode}
              language={store.language}
              onLanguageChange={store.setLanguage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
