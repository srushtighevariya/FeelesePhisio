import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FeelEase Physio — Clinic Dashboard",
    template: "%s | FeelEase Physio",
  },
  description:
    "Physiotherapy clinic management platform — patients, appointments, sessions, reports, and attendance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-page text-[#1A1A1A]`}>
        {children}
      </body>
    </html>
  );
}
