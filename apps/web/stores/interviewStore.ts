import { create } from "zustand";

interface Question {
  id: string;
  text: string;
  index: number;
  type: string;
}

interface Message {
  speaker: "interviewer" | "candidate" | "system";
  text: string;
  timestamp: number;
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

interface InterviewState {
  sessionId: string | null;
  status: "idle" | "setup" | "active" | "analysis" | "done";
  currentQuestion: Question | null;
  questions: Question[];
  messages: Message[];
  lastScore: ScoreData | null;
  avatarState: "idle" | "speaking" | "listening" | "thinking";
  isConnected: boolean;
  reportId: string | null;
  code: string;
  language: string;

  setSession: (id: string) => void;
  setStatus: (s: InterviewState["status"]) => void;
  setCurrentQuestion: (q: Question) => void;
  addMessage: (m: Omit<Message, "timestamp">) => void;
  setLastScore: (s: ScoreData) => void;
  setAvatarState: (s: InterviewState["avatarState"]) => void;
  setConnected: (v: boolean) => void;
  setReportId: (id: string) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessionId: null,
  status: "idle",
  currentQuestion: null,
  questions: [],
  messages: [],
  lastScore: null,
  avatarState: "idle",
  isConnected: false,
  reportId: null,
  code: "# Write your solution here\n",
  language: "python",

  setSession: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  setCurrentQuestion: (q) => set((s) => ({ currentQuestion: q, questions: [...s.questions, q] })),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, { ...m, timestamp: Date.now() }] })),
  setLastScore: (lastScore) => set({ lastScore }),
  setAvatarState: (avatarState) => set({ avatarState }),
  setConnected: (isConnected) => set({ isConnected }),
  setReportId: (reportId) => set({ reportId }),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  reset: () => set({
    sessionId: null, status: "idle", currentQuestion: null,
    questions: [], messages: [], lastScore: null,
    avatarState: "idle", isConnected: false, reportId: null,
    code: "# Write your solution here\n", language: "python"
  }),
}));

// Auth store
interface AuthState {
  token: string | null;
  user: { id: string; email: string; name: string; avatar_url?: string } | null;
  setAuth: (token: string, user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));
