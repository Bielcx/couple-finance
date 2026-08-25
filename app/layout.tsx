import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Couple Finance",
  description: "Controle financeiro do casal",
  appleWebApp: { capable: true, title: "Finance", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#0a0712",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-white antialiased selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
