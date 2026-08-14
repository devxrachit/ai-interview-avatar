"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getAmbientEngine } from "@/lib/ambientAudio";

const INTRO_SEEN_KEY = "if_intro_seen";
const MUTE_KEY = "if_music_muted";

/**
 * Global site experience layer:
 *  - A cinematic intro animation that plays once per session when landing on "/".
 *  - Synthesized ambient background music that begins from the intro's CTA
 *    (respecting the browser autoplay policy — audio needs a user gesture).
 *  - A persistent, always-available mute / unmute control.
 */
export default function SiteExperience() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [stage, setStage] = useState(0); // drives the staged intro reveal
  const [muted, setMuted] = useState(true);
  const [musicStarted, setMusicStarted] = useState(false);

  const engineRef = useRef(getAmbientEngine());

  // Decide whether to play the intro (only on the site entry route, once per session).
  useEffect(() => {
    setMounted(true);
    const storedMute = typeof window !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
    setMuted(storedMute);

    const seen = typeof window !== "undefined" && sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
    if (!seen && pathname === "/") {
      setShowIntro(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Staged reveal of the intro elements.
  useEffect(() => {
    if (!showIntro) return;
    const timers = [
      setTimeout(() => setStage(1), 250), // logo
      setTimeout(() => setStage(2), 1100), // wordmark
      setTimeout(() => setStage(3), 1900), // tagline
      setTimeout(() => setStage(4), 2700), // CTA buttons
    ];
    return () => timers.forEach(clearTimeout);
  }, [showIntro]);

  async function enterSite(withSound: boolean) {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    if (withSound) {
      try {
        await engineRef.current.start();
        engineRef.current.setMuted(false);
        setMuted(false);
        setMusicStarted(true);
        localStorage.setItem(MUTE_KEY, "0");
      } catch {
        /* audio unavailable — enter silently */
      }
    }
    setShowIntro(false);
  }

  async function toggleMute() {
    const engine = engineRef.current;
    // First interaction after entering silently: boot the engine on this gesture.
    if (!engine.isStarted) {
      try {
        await engine.start();
        setMusicStarted(true);
      } catch {
        return;
      }
    }
    const next = !muted;
    setMuted(next);
    engine.setMuted(next);
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  }

  if (!mounted) return null;

  const showEqualizer = musicStarted && !muted;

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#06060b]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Drifting gradient orbs */}
            {!reduceMotion && (
              <>
                <motion.div
                  className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-[120px]"
                  animate={{ x: [0, 80, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/25 blur-[130px]"
                  animate={{ x: [0, -70, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            <div className="relative flex flex-col items-center px-6 text-center">
              {/* Logo mark */}
              <AnimatePresence>
                {stage >= 1 && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 14 }}
                    className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-5xl shadow-2xl shadow-indigo-500/40"
                  >
                    <motion.span
                      animate={reduceMotion ? {} : { scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      ⚡
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wordmark */}
              <AnimatePresence>
                {stage >= 2 && (
                  <motion.h1
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="gradient-text text-4xl font-black tracking-tight sm:text-6xl"
                  >
                    InterviewForge
                  </motion.h1>
                )}
              </AnimatePresence>

              {/* Tagline */}
              <AnimatePresence>
                {stage >= 3 && (
                  <motion.p
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mt-4 max-w-md text-base text-[#a0a0b0] sm:text-lg"
                  >
                    Your AI interviewer is warming up. Take a breath — let&apos;s practice
                    like it&apos;s the real thing.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA */}
              <AnimatePresence>
                {stage >= 4 && (
                  <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
                  >
                    <button
                      onClick={() => enterSite(true)}
                      className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-indigo-500"
                    >
                      <span className="text-lg">🔊</span>
                      Enter with sound
                    </button>
                    <button
                      onClick={() => enterSite(false)}
                      className="rounded-xl border border-[#2a2a3e] px-7 py-3.5 text-base font-medium text-[#a0a0b0] transition-all hover:border-indigo-500/50 hover:text-white"
                    >
                      Enter silently
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading shimmer before the CTA is ready */}
              {stage < 4 && (
                <motion.div
                  className="mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              )}
            </div>

            {/* Skip */}
            <button
              onClick={() => enterSite(false)}
              className="absolute bottom-6 right-6 text-sm text-[#6b6b80] transition-colors hover:text-white"
            >
              Skip intro →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent music control */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute background music" : "Mute background music"}
        title={muted ? "Play ambient music" : "Mute ambient music"}
        className="glass fixed bottom-5 right-5 z-[90] flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2a3e] text-[#a0a0b0] shadow-lg transition-all hover:scale-110 hover:text-white"
      >
        {showEqualizer ? (
          <span className="flex h-4 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-indigo-400"
                animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
                style={{ height: "30%" }}
              />
            ))}
          </span>
        ) : (
          <MutedIcon />
        )}
      </button>
    </>
  );
}

function MutedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
