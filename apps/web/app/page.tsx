"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const features = [
  { icon: "🤖", title: "AI Avatar Interviewer", desc: "Animated avatar with voice that conducts real interviews" },
  { icon: "🧠", title: "Adaptive Questions", desc: "LLM generates questions that adapt to your performance" },
  { icon: "💻", title: "Live Code Editor", desc: "Monaco editor with multi-language support and execution" },
  { icon: "📊", title: "Post-Session Analytics", desc: "Detailed scoring rubric and improvement recommendations" },
  { icon: "🎤", title: "Voice I/O", desc: "Speak your answers, hear the interviewer respond" },
  { icon: "🏗️", title: "System Design Board", desc: "Excalidraw whiteboard for architecture discussions" },
];

const tracks = [
  { id: "dsa", label: "DSA Round", color: "from-blue-500 to-cyan-500", desc: "Arrays, Trees, Graphs, DP" },
  { id: "system_design", label: "System Design", color: "from-purple-500 to-pink-500", desc: "Architecture, Scale, Trade-offs" },
  { id: "behavioral", label: "Behavioral", color: "from-orange-500 to-yellow-500", desc: "STAR Method, Leadership" },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#2a2a3e]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg gradient-text">InterviewForge</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-[#a0a0b0] hover:text-white text-sm transition-colors">Sign in</Link>
                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-2 text-sm text-indigo-300 mb-8">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
            AI-powered mock interviews — free to use
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Practice interviews
            <br />
            <span className="gradient-text">like it&apos;s the real thing</span>
          </h1>

          <p className="text-xl text-[#a0a0b0] mb-10 max-w-2xl mx-auto leading-relaxed">
            A lifelike AI avatar conducts your technical interview, listens to your answers,
            runs your code, and gives you honest feedback at the end.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={session ? "/dashboard" : "/register"}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-500/25">
              Start Free Interview
            </Link>
            <Link href="/login"
              className="border border-[#2a2a3e] hover:border-indigo-500 text-[#a0a0b0] hover:text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Interview Types */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Three rounds that matter</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="relative rounded-2xl border border-[#2a2a3e] p-6 hover:border-indigo-500/50 transition-all group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${track.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className={`inline-block text-transparent bg-gradient-to-r ${track.color} bg-clip-text text-4xl font-black mb-4`}>
                  {track.label.charAt(0)}
                </div>
                <h3 className="font-bold text-lg mb-2">{track.label}</h3>
                <p className="text-[#6b6b80] text-sm">{track.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-[#0d0d15]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to prepare</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-[#12121a] border border-[#2a2a3e] rounded-xl p-6 hover:border-indigo-500/40 transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-[#6b6b80] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to crack your next interview?</h2>
          <p className="text-[#a0a0b0] mb-8">Free to use. No credit card required. Get started in 30 seconds.</p>
          <Link href={session ? "/interview/setup" : "/register"}
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-500/25">
            Start Practicing Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a3e] py-8 px-6 text-center text-[#6b6b80] text-sm">
        Built by engineers, for engineers ·{" "}
        <a href="https://rachitdev.uk" className="text-indigo-400 hover:text-indigo-300">rachitdev.uk</a>
      </footer>
    </div>
  );
}
