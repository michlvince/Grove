"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sparkles, Mail, Lock, ShieldAlert, ChevronRight } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
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
              Welcome back
            </p>
          </div>

          <form onSubmit={handleCredentials} className="space-y-4 mt-2">
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
                  autoFocus
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
                  placeholder="••••••••"
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
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            New to Grove?{" "}
            <Link href="/signup" className="text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5">
              Create an account <ChevronRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
