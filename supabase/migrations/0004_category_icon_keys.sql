-- Couple Finance — troca os emojis das categorias por chaves de ícone
-- (o frontend agora renderiza ícones de verdade via lucide-react, não emoji)
-- Rode este arquivo no SQL Editor do Supabase depois do 0003_trips.sql

update categories set icon = 'home' where name = 'Moradia';
update categories set icon = 'wifi' where name = 'Internet/Telefone';
update categories set icon = 'tv' where name = 'Assinaturas';
update categories set icon = 'zap' where name = 'Contas de Casa (água/luz/gás)';
update categories set icon = 'car' where name = 'Transporte';
update categories set icon = 'cart' where name = 'Mercado';
update categories set icon = 'utensils' where name = 'Delivery/Restaurante';
update categories set icon = 'party' where name = 'Lazer';
update categories set icon = 'heart-pulse' where name = 'Saúde';
update categories set icon = 'bag' where name = 'Compras Diversas';
update categories set icon = 'briefcase' where name = 'Salário';
update categories set icon = 'plus-circle' where name = 'Outras Receitas';

-- qualquer categoria criada manualmente com emoji vira o ícone padrão (carteira)
update categories set icon = 'wallet' where icon !~ '^[a-z-]+$';

alter table categories alter column icon set default 'wallet';
