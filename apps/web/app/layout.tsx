import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { SessionSync } from "@/components/SessionSync";
import SiteExperience from "@/components/SiteExperience";

export const metadata: Metadata = {
  title: "InterviewForge — AI Mock Interview Platform",
  description: "Practice technical interviews with an AI avatar interviewer. DSA, System Design, and Behavioral rounds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider>
          <SessionSync />
          {children}
          <SiteExperience />
        </SessionProvider>
      </body>
    </html>
  );
}
