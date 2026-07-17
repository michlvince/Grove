import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Full auth setup (Node runtime). Adds the Credentials provider on top of the
 * edge-safe config so every account has a role + a stable id we control.
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
  },
});
