import { createClient } from "@/lib/supabase/server";
import { buttonClass, inputClass } from "@/lib/utils";
import { updateProfile } from "./actions";
import type { Profile } from "@/lib/types";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
  const allProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Perfis</h1>
        <p className="text-sm text-muted">
          Como cada um aparece no app. A cor é usada nos filtros e gráficos.
        </p>
      </div>

      {allProfiles.map((profile, i) => (
        <form
          key={profile.id}
          action={updateProfile}
          className="fade-in-up flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-center"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <input type="hidden" name="id" value={profile.id} />
          <input
            name="name"
            required
            maxLength={40}
            defaultValue={profile.name}
            placeholder="Nome"
            className={`${inputClass} flex-1`}
          />
          <input
            name="color"
            type="color"
            defaultValue={profile.color}
            aria-label={`Cor de ${profile.name}`}
            className="h-11 w-16 cursor-pointer rounded-3xl border border-border bg-background p-1"
          />
          <button type="submit" className={buttonClass}>
            Salvar
          </button>
        </form>
      ))}
    </div>
  );
}
