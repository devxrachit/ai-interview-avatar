"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sessionsApi } from "@/lib/api";
import Link from "next/link";

const TRACKS = [
  { id: "dsa", label: "DSA / Algorithms", icon: "🧩", desc: "Arrays, trees, graphs, dynamic programming, and problem-solving patterns." },
  { id: "system_design", label: "System Design", icon: "🏗️", desc: "Scalable architecture, database design, and engineering trade-offs." },
  { id: "behavioral", label: "Behavioral", icon: "🧠", desc: "STAR-method answers, leadership scenarios, and communication skills." },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", desc: "Entry-level questions (0-2 YOE)" },
  { id: "medium", label: "Medium", desc: "Mid-level questions (2-5 YOE)" },
  { id: "hard", label: "Hard", desc: "Senior-level questions (5+ YOE)" },
];

const COMPANY_TIERS = [
  { id: "startup", label: "Startup", desc: "Generalist, practical focus" },
  { id: "mid", label: "Mid-size", desc: "Balanced technical depth" },
  { id: "faang", label: "FAANG / Big Tech", desc: "High-rigor, algorithm-heavy" },
];

export default function InterviewSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [track, setTrack] = useState("dsa");
  const [difficulty, setDifficulty] = useState("medium");
  const [companyTier, setCompanyTier] = useState("mid");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await sessionsApi.create(track, difficulty, companyTier);
      router.push(`/interview/${res.data.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || "Failed to create session. Make sure the API is running.");
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="border-b border-[#2a2a3e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-[#6b6b80] hover:text-white text-sm transition-colors">← Dashboard</Link>
          <span className="font-bold gradient-text">InterviewForge</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Configure your interview</h1>
        <p className="text-[#a0a0b0] mb-10">Set up your mock interview session in 30 seconds.</p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Track */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#a0a0b0] uppercase tracking-wider mb-4">Interview Round</h2>
          <div className="space-y-3">
            {TRACKS.map((t) => (
              <button key={t.id} onClick={() => setTrack(t.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${track === t.id ? "border-indigo-500 bg-indigo-500/10" : "border-[#2a2a3e] bg-[#12121a] hover:border-indigo-500/50"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-sm text-[#6b6b80]">{t.desc}</div>
                  </div>
                  {track === t.id && <div className="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">✓</div>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-[#a0a0b0] uppercase tracking-wider mb-4">Difficulty</h2>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button key={d.id} onClick={() => setDifficulty(d.id)}
                className={`p-4 rounded-xl border text-center transition-all ${difficulty === d.id ? "border-indigo-500 bg-indigo-500/10" : "border-[#2a2a3e] bg-[#12121a] hover:border-indigo-500/50"}`}>
                <div className="font-semibold mb-1">{d.label}</div>
                <div className="text-xs text-[#6b6b80]">{d.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Company Tier */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-[#a0a0b0] uppercase tracking-wider mb-4">Company Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {COMPANY_TIERS.map((c) => (
              <button key={c.id} onClick={() => setCompanyTier(c.id)}
                className={`p-4 rounded-xl border text-center transition-all ${companyTier === c.id ? "border-indigo-500 bg-indigo-500/10" : "border-[#2a2a3e] bg-[#12121a] hover:border-indigo-500/50"}`}>
                <div className="font-semibold mb-1">{c.label}</div>
                <div className="text-xs text-[#6b6b80]">{c.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <button onClick={handleStart} disabled={creating}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-xl text-lg font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/25">
          {creating ? "Starting interview..." : "Start Interview →"}
        </button>
      </main>
    </div>
  );
}
