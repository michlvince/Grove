"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home as HomeIcon, Globe, Trash2, Sparkles, User, Sun, Moon, Bell, HelpCircle, LogOut } from "lucide-react";
import { useAppState } from "@/context/StateContext";
import { useNotifications } from "@/context/NotificationContext";
import TutorialModal from "../features/TutorialModal";

interface ShellProps {
  children: React.ReactNode;
}

// Routes that render without the app chrome (their own full-screen layout).
const BARE_ROUTES = ["/signin", "/signup"];

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useAppState();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const {
    enabled: notifsEnabled,
    interval: notifInterval,
    toggleNotifications,
    changeInterval,
    sendImmediateNotification,
  } = useNotifications();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(savedTheme);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      setTheme(systemTheme);
    }
  }, []);

  // Show the tutorial automatically the first time a signed-in user arrives.
  useEffect(() => {
    if (user && !localStorage.getItem("grove_tutorial_seen")) {
      setShowTutorial(true);
    }
  }, [user]);

  const closeTutorial = () => {
    localStorage.setItem("grove_tutorial_seen", "true");
    setShowTutorial(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };

  // Auth pages render bare, without the app chrome.
  if (BARE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
          <p className="text-muted text-sm">
Preparing your Grove...
</p>
        </div>
      </div>
    );
  }

  // Unauthenticated users are redirected to /signin by middleware; render nothing
  // in the brief interim to avoid flashing the app chrome.
  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex md:flex-row flex-col antialiased font-sans">
      {/* Decorative background glow (Ethereal Glass mesh) */}
      <div className="absolute top-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-500/4 blur-[130px] pointer-events-none animate-mesh1" />
      <div className="absolute top-[-100px] right-[-200px] w-[500px] h-[500px] rounded-full bg-violet-600/3 blur-[150px] pointer-events-none animate-mesh2" />
      <div className="absolute bottom-[20%] left-[-150px] w-[450px] h-[450px] rounded-full bg-emerald-600/2.5 blur-[120px] pointer-events-none animate-mesh1" />

      {/* ── Desktop Sidebar Navigation (MD and larger) ── */}
      <aside className="hidden md:flex md:w-64 shrink-0 bg-surface border-r border-border flex-col sticky top-0 h-screen z-40 p-6 gap-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full glow-emerald"></span>
          <span className="font-bold text-xl tracking-tight text-foreground">
            Grove
          </span>
        </Link>

        {/* Sidebar Nav Links */}
        <nav className="flex flex-col gap-2 flex-1">
          <Link
            href="/"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-premium group relative ${
              isActive("/") ? "bg-surface-hover text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <HomeIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold tracking-wide">Ecosystem</span>
            {isActive("/") && (
              <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>

          <Link
            href="/worlds"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-premium group relative ${
              isActive("/worlds") || isActive("/world") ? "bg-surface-hover text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold tracking-wide">Worlds</span>
            {(isActive("/worlds") || isActive("/world")) && (
              <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>

          <Link
            href="/dump"
            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-premium group relative ${
              isActive("/dump") ? "bg-surface-hover text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold tracking-wide">The Dump</span>
            {isActive("/dump") && (
              <span className="absolute left-0 top-1/3 bottom-1/3 w-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>
        </nav>

        {/* Sidebar Footer Details */}
        <div className="space-y-3 pt-4 border-t border-border">
          {/* Theme Toggle Trigger */}
          <button
            onClick={toggleTheme}
            className="w-full py-2 px-3.5 rounded-xl border border-border bg-background text-muted hover:text-foreground transition-premium text-xs flex items-center justify-between group/theme active:scale-[0.98]"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className="flex items-center gap-2">
              {theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-500 group-hover/theme:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-400 group-hover/theme:-rotate-12 transition-transform duration-300" />
              )}
              <span className="font-medium">Theme</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">{theme}</span>
          </button>

          {/* Help / Tutorial */}
          <button
            onClick={() => setShowTutorial(true)}
            className="w-full py-2 px-3.5 rounded-xl border bg-background border-border text-muted hover:text-foreground flex items-center justify-between transition-premium text-xs"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span>Tutorial</span>
            </span>
            <Link href="/help" className="text-[10px] text-emerald-500 hover:underline" onClick={(e) => e.stopPropagation()}>
              Guide
            </Link>
          </button>

          {/* Notifications Toggle/Settings */}
          <button
            onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            className={`w-full py-2 px-3.5 rounded-xl border flex items-center justify-between transition-premium text-xs ${
              showNotificationSettings
                ? "bg-emerald-950/40 border-[#7FE08A]/40 text-emerald-400"
                : "bg-background border-border text-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Reminders</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">
              {notifsEnabled ? "On" : "Off"}
            </span>
          </button>

          {/* Notifications Inline Settings Card */}
          {showNotificationSettings && (
            <div className="p-3.5 rounded-xl border border-border bg-background/50 backdrop-blur-md space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Return Reminders</span>
                <button
                  onClick={toggleNotifications}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifsEnabled ? "bg-emerald-500" : "bg-neutral-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      notifsEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {notifsEnabled && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
                      Reminder Interval
                    </span>
                    <select
                      value={notifInterval}
                      onChange={(e) => changeInterval(Number(e.target.value) as any)}
                      className="w-full bg-background border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value={10000}>10 seconds (Test)</option>
                      <option value={60000}>1 minute (Demo)</option>
                      <option value={900000}>15 minutes</option>
                      <option value={1800000}>30 minutes</option>
                      <option value={3600000}>1 hour</option>
                      <option value={7200000}>2 hours</option>
                    </select>
                  </div>

                  <button
                    onClick={() => sendImmediateNotification("Grove reminder", "This is a quick test reminder to check on your Grove creations! 🌱")}
                    className="w-full py-1 px-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 rounded-lg text-[10px] font-semibold text-emerald-400 transition-all active:scale-[0.98]"
                  >
                    Send Test
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          <div className="flex items-center gap-2.5 bg-background border border-border py-2 px-3.5 rounded-xl text-xs text-foreground font-medium">
            <User className="w-4 h-4 text-emerald-500" />
            <span className="truncate flex-1">{user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              title="Sign out"
              className="text-muted hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden md:pb-0 pb-24">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 z-40 glass-premium border-b border-border py-4 px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full glow-emerald"></span>
            <span className="font-semibold text-lg tracking-tight text-foreground">
              Grove
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Trigger */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-border bg-surface text-muted hover:text-foreground transition-premium"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            <button
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className={`p-2 rounded-full border transition-premium ${
                showNotificationSettings
                  ? "bg-emerald-950/40 border-[#7FE08A]/40 text-emerald-400"
                  : "bg-surface border-border text-muted hover:text-foreground"
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-full border bg-surface border-border text-muted hover:text-foreground transition-premium"
              title="Tutorial"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="p-2 rounded-full border bg-surface border-border text-muted hover:text-red-400 transition-premium"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 bg-surface border border-border py-1 px-2.5 rounded-full text-xs text-foreground font-medium">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span className="truncate max-w-[80px]">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Notification Settings Drawer (Mobile) */}
        {showNotificationSettings && (
          <div className="z-50 bg-surface border-b border-[#7FE08A]/30 animate-fade-in sticky top-[61px] md:hidden p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground">Return Reminders</h4>
                <p className="text-[11px] text-muted">Get notifications when you leave Grove idle</p>
              </div>
              <button
                onClick={toggleNotifications}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifsEnabled ? "bg-emerald-500" : "bg-neutral-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifsEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {notifsEnabled && (
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
                    Reminder Interval
                  </span>
                  <select
                    value={notifInterval}
                    onChange={(e) => changeInterval(Number(e.target.value) as any)}
                    className="w-full bg-background border border-border rounded-lg p-1.5 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value={10000}>10 seconds (Test)</option>
                    <option value={60000}>1 minute (Demo)</option>
                    <option value={900000}>15 minutes</option>
                    <option value={1800000}>30 minutes</option>
                    <option value={3600000}>1 hour</option>
                    <option value={7200000}>2 hours</option>
                  </select>
                </div>

                <div className="h-full flex items-end">
                  <button
                    onClick={() => sendImmediateNotification("Grove reminder", "This is a quick test reminder to check on your Grove creations! 🌱")}
                    className="w-full py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400 transition-all active:scale-[0.98]"
                  >
                    Send Test
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && <TutorialModal onClose={closeTutorial} />}

        {/* Main Content Area */}
        <main
          key={pathname}
          className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-6 py-8 relative z-10 animate-fade-in"
        >
          {children}
        </main>

        {/* Bottom Floating Navigation (Mobile/Tablet Only) */}
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[21.5rem] z-40 glass-premium rounded-full py-3.5 px-6 flex items-center justify-between shadow-[0_15px_50px_rgba(0,0,0,0.7)]">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 group relative transition-colors ${
              isActive("/") ? "text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <HomeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-[10px] tracking-wide font-medium">Ecosystem</span>
            {isActive("/") && (
              <span className="absolute -bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>

          <Link
            href="/worlds"
            className={`flex flex-col items-center gap-1 group relative transition-colors ${
              isActive("/worlds") || isActive("/world") ? "text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <Globe className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-[10px] tracking-wide font-medium">Worlds</span>
            {(isActive("/worlds") || isActive("/world")) && (
              <span className="absolute -bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>

          <Link
            href="/dump"
            className={`flex flex-col items-center gap-1 group relative transition-colors ${
              isActive("/dump") ? "text-emerald-400" : "text-muted hover:text-foreground"
            }`}
          >
            <Trash2 className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-[10px] tracking-wide font-medium">The Dump</span>
            {isActive("/dump") && (
              <span className="absolute -bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></span>
            )}
          </Link>
        </nav>
      </div>
    </div>
  );
}
