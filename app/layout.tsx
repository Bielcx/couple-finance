import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Couple Finance",
  description: "Controle financeiro do casal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
