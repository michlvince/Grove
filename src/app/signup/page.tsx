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
