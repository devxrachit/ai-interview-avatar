import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { authApi } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getBackendToken(
  provider: string,
  providerAccountId: string,
  email: string,
  name: string,
  image: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      provider,
      provider_id: providerAccountId,
      email: email || `${providerAccountId}@${provider}.oauth`,
      name: name || "User",
      avatar_url: image || "",
    });
    const res = await fetch(`${API_URL}/api/v1/auth/oauth/callback?${params}`, {
      method: "POST",
    });
    if (!res.ok) {
      console.error(`[auth] OAuth backend returned ${res.status}:`, await res.text());
      return null;
    }
    const data = await res.json();
    return data.access_token ?? null;
  } catch (e) {
    console.error("[auth] OAuth backend fetch failed:", e);
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await authApi.login(
            credentials.email as string,
            credentials.password as string
          );
          const data = res.data;
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            image: data.user.avatar_url,
            backendToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" || account?.provider === "google") {
        const token = await getBackendToken(
          account.provider,
          account.providerAccountId!,
          user.email!,
          user.name || "",
          user.image || ""
        );
        if (token) {
          (user as Record<string, unknown>).backendToken = token;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as Record<string, unknown>).backendToken as string;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string;
      session.user.id = token.userId as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

declare module "next-auth" {
  interface Session {
    backendToken: string;
  }
}
