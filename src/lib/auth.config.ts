// src/lib/auth.config.ts
// Edge Runtime 相容的 auth 設定（不含 bcryptjs 等 Node.js-only 套件）

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isAuthPage) {
        // 已登入者造訪登入頁 → 導回 dashboard
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // 未登入者造訪受保護頁面 → 導向 login
      if (!isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Providers 在 auth.ts 裡加，這裡保持 Edge-compatible
};
