import type { Metadata, Viewport } from "next";
import { StateProvider } from "@/context/StateContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Shell from "@/components/layout/Shell";

import { Instrument_Sans } from "next/font/google";

import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grove",
  description:
    "A personal creative space to capture, develop, and revive ideas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grove",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body
        className={`${instrument.className} min-h-full flex flex-col bg-background text-foreground antialiased`}
      >
        <StateProvider>
          <NotificationProvider>
            <Shell>{children}</Shell>
          </NotificationProvider>
        </StateProvider>
      </body>
    </html>
  );
}