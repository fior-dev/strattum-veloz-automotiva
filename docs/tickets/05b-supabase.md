# 05b · Adapter Supabase (Postgres) para o `PlanoRepository`

Depende de: 04 · Teto: 45 min · Só entra se 01 a 04 estiverem prontas às 13h (ajuste 14).

## O quê
- Projeto Supabase novo, free, na organização do José.
- Schema mínimo (prototipos, testes, pedidos, planos com versão) e seed do `mock.json`.
- `SupabasePlanoRepository`; o `container.py` escolhe por `DATA_BACKEND=json|supabase`.

## Aceite
- [ ] Nenhuma linha de `domain/` ou `application/` muda (diff).
- [ ] Os mesmos testes de caso de uso passam com o adapter novo.
- [ ] Travou mais de 45 min: abandona, fica o JSON, vai para o roadmap.
