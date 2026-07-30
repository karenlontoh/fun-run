import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paulus Fun Run 2026",
  description:
    "Paulus Fun Run 2026 — event lari komunitas GPIB Paulus Jakarta. Daftar sekarang dan jadi bagian dari keseruannya!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${anton.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-navy antialiased">
        {children}
      </body>
    </html>
  );
}
