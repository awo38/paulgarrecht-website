import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono, Caveat } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// For the hand-written margin notes in the scroll story — a real engineer's
// pencil annotation on a drawing, not another sans-serif in disguise.
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Paul Garrecht — Project Engineer",
  description:
    "Paul Garrecht — Projektingenieur, Mechatronik & Anlagenbau, internationaler Schweißfachingenieur (IWE). Kerntechnischer Rückbau bei MHC Anlagentechnik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} ${caveat.variable}`}
    >
      <body className="cad-cursor-active bg-background text-foreground antialiased">
        <div className="industrial-bg" />
        <CustomCursor />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
