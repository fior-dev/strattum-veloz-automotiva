# 05b · Adapter Supabase (Postgres) para o `PlanoRepository`

Dor: — · Depende de: 04 · Teto: 45 min · Só entra se 01 a 04 estiverem prontas às 13h (ajuste 14). · Estado: feito · Real: 14 min · Commits: 6d1a5c8

## O quê
- Projeto Supabase novo, free, numa organização Free do José (criado por ele em 12/11: a organização da Fiortech é Pro e cobraria o projeto).
- Schema mínimo (prototipos, testes, pedidos, planos com versão) e seed do `mock.json`.
- `SupabasePlanoRepository`; o `container.py` escolhe por `DATA_BACKEND=json|supabase`.

## Aceite
- [x] Nenhuma linha de `domain/` ou `application/` muda (diff).
- [x] Os mesmos testes de caso de uso passam com o adapter novo: em 12/11, 14h20, schema aplicado pelo MCP do Supabase, seed de 250 protótipos, 625 testes e 5 pedidos, e `uv run pytest` com 55 passando, sem pulados.
- [x] Não travou: 14 min no total.
- [x] A chave publicável não lê nenhuma linha e o insert com ela volta 401 (conferido pela API REST em 12/11).

Adapter em `backend/infrastructure/supabase_repo.py`, só com a stdlib (urllib → PostgREST). Schema em `supabase/migrations/`, com RLS ligado e nenhuma política: só a chave secreta do backend acessa. Teste de contrato: `backend/tests/test_repositorios.py` roda o cenário da demo nos dois repositórios.
