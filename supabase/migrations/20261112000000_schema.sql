-- Schema mínimo do PlanoRepository (ticket 05b, ADR 0006).
-- RLS ligado e nenhuma política: a chave publicável (navegador) não lê nem escreve nada.
-- Só o backend, com a chave secreta do .env, acessa as tabelas.

create table public.prototipos (
  id text primary key
);

create table public.testes (
  id text primary key,
  area text not null check (area in ('Elétrica/Eletrônica', 'Mecânica/Powertrain', 'Aerodinâmica',
                                     'Dinâmica veicular', 'Segurança passiva')),
  nome text not null,
  duracao int not null check (duracao between 1 and 20),
  destrutivo boolean not null
);

create table public.pedidos (
  area text primary key,
  carros int not null check (carros > 0),
  semanas int not null check (semanas between 1 and 20)
);

-- Cada versão do plano é um documento: o motor lê e grava o plano inteiro, nunca uma alocação solta.
create table public.planos (
  versao int primary key,
  dados jsonb not null,
  gravado_em timestamptz not null default now()
);

alter table public.prototipos enable row level security;
alter table public.testes enable row level security;
alter table public.pedidos enable row level security;
alter table public.planos enable row level security;
