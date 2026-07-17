import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. Contains everything that must run in the middleware
 * (which uses the Edge runtime): providers that don't need Node APIs, the
 * authorized() route guard, and JWT/session shaping.
 *
 * The Credentials provider (which needs bcrypt + Supabase = Node APIs) is added
 * separately in auth.ts so it never gets pulled into the Edge bundle.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    // Route protection, evaluated in middleware.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const { pathname } = nextUrl;

      const isAuthPage = pathname === "/signin" || pathname === "/signup";
      const isAdminArea = pathname.startsWith("/admin");

      // Admin area: must be logged in AND an admin.
      if (isAdminArea) {
        if (!isLoggedIn) return false;
        if (role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Auth pages: bounce already-signed-in users to the app.
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // Everything else requires a session.
      return isLoggedIn;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
        token.title = user.title ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as "user" | "admin") ?? "user";
        session.user.title = (token.title as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
