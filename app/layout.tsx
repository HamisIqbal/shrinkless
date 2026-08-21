import type { Metadata } from "next";
import { Oswald, Zilla_Slab } from "next/font/google";
import "./globals.css";

// Spec §6: two families, no third. A condensed grotesque for headings and
// navigation, a slab serif for body and product copy.
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-oswald",
  display: "swap",
});

const zillaSlab = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-zilla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shrinkless",
  description: "Shirts, cut for everyday wear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${oswald.variable} ${zillaSlab.variable}`}>
      <body>{children}</body>
    </html>
  );
}
