-- Couple Finance — permitir editar o nome/cor dos dois perfis
-- Rode este arquivo no SQL Editor do Supabase depois do 0004.
--
-- O app é de duas pessoas que já veem tudo uma da outra (mesma regra das
-- outras tabelas), então qualquer um dos dois pode ajustar os dois nomes.

drop policy if exists "user updates own profile" on profiles;

create policy "authenticated updates profiles" on profiles
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
