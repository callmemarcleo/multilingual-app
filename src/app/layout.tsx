import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multilingual",
  description: "Created by Lenny Ruprecht",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="relative h-screen w-screen bg-[#141F24]">
        {children}
      </body>
    </html>
  );
}
