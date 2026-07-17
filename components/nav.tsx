"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/renda-fixa", label: "Renda Fixa" },
  { href: "/gastos-fixos", label: "Gastos Fixos" },
  { href: "/transacoes", label: "Transações" },
  { href: "/viagens", label: "Viagens" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-lg font-semibold">Couple Finance 💸</span>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <form action={logout}>
            <button
              type="submit"
              className="ml-2 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-expense"
            >
              Sair
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
