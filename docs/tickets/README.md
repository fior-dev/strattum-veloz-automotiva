# Tickets

Fatias verticais tracer-bullet: cada uma atravessa motor → API → tela e se demonstra sozinha.
status: aprovado pelo José · 12/11/2026 · Decidido por: José

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
| 07 | [Aceite que passa do marco](07-passar-do-marco.md) | 04 | 30 min | D4 | pedido do José, 12/11 |
| 08 | [Publicar para a Strattum testar](08-publicar.md) | 06b | 1h | — | pedido do José, 12/11 |
| 09 | [Ajustes da revisão dos documentos](09-revisao-dos-docs.md) | 06b | 1h | — | pedido do José, 12/11 |
| 10 | [Memória de cálculo e simulação](10-memoria-e-simulacao.md) | 09 | 2h | D3, D8 | pedido do José, 12/11 |
| 11 | [Ajustes do teste do José na tela](11-ajustes-do-teste-do-jose.md) | 10 | 2h | D3, D4, D8 | pedido do José, 13/11 |
| 06a | [Acabamento visual](06a-acabamento.md) | 04 | 1h | — | — |
| 06b | [README, ROADMAP, diagrama](06b-docs-finais.md) | — | 1h30 | — | começa até 15h; tudo pronto 17h |

Regra: ticket que passar do dobro da estimativa corta escopo e manda o resto para o `ROADMAP.md`.

## Esperando pelo José
- MK-06: a folga de reteste (10% dos destrutivos) e a gordura do pedido (10% a 20%, ajuste 6) são duas premissas diferentes. Manter as duas ou aplicar a mesma gordura nos dois lados? (revisão independente, achado 3)
- Histórico do git: o ref do projeto Supabase saiu dos arquivos, mas segue nos commits antigos. Reescrever o histórico antes de tornar o repo público?

## Decidido pelo José
- 13/11: o plano fica na meta 20 por enquanto. A meta 18 continua na simulação, com o preço à vista.
- 13/11: publicação sem hospedagem. O backend roda na máquina do José e um Cloudflare Tunnel publica a URL, atrás do Cloudflare Access (login por e-mail). O contêiner fica para o piloto (ticket 08, ADR 0006).

## Riscos
- Publicado atrás de login por e-mail (Cloudflare Access), sem perfis nem limite de chamadas: todo avaliador liberado muda o plano e usa o copiloto. Todos dividem o mesmo plano e a mesma proposta pendente. A demo depende da máquina do José ligada. A chave do LLM fica no `.env` do José e não vai para nenhum host
- Na máquina de desenvolvimento, o antivírus (Kaspersky) intercepta o HTTPS (o certificado do openrouter.ai vem assinado pela raiz do Kaspersky). O LiteLLM usa o `certifi` e recusa esse certificado, então parte das chamadas do copiloto falha com `SSLCertVerificationError`, também dentro do Docker. Na demo local: excluir openrouter.ai da verificação de HTTPS do Kaspersky, ou usar o intérprete offline
- Copiloto depende do OpenRouter free: em 12/11 o modelo respondeu 429 (limite do provedor) antes de completar. Sem chave, a demo usa o intérprete offline (só entende "<ID> atrasou N semanas" e "<ID> falhou"). Com chave e o provedor fora do ar, o copiloto responde "fora do ar" e a mesma ação segue pelo botão "Atrasou"
- MK-01 é a premissa mais sensível: 125 testes por área foram calibrados para os pedidos somarem perto de 250
