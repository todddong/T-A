import type { Metadata } from "next";
import { Geist, Geist_Mono, Dancing_Script, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import LoveEnvelope from "./LoveEnvelope";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  weight: ["600", "700"],
  subsets: ["latin"],
});

// A clean editorial serif for large display text — the same family of look
// used for big headline text on anthropic.com/claude.ai.
const sourceSerif = Source_Serif_4({
  variable: "--font-serif-display",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T + A",
  description: "todd and annissa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dancingScript.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col romantic-bg">
        <LoveEnvelope />
        {children}
      </body>
    </html>
  );
}
