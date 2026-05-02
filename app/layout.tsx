import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Abraham to Jesus — the messianic genealogy",
  description:
    "An interactive lineage from Abraham through the twelve tribes, the Davidic kings, the exile, and the post-exilic line to Jesus of Nazareth. Click any name for context.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0d0a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          margin: 0,
          background: "#0f0d0a",
          fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}