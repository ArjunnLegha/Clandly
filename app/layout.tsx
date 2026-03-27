import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/layout/app-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clandly — Scheduling",
  description: "Book and manage meetings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-white">
          <AppNav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
