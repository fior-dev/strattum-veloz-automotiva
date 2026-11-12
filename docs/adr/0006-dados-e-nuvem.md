# ADR 0006 · Dados em JSON no protótipo, Postgres (Supabase) como alvo; nuvem-alvo AWS

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
A demo não pode falhar por rede ou banco. O dado é mockado. O plano tem versões (RF-06).

## Decisão
- Fatias 1 a 4: `JsonPlanoRepository` lê `backend/data/mock.json` e guarda as versões do plano em memória. Reiniciar o backend volta ao mock, o que deixa a demo reproduzível.
- Fatia 5b: `SupabasePlanoRepository`, escolhido por `DATA_BACKEND` no `container.py`. Fala com o PostgREST só com a stdlib (urllib), sem dependência nova. O plano é gravado inteiro como documento `jsonb` por versão, porque o motor lê e grava o plano inteiro. RLS ligado e nenhuma política: só a chave secreta, no `backend/.env`, acessa. Projeto numa organização Free do José (`portfolio`), porque a organização da Fiortech é Pro e cobraria o projeto (decidido pelo José, 12/11).
- O mock é gerado por `backend/scripts/gerar_mock.py`, com semente fixa (MK-07). O script calibra só as entradas; o número do plano compartilhado sai do motor (PREMISSAS.md, MK-03).
- Nuvem-alvo: AWS. Backend em contêiner (ECS Fargate), SPA estática (S3 + CloudFront), Postgres gerenciado (Supabase ou RDS), segredos no Secrets Manager. Nada disso roda no protótipo.

## Alternativas descartadas
- **SQLite local.** Um passo a mais sem ganho sobre o JSON na demo, e não é o banco-alvo.
- **Supabase desde a fatia 1.** Risco de rede na demo e tempo de setup antes de existir valor.

## Consequências
- Com o JSON, o plano aceito some ao reiniciar: a demo é reproduzível. Com o Supabase, ele fica: `scripts/seed_supabase.py` volta ao mock.
- Plano como documento: não dá para consultar uma alocação solta em SQL. Aceitável enquanto só o motor lê; vira tabela de alocações quando o BI precisar (ROADMAP v3).
