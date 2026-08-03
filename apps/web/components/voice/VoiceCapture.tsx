"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognition(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceCapture({ onTranscript, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
      }
    };

    recognition.onend = () => {
      setListening(false);
      if (finalTranscript.trim()) onTranscript(finalTranscript.trim());
    };

    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!supported) {
    return (
      <div className="text-xs text-[#6b6b80] text-center py-2">
        Voice not supported in this browser. Use Chrome for best experience.
      </div>
    );
  }

  return (
    <button
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
        listening
          ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30"
          : "bg-[#1e1e2e] border border-[#2a2a3e] text-[#a0a0b0] hover:border-emerald-500 hover:text-emerald-400"
      } disabled:opacity-40`}
    >
      {listening ? (
        <>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          Stop Recording
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          Use Voice
        </>
      )}
    </button>
  );
}

// TTS helper — speaks text using browser Speech Synthesis
export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Pick a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => v.name.includes("Google") && v.lang === "en-US")
    || voices.find((v) => v.lang === "en-US")
    || voices[0];
  if (preferred) utterance.voice = preferred;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}
