"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { analyticsApi } from "@/lib/api";

interface Session {
  id: string;
  track: string;
  difficulty: string;
  status: string;
  total_score: number | null;
  created_at: string;
}

interface Overview {
  total_sessions: number;
  completed_sessions: number;
  average_score: number;
  sessions_by_track: Record<string, number>;
  recent_sessions: Session[];
}

const TRACK_LABELS: Record<string, string> = {
  dsa: "DSA", system_design: "System Design", behavioral: "Behavioral"
};

const STATUS_COLORS: Record<string, string> = {
  done: "text-emerald-400 bg-emerald-400/10",
  active: "text-yellow-400 bg-yellow-400/10",
  setup: "text-blue-400 bg-blue-400/10",
};

export default function DashboardPage() {
  const { data: nextSession, status } = useSession();
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      analyticsApi.overview()
        .then((r) => setOverview(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const user = nextSession?.user;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="border-b border-[#2a2a3e] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold gradient-text">InterviewForge</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user?.image && (
                <img src={user.image} alt="avatar" className="w-8 h-8 rounded-full ring-2 ring-[#2a2a3e]" />
              )}
              <span className="text-sm text-[#a0a0b0]">{user?.name || user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-[#6b6b80] hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-[#a0a0b0]">Track your interview practice progress</p>
          </div>
          <Link
            href="/interview/setup"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
          >
            + New Interview
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Sessions", value: overview?.total_sessions ?? 0 },
            { label: "Completed", value: overview?.completed_sessions ?? 0 },
            { label: "Avg Score", value: overview ? `${overview.average_score.toFixed(1)}/40` : "—" },
            { label: "Best Track", value: overview ? Object.entries(overview.sessions_by_track).sort((a, b) => b[1] - a[1])[0]?.[0] || "—" : "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-5">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-[#6b6b80]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
          {!overview?.recent_sessions?.length ? (
            <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">No sessions yet</h3>
              <p className="text-[#6b6b80] mb-6">Start your first mock interview to see your progress here</p>
              <Link
                href="/interview/setup"
                className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Start First Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.recent_sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#12121a] border border-[#2a2a3e] hover:border-indigo-500/40 rounded-xl p-5 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 font-bold text-sm">
                      {TRACK_LABELS[s.track]?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-medium">{TRACK_LABELS[s.track] || s.track}</div>
                      <div className="text-sm text-[#6b6b80]">
                        {s.difficulty} · {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.total_score !== null && (
                      <div className="text-right">
                        <div className="font-bold">{s.total_score.toFixed(1)}/40</div>
                        <div className="text-xs text-[#6b6b80]">score</div>
                      </div>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[s.status] || "text-[#6b6b80] bg-[#2a2a3e]"}`}>
                      {s.status}
                    </span>
                    {s.status === "done" ? (
                      <Link href={`/results/${s.id}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        View Report →
                      </Link>
                    ) : s.status === "active" ? (
                      <Link href={`/interview/${s.id}`} className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                        Continue →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
