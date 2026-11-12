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

## Esperando pelo José
- MK-06: a folga de reteste (10% dos destrutivos) diverge do ajuste 6, que trata a gordura de 10 a 20% como a própria folga. Manter as duas premissas ou aplicar a mesma gordura nos dois lados? (revisão independente, achado 3)
- Supabase (05b): a organização `fiortech's Org` está no plano Pro, então todo projeto novo é pago. Ou o José cria uma organização Free com o projeto e passa o id, ou a 05b vai para o roadmap (recomendado)
- Chave do OpenRouter em `backend/.env`: sem ela o copiloto roda offline e a 05 fica em andamento
- Adotar meta de 18 semanas (+11 carros, 2 semanas de folga no marco)?
- Conflito RNF-01 "sem backend" × FastAPI (ADR 0001)

## Riscos
- Copiloto depende do OpenRouter free: fora do ar ou sem chave, a demo usa o intérprete offline (só entende "<ID> atrasou N semanas" e "<ID> falhou")
- MK-01 é a premissa mais sensível: 125 testes por área foram calibrados para os pedidos somarem perto de 250
