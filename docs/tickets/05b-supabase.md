# 05b · Adapter Supabase (Postgres) para o `PlanoRepository`

Dor: — · Depende de: 04 · Teto: 45 min · Só entra se 01 a 04 estiverem prontas às 13h (ajuste 14). · Estado: em andamento

## O quê
- Projeto Supabase novo, free, na organização `portfolio` do José (`epyjydcjopqgskdakfmg`, criado por ele em 12/11: a organização da Fiortech é Pro e cobraria o projeto).
- Schema mínimo (prototipos, testes, pedidos, planos com versão) e seed do `mock.json`.
- `SupabasePlanoRepository`; o `container.py` escolhe por `DATA_BACKEND=json|supabase`.

## Aceite
- [x] Nenhuma linha de `domain/` ou `application/` muda (diff).
- [ ] Os mesmos testes de caso de uso passam com o adapter novo.
- [ ] Travou mais de 45 min: abandona, fica o JSON, vai para o roadmap.

Adapter em `backend/infrastructure/supabase_repo.py`, só com a stdlib (urllib → PostgREST). Schema em `supabase/migrations/`, com RLS ligado e nenhuma política: só a chave secreta do backend acessa. Teste de contrato: `backend/tests/test_repositorios.py` roda o cenário da demo nos dois repositórios.
