import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { RootProviders } from "@/components/shared/root-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trails — your learning roadmap",
    template: "%s — Trails",
  },
  description: "A focused place to collect, practice, and track what you are learning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${jetbrainsMono.variable}`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
