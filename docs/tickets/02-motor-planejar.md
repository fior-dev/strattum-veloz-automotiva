# 02 · Motor `planejar` e baseline "como hoje"

Dor: D1 · Depende de: 01 · Estimativa: 2h · Estado: feito · Real: 2 min · Commits: ed2a939

## O quê
- `domain/motor.py`: `planejar(testes, prototipos, horizonte=20)`, a heurística do ADR 0002.
- Validação do mock (RF-01): campo faltando ou duração inválida é recusado com o item do erro.
- `scripts/gerar_mock.py`, semeado, gera `data/mock.json` com testes e pedidos (PREMISSAS.md, MK-03).
- Caso de uso `gerar_plano` e `comparar_com_baseline`.

## Aceite (TDD, um teste vermelho por critério do §13 do discovery)
- [ ] RN-01: qualquer protótipo livre recebe qualquer teste.
- [ ] RN-02: dois testes nunca dividem um carro na mesma semana.
- [ ] RN-03: carro liberado por um não destrutivo recebe teste de outra área depois.
- [ ] RN-04: nada depois do destrutivo; no máximo um destrutivo por carro.
- [ ] RN-06: teste que passaria da semana 20 vira "não cabe", com motivo.
- [ ] RF-01: mock inválido recusado com o item.
- [ ] RF-02: duas execuções, mesmo plano, alocação por alocação.

Tempo real: os tickets 01 a 03 saíram num só commit; o tempo medido entre o commit anterior e o deles foi dividido por igual.
