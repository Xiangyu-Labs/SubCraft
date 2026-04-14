import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/todos") || nextUrl.pathname === "/";
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
