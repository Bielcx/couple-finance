-- Couple Finance — mais categorias de gasto
-- Rode no SQL Editor do Supabase depois do 0005_profile_edit.sql

insert into categories (name, icon, color, kind) values
  ('Beleza/Cuidados Pessoais', 'scissors', '#f472b6', 'variable'),  -- unha, cabelo, barbearia
  ('Academia/Esportes',        'dumbbell', '#f59e0b', 'variable'),
  ('Farmácia',                 'pill',     '#0ea5e9', 'variable'),
  ('Pets',                     'paw',      '#a16207', 'variable'),
  ('Roupas/Calçados',          'shirt',    '#6366f1', 'variable'),
  ('Presentes',                'gift',     '#e11d48', 'variable'),
  ('Educação',                 'book',     '#0d9488', 'variable'),
  ('Casa/Manutenção',          'wrench',   '#78716c', 'variable'),
  ('Viagem',                   'plane',    '#38bdf8', 'variable'),
  ('Taxas/Impostos',           'receipt',  '#94a3b8', 'variable'),
  ('Investimentos',            'piggy',    '#16a34a', 'variable')
on conflict do nothing;
