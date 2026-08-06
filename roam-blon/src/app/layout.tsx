import type { Metadata, Viewport } from "next"; // Added Viewport type
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingAIChat from "@/components/FloatingAIChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. General Metadata
export const metadata: Metadata = {
  title: "Roam-blon",
  description: "Your AI Travel Buddy for Romblon, Philippines",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roam-Blon",
  },
};

// 2. VIEWPORT SETTINGS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f43f5e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0, overflowX: "hidden" }} // Added to prevent side-scrolling
      >
        {children}
        <FloatingAIChat />
      </body>
    </html>
  );
}