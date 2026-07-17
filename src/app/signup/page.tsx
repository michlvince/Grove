"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Mail, Lock, User, Briefcase, ShieldAlert, ChevronRight } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Traveler");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), title: title.trim(), email: email.trim(), password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration.
    const login = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/signin");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center items-stretch antialiased font-sans">
      <div className="w-full max-w-md bg-surface border-x border-border flex flex-col relative shadow-2xl min-h-screen justify-center px-8 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none animate-pulse-slow" />

        <div className="relative z-10 w-full flex flex-col">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-background border border-primary/25 rounded-3xl flex items-center justify-center mb-4 glow-emerald">
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full glow-emerald" />
            </div>
            <h1 className="text-3xl font-bold tracking-widest bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
              GROVE
            </h1>
            <p className="text-[10px] text-[#7FE08A]/80 mt-2 tracking-widest uppercase font-semibold">
              Ideas are living things
            </p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full py-3 mb-4 bg-background border border-border hover:bg-surface-hover active:scale-[0.98] transition-premium rounded-xl font-medium text-sm flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-2 text-[10px] uppercase tracking-wider text-muted">
            <div className="h-px bg-border flex-1" />
            <span>or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Michael"
                  className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Creative Title</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer / Traveler"
                  className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-muted uppercase">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/20 border border-red-900/30 p-3 rounded-lg">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] transition-premium rounded-xl font-medium text-sm text-white tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>{loading ? "Creating..." : "Create Account"}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5">
              Sign in <ChevronRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
