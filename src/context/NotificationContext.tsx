"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type NotificationInterval = 10000 | 60000 | 900000 | 1800000 | 3600000 | 7200000;

interface NotificationContextType {
  supported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  interval: NotificationInterval;
  toggleNotifications: () => Promise<boolean>;
  changeInterval: (val: NotificationInterval) => void;
  sendImmediateNotification: (title: string, body: string) => void;
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());

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

    // Timer check loop (runs every 2 seconds to check if idle limit is reached)
    timerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActiveRef.current;
      if (idleTime >= interval) {
        // Send return to work notification
        const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        sendImmediateNotification("Grove: Time to return to work", randomMsg);
        
        // Reset activity so we don't spam every tick
        lastActiveRef.current = Date.now();
      }
    }, 2000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, permission, interval, supported, swRegistration]);

  return (
    <NotificationContext.Provider
      value={{
        supported,
        permission,
        enabled,
        interval,
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
