import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">Couple Finance 💸</h1>
        <p className="mb-6 text-sm text-slate-400">
          Entre com sua conta para acessar as finanças do casal.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            {error}
          </p>
        )}

        <form action={login} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Contas são criadas manualmente no painel do Supabase — não há
          cadastro público.
        </p>
      </div>
    </main>
  );
}
