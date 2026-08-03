"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/interviewStore";

export function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.backendToken) {
      localStorage.setItem("token", session.backendToken);
      // Keep Zustand token in sync so useAuthStore.token is reactive
      useAuthStore.setState({ token: session.backendToken });
    } else if (status === "unauthenticated") {
      localStorage.removeItem("token");
      useAuthStore.setState({ token: null, user: null });
    }
  }, [status, session?.backendToken]);

  return null;
}
