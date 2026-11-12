# Tickets

Fatias verticais tracer-bullet: cada uma atravessa motor → API → tela e se demonstra sozinha.
status: proposto, aguardando revisão do José · 12/11/2026

| # | Ticket | Depende de | Estimativa | Dor | Prazo (ajuste 9) |
|---|---|---|---|---|---|
| 01 | [Esqueleto andando](01-esqueleto.md) | — | 1h | D2 | manhã |
| 02 | [Motor `planejar` e baseline](02-motor-planejar.md) | 01 | 2h | D1 | manhã |
| 03 | [Gantt e comparativo com folga](03-gantt-comparativo.md) | 02 | 1h30 | D2, D3 | manhã |
| 04 | [Replanejar](04-replanejar.md) | 03 | 2h | D4, D5 | 13h (linha de corte) |
| 04b | [Avarias](04b-avarias.md) | 04 | 1h | D6 | depois do corte |
| 04c | [Gestão de projetos](04c-gestao-de-projetos.md) | 04 | 1h30 | D8 | 13h (pedido do José, 12/11) |
| 05 | [Copiloto de replanejamento](05-copiloto.md) | 04 | 2h | D4 | só se 01–04 às 13h |
| 05b | [Adapter Supabase](05b-supabase.md) | 04 | 45 min (teto) | — | só se 01–04 às 13h |
| 06a | [Acabamento visual](06a-acabamento.md) | 04 | 1h | — | — |
| 06b | [README, ROADMAP, diagrama](06b-docs-finais.md) | — | 1h30 | — | começa até 15h; tudo pronto 17h |

Regra: ticket que passar do dobro da estimativa corta escopo e manda o resto para o `ROADMAP.md`.
