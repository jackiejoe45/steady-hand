import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/lib/analytics";
import { AppShell } from "@/components/AppShell";
import { DesktopGate } from "@/components/DesktopGate";
import { NavBar } from "@/components/NavBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SteadyHand",
  description: "One angle. One shot. ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SteadyHand",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full bg-[var(--bg)] text-[var(--fg)]">
        <ThemeProvider>
          <AnalyticsProvider>
            <DesktopGate>
              <div className="mobile-shell">
                <AppShell>
                  <main className="mobile-main">{children}</main>
                </AppShell>
                <NavBar />
              </div>
            </DesktopGate>
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
