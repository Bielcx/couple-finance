import { PiggyBank } from "lucide-react";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="relative w-full max-w-sm">
        <div
          aria-hidden="true"
          className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/20 blur-3xl"
        />

        <div className="rounded-3xl border border-border bg-surface p-8 shadow-glow">
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <PiggyBank className="h-6 w-6 text-primary" />
            Couple Finance
          </h1>
          <p className="mb-6 text-sm text-muted">
            Entre com sua conta para acessar as finanças do casal.
          </p>

          {error && (
            <p className="mb-4 rounded-3xl border border-expense/20 bg-expense/10 px-4 py-2.5 text-sm text-expense">
              {error}
            </p>
          )}

          <form action={login} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
                placeholder="voce@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-muted" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover"
            >
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted/70">
            Contas são criadas manualmente no painel do Supabase — não há
            cadastro público.
          </p>
        </div>
      </div>
    </main>
  );
}
