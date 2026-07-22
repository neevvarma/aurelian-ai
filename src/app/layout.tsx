import type { Metadata } from "next";

import "./globals.css";
import "./global.css";

export const metadata: Metadata = {
  title: "Aurelian",
  description:
    "AI-powered research and business intelligence.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}