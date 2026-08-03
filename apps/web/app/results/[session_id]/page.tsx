"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { sessionsApi } from "@/lib/api";
import Link from "next/link";

interface Report {
  id: string;
  session_id: string;
  overall_score: number;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  category_scores: {
    technical_accuracy: number;
    communication: number;
    problem_solving: number;
    overall_readiness: number;
  };
  full_transcript: Array<{ speaker: string; text: string; timestamp: string }>;
  created_at: string;
}

function ScoreCircle({ score, max = 40, label }: { score: number; max?: number; label: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : pct >= 40 ? "#f97316" : "#f87171";
  const circumference = 2 * Math.PI * 40;
  const dashoffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1e2e" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{Math.round(score)}</span>
          <span className="text-xs text-[#6b6b80]">/{max}</span>
        </div>
      </div>
      <span className="text-xs text-[#a0a0b0] text-center">{label}</span>
    </div>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-yellow-500" : value >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#a0a0b0]">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.session_id as string;
  const { status } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    sessionsApi.getReport(sessionId)
      .then((r) => setReport(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setError("Report not ready yet. The session may still be processing.");
        else setError("Failed to load report.");
      })
      .finally(() => setLoading(false));
  }, [sessionId, status]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#a0a0b0]">Generating your report...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold mb-2">Report Not Ready</h2>
        <p className="text-[#a0a0b0] mb-6">{error}</p>
        <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl">Back to Dashboard</Link>
      </div>
    </div>
  );

  if (!report) return null;

  const grade = report.overall_score >= 35 ? "A+" : report.overall_score >= 30 ? "A" : report.overall_score >= 25 ? "B+" : report.overall_score >= 20 ? "B" : report.overall_score >= 15 ? "C" : "D";
  const gradeColor = grade.startsWith("A") ? "text-emerald-400" : grade.startsWith("B") ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="border-b border-[#2a2a3e] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-[#6b6b80] hover:text-white text-sm">← Dashboard</Link>
          <span className="font-bold gradient-text">Interview Report</span>
          <Link href="/interview/setup" className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg">
            Practice Again
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Overall score header */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-8 mb-8 text-center">
          <h1 className="text-2xl font-bold mb-6">Session Complete</h1>
          <div className="flex items-center justify-center gap-16">
            <ScoreCircle score={report.overall_score} label="Overall Score" />
            <div>
              <div className={`text-7xl font-black ${gradeColor}`}>{grade}</div>
              <div className="text-[#6b6b80] text-sm mt-1">Grade</div>
            </div>
            <div className="text-left">
              <div className="text-sm text-[#6b6b80] mb-1">Completed</div>
              <div className="font-semibold">{new Date(report.created_at).toLocaleDateString()}</div>
              <div className="text-sm text-[#6b6b80] mt-2">Questions</div>
              <div className="font-semibold">{Math.ceil(report.full_transcript.length / 2)}</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Category breakdown */}
          <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6">
            <h2 className="font-bold mb-5">Performance Breakdown</h2>
            <div className="space-y-4">
              <CategoryBar label="Technical Accuracy" value={report.category_scores.technical_accuracy || 0} />
              <CategoryBar label="Communication" value={report.category_scores.communication || 0} />
              <CategoryBar label="Problem Solving" value={report.category_scores.problem_solving || 0} />
              <CategoryBar label="Overall Readiness" value={report.category_scores.overall_readiness || 0} />
            </div>
          </div>

          {/* Feedback sections */}
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <span>✓</span> Strengths
              </h3>
              <p className="text-sm text-[#a0a0b0] leading-relaxed">{report.strengths}</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
              <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span>△</span> Areas to Improve
              </h3>
              <p className="text-sm text-[#a0a0b0] leading-relaxed">{report.weaknesses}</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6 mb-8">
          <h2 className="font-bold mb-4">Recommendations</h2>
          <p className="text-sm text-[#a0a0b0] leading-relaxed whitespace-pre-line">{report.recommendations}</p>
        </div>

        {/* Transcript */}
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6">
          <h2 className="font-bold mb-5">Full Transcript</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.full_transcript.map((item, i) => (
              <div key={i} className={`flex ${item.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  item.speaker === "interviewer"
                    ? "bg-[#1e1e2e] text-[#e8e8f0]"
                    : "bg-indigo-600/30 border border-indigo-500/30 text-[#e8e8f0]"
                }`}>
                  <div className="text-xs text-[#6b6b80] mb-1 font-medium capitalize">{item.speaker}</div>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
