import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-display",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paulus Fun Run 2026",
  description:
    "Paulus Fun Run 2026 — a community run by GPIB Paulus Jakarta. Register now and be part of the fun!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream text-navy antialiased">
        {children}
      </body>
    </html>
  );
}
