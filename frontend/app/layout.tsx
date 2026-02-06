import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import AppProvider from "@/providers/AppProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deadpool Arena",
  description: "Onchain prediction arena for ETH price battles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <meta name="apple-mobile-web-app-title" content="DeadPool" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <div className="min-h-screen pl-4 pr-5 pb-12 pt-6 text-foreground sm:pl-6 sm:pr-7 sm:pb-16 sm:pt-8">
            <div className="mx-auto w-full max-w-6xl">
              <SiteHeader />
              <div className="mt-10">{children}</div>
            </div>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
