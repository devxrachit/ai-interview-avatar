"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/interviewStore";
import OAuthButtons from "@/components/OAuthButtons";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.register(email, name, password);
      const data = res.data;
      setAuth(data.access_token, data.user);
      // Also sign in via NextAuth for session
      await signIn("credentials", { email, password, redirect: false });
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg gradient-text">InterviewForge</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-[#a0a0b0]">Free forever. No credit card needed.</p>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-8">
          {/* OAuth Buttons — only configured providers render */}
          <OAuthButtons dividerLabel="or register with email" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#a0a0b0] mb-2">Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1e1e2e] border border-[#2a2a3e] focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                placeholder="Your full name" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b0] mb-2">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e1e2e] border border-[#2a2a3e] focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b0] mb-2">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e1e2e] border border-[#2a2a3e] focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none transition-colors"
                placeholder="At least 8 characters" minLength={8} required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-[#6b6b80] text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
