"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type NotificationInterval = 10000 | 60000 | 900000 | 1800000 | 3600000 | 7200000;

interface NotificationContextType {
  supported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  interval: NotificationInterval;
  pushSubscribed: boolean;
  toggleNotifications: () => Promise<boolean>;
  changeInterval: (val: NotificationInterval) => void;
  sendImmediateNotification: (title: string, body: string) => void;
}

// Presets used for "fully random from presets" reminder scheduling (ms).
const RANDOM_PRESETS: NotificationInterval[] = [60000, 900000, 1800000, 3600000, 7200000];

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const REMINDER_MESSAGES = [
  "Your Grove is waiting for you! Let's nurture some seeds today. 🌱",
  "Time to check on your creations. Do any of them need some growth? 🌿",
  "A quick session can turn a seed into a thriving project. Return to Grove! ⚡",
  "Don't let your ideas freeze in the dump. Spend 5 minutes on Grove. ❄️",
  "Nurture your ecosystem. What are you building today? 🌸",
  "Your ideas are waiting. Take a moment to capture your latest spark! ✨"
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [interval, setIntervalVal] = useState<NotificationInterval>(1800000); // 30 mins default
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());
  const nextDelayRef = useRef<number>(interval);

  // Check support, permissions, and load settings
  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setSupported(isSupported);

    if (isSupported) {
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistration(reg);
          console.log("Service Worker registered successfully:", reg);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });

      // Load settings
      const savedEnabled = localStorage.getItem("grove_notifications_enabled") === "true";
      const savedInterval = localStorage.getItem("grove_notifications_interval");

      if (savedEnabled && Notification.permission === "granted") {
        setEnabled(true);
      }
      if (savedInterval) {
        setIntervalVal(parseInt(savedInterval, 10) as NotificationInterval);
      }
    }
  }, []);

  // Update permission dynamically if checked
  useEffect(() => {
    if (!supported) return;
    const intervalId = window.setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
        if (Notification.permission !== "granted") {
          setEnabled(false);
          localStorage.setItem("grove_notifications_enabled", "false");
        }
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [permission, supported]);

  // Subscribe this browser to Web Push (for offline + admin-sent notifications).
  const subscribeToPush = async (reg: ServiceWorkerRegistration | null) => {
    const registration = reg ?? swRegistration;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!registration || !vapidPublicKey || Notification.permission !== "granted") return;

    try {
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
      setPushSubscribed(res.ok);
    } catch (err) {
      console.warn("Push subscription failed (falling back to local notifications):", err);
      setPushSubscribed(false);
    }
  };

  // Request permission and toggle notifications
  const toggleNotifications = async () => {
    if (!supported) return false;

    if (permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setEnabled(false);
        return false;
      }
    } else if (permission === "denied") {
      alert("Please enable notification permissions in your browser settings to receive updates.");
      return false;
    }

    const nextState = !enabled;
    setEnabled(nextState);
    localStorage.setItem("grove_notifications_enabled", String(nextState));
    lastActiveRef.current = Date.now();

    if (nextState) {
      // Turning on: register for real Web Push too (best-effort).
      subscribeToPush(swRegistration);
    }
    return nextState;
  };

  // Change notification interval
  const changeInterval = (val: NotificationInterval) => {
    setIntervalVal(val);
    localStorage.setItem("grove_notifications_interval", String(val));
    lastActiveRef.current = Date.now();
  };

  // Trigger immediate notification
  const sendImmediateNotification = (title: string, body: string) => {
    if (!supported || permission !== "granted") return;

    const options: any = {
      body,
      icon: "/favicon.ico", // fallback icon
      badge: "/favicon.ico",
      tag: "grove-reminder",
      renotify: true,
      requireInteraction: true,
    };

    if (swRegistration) {
      swRegistration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  };

  // Schedule background reminder notifications based on inactivity
  useEffect(() => {
    if (!enabled || permission !== "granted" || !supported) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset activity timestamp on user interactions
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, handleActivity));

    // Pick the first random target delay from the presets.
    nextDelayRef.current = RANDOM_PRESETS[Math.floor(Math.random() * RANDOM_PRESETS.length)];

    // Timer check loop (runs every 2 seconds to check if idle limit is reached)
    timerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActiveRef.current;
      if (idleTime >= nextDelayRef.current) {
        // Send return to work notification
        const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        sendImmediateNotification("Grove: Time to return to work", randomMsg);

        // Reset activity and choose a NEW random preset delay for the next one.
        lastActiveRef.current = Date.now();
        nextDelayRef.current = RANDOM_PRESETS[Math.floor(Math.random() * RANDOM_PRESETS.length)];
      }
    }, 2000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, permission, supported, swRegistration]);

  // If notifications were already enabled from a previous session, (re)subscribe
  // to Web Push once the service worker is ready.
  useEffect(() => {
    if (enabled && permission === "granted" && swRegistration) {
      subscribeToPush(swRegistration);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, permission, swRegistration]);

  return (
    <NotificationContext.Provider
      value={{
        supported,
        permission,
        enabled,
        interval,
        pushSubscribed,
        toggleNotifications,
        changeInterval,
        sendImmediateNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
