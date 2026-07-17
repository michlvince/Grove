import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Full auth setup (Node runtime). Adds the Credentials provider on top of the
 * edge-safe config, and syncs OAuth users into our own `users` table so that
 * every account has a role + a stable id we control.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const supabase = createAdminClient();
        const { data: user } = await supabase
          .from("users")
          .select("id, email, name, title, role, password_hash, image")
          .eq("email", email)
          .single();

        if (!user || !user.password_hash) return null;

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return null;

        await supabase
          .from("users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          title: user.title,
          role: user.role as "user" | "admin",
          image: user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // For Google sign-ins: upsert the user into our table and stamp our id/role
    // back onto the `user` object so the jwt callback stores them.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const supabase = createAdminClient();
      const nowIso = new Date().toISOString();

      const { data: existing } = await supabase
        .from("users")
        .select("id, role, title")
        .eq("email", email)
        .single();

      if (existing) {
        await supabase
          .from("users")
          .update({ last_login_at: nowIso, image: user.image ?? null })
          .eq("id", existing.id);
        user.id = existing.id;
        user.role = existing.role as "user" | "admin";
        (user as { title?: string | null }).title = existing.title;
      } else {
        const { data: inserted } = await supabase
          .from("users")
          .insert({
            email,
            name: user.name ?? (profile?.name as string) ?? email.split("@")[0],
            title: "Traveler",
            role: "user",
            provider: "google",
            image: user.image ?? null,
            last_login_at: nowIso,
          })
          .select("id, role, title")
          .single();

        if (inserted) {
          user.id = inserted.id;
          user.role = inserted.role as "user" | "admin";
          (user as { title?: string | null }).title = inserted.title;
        }
      }

      return true;
    },
  },
});
