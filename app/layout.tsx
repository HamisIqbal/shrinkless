import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shrinkless",
  description: "Shirts, cut for everyday wear.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
