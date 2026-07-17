"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plane,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { BeamDivider } from "./beam-divider";

const links: { href: string; label: string; short: string; Icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", short: "Início", Icon: LayoutDashboard },
  { href: "/renda-fixa", label: "Renda Fixa", short: "Renda", Icon: Wallet },
  { href: "/gastos-fixos", label: "Gastos Fixos", short: "Fixos", Icon: Receipt },
  { href: "/transacoes", label: "Transações", short: "Trans.", Icon: CreditCard },
  { href: "/viagens", label: "Viagens", short: "Viagens", Icon: Plane },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Topo: sempre visível. Nav horizontal só aparece em telas sm+ */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <PiggyBank className="h-5 w-5 text-primary" />
            Couple Finance
          </span>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    active ? "text-white" : "text-muted hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-glow"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}

            <form action={logout}>
              <button
                type="submit"
                className="ml-2 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-muted transition hover:bg-surface-hover hover:text-expense active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </nav>

          <form action={logout} className="sm:hidden">
            <button
              type="submit"
              aria-label="Sair"
              title="Sair"
              className="rounded-full p-2.5 text-muted transition hover:bg-surface-hover hover:text-expense active:scale-90"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
        <BeamDivider />
      </header>

      {/* Bottom tab bar: só no mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute top-1 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <link.Icon className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted"}`} />
                <span className={active ? "text-primary" : "text-muted"}>{link.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
