-- A área "Dinâmica veicular" passou a se chamar "Hidráulica" (pedido do José, 12/11).
-- "not valid": vale para linha nova; as linhas antigas do mock somem no seed (scripts/seed_supabase.py).
alter table public.testes drop constraint if exists testes_area_check;
alter table public.testes add constraint testes_area_check check (area in
  ('Elétrica/Eletrônica', 'Mecânica/Powertrain', 'Aerodinâmica', 'Hidráulica', 'Segurança passiva')) not valid;
