# 04b · Avarias (RN-09)

Dor: D6 · Depende de: 04 · Estimativa: 1h · Estado: feito · Commits: f8b28e9

## O quê
- A engenharia registra a avaria: protótipo, tipo (vidro, lataria, pneu, outro), gravidade (leve, compromete reuso), semana, área.
- Leve: aparece no Gantt (ícone na linha do carro) e não muda o plano.
- Compromete reuso: o carro sai do pool; os testes prometidos a ele depois da semana da avaria entram no replanejamento (RN-05).

## Aceite (§13)
- [ ] RN-09 leve: plano igual, avaria visível na linha do carro.
- [ ] RN-09 compromete reuso na semana 6: nenhuma alocação nova no carro; testes depois da semana 6 geram troca ou impacto.
- [ ] RF-08: registrar dispara o RN-09 na mesma ação.
