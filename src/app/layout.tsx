import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Cairo, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ميزان | نظام إدارة مكاتب المحاماة",
    template: "%s | ميزان",
  },
  description: "ميزان — أول نظام سحابي عربي لإدارة مكاتب المحاماة. نظّم القضايا والجلسات والمهام والأتعاب من مكان واحد. مصمم خصيصاً للمحامين في الوطن العربي.",
  keywords: ["إدارة مكاتب محاماة", "نظام محاماة", "برنامج محاماة", "ميزان", "قضايا", "جلسات محاكم", "SaaS", "law firm management"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "ميزان | نظام إدارة مكاتب المحاماة",
    description: "أول نظام سحابي عربي لإدارة مكاتب المحاماة — نظّم القضايا والجلسات والمهام والأتعاب من مكان واحد.",
    siteName: "ميزان - Mizan",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "شعار ميزان",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ميزان | نظام إدارة مكاتب المحاماة",
    description: "أول نظام سحابي عربي لإدارة مكاتب المحاماة — نظّم القضايا والجلسات والمهام والأتعاب من مكان واحد.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${cairo.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
