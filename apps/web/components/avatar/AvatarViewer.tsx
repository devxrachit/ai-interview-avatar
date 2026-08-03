"use client";
import { useEffect, useRef } from "react";

type AvatarState = "idle" | "speaking" | "listening" | "thinking";

interface Props {
  state: AvatarState;
  name?: string;
}

export default function AvatarViewer({ state, name = "Alex" }: Props) {
  const eyeRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className={`relative w-36 h-36 rounded-full ${state === "speaking" ? "avatar-speaking" : ""}`}>
        {/* Outer glow ring */}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          state === "speaking" ? "ring-4 ring-indigo-500 ring-opacity-60" :
          state === "listening" ? "ring-4 ring-emerald-500 ring-opacity-60" :
          state === "thinking" ? "ring-4 ring-yellow-500 ring-opacity-40" :
          "ring-2 ring-[#2a2a3e]"
        }`} />

        {/* Avatar face SVG */}
        <svg viewBox="0 0 140 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="70" cy="70" r="70" fill="#1e1e2e" />

          {/* Gradient overlay */}
          <defs>
            <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e1e2e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="70" cy="70" r="70" fill="url(#faceGrad)" />

          {/* Head */}
          <ellipse cx="70" cy="65" rx="30" ry="35" fill="#3d3d5c" />

          {/* Hair */}
          <ellipse cx="70" cy="38" rx="30" ry="14" fill="#6366f1" />
          <rect x="40" y="38" width="60" height="10" fill="#6366f1" />

          {/* Eyes */}
          <EyeGroup state={state} />

          {/* Nose */}
          <ellipse cx="70" cy="72" rx="3" ry="4" fill="#5a5a7a" />

          {/* Mouth */}
          <MouthGroup state={state} />

          {/* Shirt / collar */}
          <path d="M 40 105 Q 50 95 60 100 L 65 108 L 70 104 L 75 108 L 80 100 Q 90 95 100 105 L 100 140 L 40 140 Z" fill="#4f46e5" />
          <path d="M 60 100 L 65 108 L 70 104 L 75 108 L 80 100" fill="none" stroke="#6366f1" strokeWidth="2" />
        </svg>

        {/* State indicator dot */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-[#0a0a0f] transition-all ${
          state === "speaking" ? "bg-indigo-400 animate-pulse" :
          state === "listening" ? "bg-emerald-400 animate-pulse" :
          state === "thinking" ? "bg-yellow-400 animate-pulse" :
          "bg-[#2a2a3e]"
        }`} />
      </div>

      {/* Name and status */}
      <div className="text-center">
        <div className="font-semibold text-sm">{name}</div>
        <div className={`text-xs mt-0.5 transition-all ${
          state === "speaking" ? "text-indigo-400" :
          state === "listening" ? "text-emerald-400" :
          state === "thinking" ? "text-yellow-400" :
          "text-[#6b6b80]"
        }`}>
          {state === "speaking" ? "Speaking..." :
           state === "listening" ? "Listening..." :
           state === "thinking" ? "Thinking..." :
           "AI Interviewer"}
        </div>
      </div>

      {/* Waveform when speaking */}
      {state === "speaking" && (
        <div className="flex items-center gap-1 h-8">
          {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7, 0.5].map((h, i) => (
            <div
              key={i}
              className="wave-bar w-1 bg-indigo-400 rounded-full"
              style={{
                height: `${h * 28}px`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Listening mic indicator */}
      {state === "listening" && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Recording your answer
        </div>
      )}
    </div>
  );
}

function EyeGroup({ state }: { state: AvatarState }) {
  const isBlink = false;
  return (
    <g>
      {/* Left eye */}
      <ellipse cx="58" cy="62" rx="6" ry={isBlink ? 1 : 7} fill="white" />
      <circle cx="59" cy="63" r={state === "thinking" ? 3 : 4} fill="#6366f1" />
      <circle cx="60" cy="62" r="1.5" fill="white" />

      {/* Right eye */}
      <ellipse cx="82" cy="62" rx="6" ry={isBlink ? 1 : 7} fill="white" />
      <circle cx="83" cy="63" r={state === "thinking" ? 3 : 4} fill="#6366f1" />
      <circle cx="84" cy="62" r="1.5" fill="white" />

      {/* Thinking squint */}
      {state === "thinking" && (
        <>
          <line x1="52" y1="57" x2="64" y2="59" stroke="#a0a0b0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="76" y1="59" x2="88" y2="57" stroke="#a0a0b0" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function MouthGroup({ state }: { state: AvatarState }) {
  if (state === "speaking") {
    return (
      <ellipse cx="70" cy="85" rx="10" ry="6" fill="#0a0a0f" />
    );
  }
  if (state === "thinking") {
    return (
      <path d="M 62 85 Q 66 83 70 85 Q 74 87 78 84" fill="none" stroke="#a0a0b0" strokeWidth="2" strokeLinecap="round" />
    );
  }
  // idle / listening — smile
  return (
    <path d="M 60 83 Q 70 92 80 83" fill="none" stroke="#a0a0b0" strokeWidth="2.5" strokeLinecap="round" />
  );
}
