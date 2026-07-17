import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware uses the edge-safe config only (no bcrypt / Supabase).
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protect everything except Next internals, static assets, and auth API.
  matcher: ["/((?!api/auth|api/signup|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
