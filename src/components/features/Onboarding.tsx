"use client";

import React, { useState } from "react";
import { Sparkles, User, ShieldAlert, KeyRound, Briefcase, ChevronRight, Lock } from "lucide-react";
import { useAppState } from "@/context/StateContext";

export default function Onboarding() {
  const { saveUser } = useAppState();
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Traveler");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [passcode, setPasscode] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name to proceed.");
      return;
    }

    if (role === "admin") {
      if (passcode !== "groveadmin") {
        setError("Invalid administrator passcode.");
        return;
      }
    }

    // Handle sign-in mode validation (check local storage)
    if (mode === "signin") {
      const storedUserRaw = localStorage.getItem("grove_user");
      if (storedUserRaw) {
        try {
          const storedUser = JSON.parse(storedUserRaw);
          // Allow sign in if name matches, or if logging in as admin (bypassing user match with passcode)
          if (role === "admin" || storedUser.name.toLowerCase() === name.trim().toLowerCase()) {
            saveUser(name.trim(), role === "admin" ? "Administrator" : storedUser.title, role);
            return;
          } else {
            setError(`No user profile found for "${name.trim()}". Try registering instead!`);
            return;
          }
        } catch (e) {
          // fallback
        }
      } else if (role !== "admin") {
        setError("No profiles registered on this device. Please choose 'Register'.");
        return;
      }
    }

    // Default registration or successful admin login
    saveUser(name.trim(), role === "admin" ? "Administrator" : title, role);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center items-stretch antialiased font-sans">
      <div className="w-full max-w-md bg-surface border-x border-border flex flex-col relative shadow-2xl min-h-screen justify-center px-8 overflow-hidden">
        {/* Organic Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[90px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-emerald-700/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 w-full flex flex-col">
          {/* Logo Brand */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-background border border-primary/25 rounded-3xl flex items-center justify-center mb-4 glow-emerald">
              <span className="w-4 h-4 bg-emerald-500 rounded-full glow-emerald animate-ping absolute"></span>
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full glow-emerald"></span>
            </div>
            <h1 className="text-3xl font-bold tracking-widest bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
              GROVE
            </h1>
            <p className="text-[10px] text-[#7FE08A]/80 mt-2 tracking-widest uppercase font-semibold">
              Ideas are living things
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome to your Grove.
                </h2>
                <p className="text-sm text-muted leading-relaxed max-w-sm mx-auto">
                  A personal creative ecosystem where raw sparks grow into thriving products, games, designs, and personal logs.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] transition-premium rounded-xl font-medium text-sm tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <span>Enter the Grove</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Tab Selector */}
              <div className="flex bg-background border border-border p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-premium ${
                    mode === "register"
                      ? "bg-surface text-emerald-400 border border-border"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Register Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-premium ${
                    mode === "signin"
                      ? "bg-surface text-emerald-400 border border-border"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[10px] font-bold tracking-wider text-muted uppercase">
                    Profile Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={mode === "register" ? "e.g. Michael" : "Enter your registered name"}
                      className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Title (Only during register) */}
                {mode === "register" && role !== "admin" && (
                  <div className="space-y-1.5">
                    <label htmlFor="title" className="text-[10px] font-bold tracking-wider text-muted uppercase">
                      Creative Title
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Software Engineer / Traveler"
                        className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                      />
                    </div>
                  </div>
                )}

                {/* Role Switcher */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
                    Role Type
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRole("user");
                        setError("");
                      }}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-premium flex items-center justify-center gap-1.5 ${
                        role === "user"
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                          : "bg-background border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRole("admin");
                        setError("");
                      }}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-premium flex items-center justify-center gap-1.5 ${
                        role === "admin"
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400"
                          : "bg-background border-border text-muted hover:text-foreground"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Admin
                    </button>
                  </div>
                </div>

                {/* Passcode Field (Only if admin role selected) */}
                {role === "admin" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="passcode" className="text-[10px] font-bold tracking-wider text-muted uppercase flex justify-between">
                      <span>Administrator Passcode</span>
                      <span className="text-emerald-500/60 lowercase">Hint: groveadmin</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="password"
                        id="passcode"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-background border border-border focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-3 pl-10 pr-4 text-foreground placeholder-muted/50 text-sm focus:outline-none transition-premium"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/20 border border-red-900/30 p-3 rounded-lg animate-fade-in">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 border border-border hover:bg-surface-hover active:scale-[0.97] transition-premium rounded-xl font-medium text-xs text-muted tracking-wider"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.97] transition-premium rounded-xl font-medium text-xs text-white tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
                  >
                    <span>{mode === "register" ? "Create Profile" : "Sign In"}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
