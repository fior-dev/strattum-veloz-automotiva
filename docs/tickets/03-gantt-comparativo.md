# 03 · Gantt por protótipo e comparativo com folga ajustável

Dor: D2, D3 · Depende de: 02 · Estimativa: 1h30 · Estado: feito · Real: 2 min · Commits: ed2a939

## O quê
- Tela com o Gantt: linha por protótipo, coluna por semana (1 a 20), célula com área (cor) e ID do teste. Carro destruído marcado.
- Cartões: frota como hoje × frota proposta (plano + folga de reteste), semana de fim dos dois, testes que não cabem.
- Controle da folga de reteste (0% a 30%, padrão MK-06).
- Selo "mock" com o ID da premissa em todo número suposto (RF-07).

## Aceite
- [ ] RF-03: os dois números de frota e as duas semanas de fim; o "como hoje" é a soma dos pedidos (teste).
- [ ] RF-04: célula mostra área e ID do teste; carro destruído marcado.
- [ ] RF-07: selo com MK-xx nos números do mock.
- [ ] Mudar a folga muda a frota proposta, sem mudar o plano (teste).

Tempo real: os tickets 01 a 03 saíram num só commit; o tempo medido entre o commit anterior e o deles foi dividido por igual.
