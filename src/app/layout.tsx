import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { NextAuthProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SettingsSync } from "@/providers/settings-sync";
import { PWARegister } from "@/providers/pwa-register";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Smart Routine Hub — ICE, University of Rajshahi",
  description:
    "Official academic schedule management portal for the Department of Information & Communication Engineering, University of Rajshahi. Real-time class routines, notices and resource library.",
  keywords: [
    "ICE RU",
    "Rajshahi University",
    "Class Routine",
    "Academic Schedule",
    "ICE Department",
    "Smart Routine Hub",
    "Spring 2026",
  ],
  authors: [{ name: "ICE Tech Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Routine Hub",
  },
  openGraph: {
    title: "Smart Routine Hub — ICE, University of Rajshahi",
    description: "Real-time class routines, notices & resource library for ICE Department, RU.",
    siteName: "Smart Routine Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Routine Hub",
    description: "Real-time class routines, notices & resource library for ICE Department, RU.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#059669" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${fraunces.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <NextAuthProvider>
            <QueryProvider>
              <SettingsSync />
              <PWARegister />
              <DesktopNav />
              <MobileHeader />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
              <MobileBottomNav />
              <Toaster position="top-center" richColors />
            </QueryProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
