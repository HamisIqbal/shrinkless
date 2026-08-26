import type { Metadata } from "next";
import {
  Inter_Tight,
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Geist_Pixel,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Neue Haas Grotesk is licensed and Helvetica Neue cannot be served as a
// webfont, so Inter Tight is the shipped face. The stack in globals.css puts
// Helvetica Neue ahead of it for machines that already have it locally.
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

// An accent, used twice: the testimonial quotation marks and nothing else.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cormorant",
  display: "swap",
});

// --- Home page only ------------------------------------------------------
// The storefront at large stays on Inter Tight. The home page mixes Geist
// (body and UI), Geist Mono (labels, counts, captions), Geist Pixel (the
// numbered tile indices) and Humane, the condensed display face shipped in
// public/font, for every headline.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const geistPixel = Geist_Pixel({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-geist-pixel",
  display: "swap",
});

// Humane ships as per-weight webfonts, so the faces are declared by hand.
const humane = localFont({
  src: [
    { path: "../public/font/Web-TT/Humane-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/font/Web-TT/Humane-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/font/Web-TT/Humane-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/font/Web-TT/Humane-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/font/Web-TT/Humane-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-humane",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shrinkless — Organic Tees That Don't Shrink",
    template: "%s — Shrinkless",
  },
  description:
    "Garment dyed organic cotton tees engineered to hold their shape, wash after wash. Made in USA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${cormorant.variable} ${geist.variable} ${geistMono.variable} ${geistPixel.variable} ${humane.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
