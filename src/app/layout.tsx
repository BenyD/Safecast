import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafeCast - Community Safety & Incident Reporting",
  description:
    "Report and track incidents in Chennai like water logging, fallen trees, sewage issues, and other hazards. Help keep your community safe with real-time incident reporting.",
  keywords: [
    "incident reporting",
    "community safety",
    "Chennai",
    "water logging",
    "emergency",
    "hazards",
    "public safety",
  ],
  authors: [{ name: "SafeCast Team" }],
  creator: "SafeCast",
  publisher: "SafeCast",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://safecast.app",
    title: "SafeCast - Community Safety & Incident Reporting",
    description:
      "Report and track incidents in Chennai like water logging, fallen trees, sewage issues, and other hazards. Help keep your community safe.",
    siteName: "SafeCast",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SafeCast - Community Safety & Incident Reporting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeCast - Community Safety & Incident Reporting",
    description:
      "Report and track incidents in Chennai like water logging, fallen trees, sewage issues, and other hazards.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
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
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
