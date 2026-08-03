import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function scoreToGrade(score: number): string {
  if (score >= 35) return "A+";
  if (score >= 30) return "A";
  if (score >= 25) return "B+";
  if (score >= 20) return "B";
  if (score >= 15) return "C";
  return "D";
}

export function scoreToColor(score: number): string {
  const pct = (score / 40) * 100;
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-yellow-400";
  if (pct >= 40) return "text-orange-400";
  return "text-red-400";
}
