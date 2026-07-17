"use client";

import { SessionProvider } from "next-auth/react";
import { StateProvider } from "@/context/StateContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StateProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </StateProvider>
    </SessionProvider>
  );
}
