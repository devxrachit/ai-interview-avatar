import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (email: string, name: string, password: string) =>
    api.post("/api/v1/auth/register", { email, name, password }),
  login: (email: string, password: string) =>
    api.post("/api/v1/auth/login", { email, password }),
  oauthCallback: (provider: string, provider_id: string, email: string, name: string, avatar_url: string) =>
    api.post("/api/v1/auth/oauth/callback", null, {
      params: { provider, provider_id, email, name, avatar_url }
    }),
};

// Sessions
export const sessionsApi = {
  create: (track: string, difficulty: string, company_tier: string) =>
    api.post("/api/v1/sessions", { track, difficulty, company_tier }),
  list: () => api.get("/api/v1/sessions"),
  get: (id: string) => api.get(`/api/v1/sessions/${id}`),
  start: (id: string) => api.post(`/api/v1/sessions/${id}/start`),
  submitAnswer: (id: string, question_id: string, answer_text: string, code_submission?: string) =>
    api.post(`/api/v1/sessions/${id}/answer`, { question_id, answer_text, code_submission }),
  nextQuestion: (id: string) => api.post(`/api/v1/sessions/${id}/next-question`),
  end: (id: string) => api.post(`/api/v1/sessions/${id}/end`),
  getQuestions: (id: string) => api.get(`/api/v1/sessions/${id}/questions`),
  getReport: (id: string) => api.get(`/api/v1/sessions/${id}/report`),
};

// Code execution
export const codeApi = {
  run: (code: string, language: string, stdin?: string) =>
    api.post("/api/v1/code/run", { code, language, stdin }),
};

// Analytics
export const analyticsApi = {
  overview: () => api.get("/api/v1/analytics/overview"),
};

export default api;
