# ADR 0006 · Dados em JSON no protótipo, Postgres (Supabase) como alvo; nuvem-alvo AWS

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
A demo não pode falhar por rede ou banco. O dado é mockado. O plano tem versões (RF-06).

## Decisão
- Fatias 1 a 4: `JsonPlanoRepository` lê `backend/data/mock.json` e guarda as versões do plano em memória. Reiniciar o backend volta ao mock, o que deixa a demo reproduzível.
- Fatia 5b (opcional): `SupabasePlanoRepository`, escolhido por variável de ambiente no `container.py`.
- O mock é gerado por `backend/scripts/gerar_mock.py`, com semente fixa (MK-07). O script calibra só as entradas; o número do plano compartilhado sai do motor (PREMISSAS.md, MK-03).
- Nuvem-alvo: AWS. Backend em contêiner (ECS Fargate), SPA estática (S3 + CloudFront), Postgres gerenciado (Supabase ou RDS), segredos no Secrets Manager. Nada disso roda no protótipo.

## Alternativas descartadas
- **SQLite local.** Um passo a mais sem ganho sobre o JSON na demo, e não é o banco-alvo.
- **Supabase desde a fatia 1.** Risco de rede na demo e tempo de setup antes de existir valor.

## Consequências
- Plano aceito some ao reiniciar. Aceitável no protótipo; o adapter Postgres resolve.
