import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FolioLens — track your investments",
  description: "Multi-asset portfolio tracking: holdings, live value, gains and XIRR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
