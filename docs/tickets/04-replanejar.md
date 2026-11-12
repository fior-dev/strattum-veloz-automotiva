# 04 · Replanejar: atraso de +N semanas, falha e aceite

Dor: D4, D5 · Depende de: 03 · Estimativa: 2h · Estado: feito · Commits: f8b28e9

## O quê
- `domain/motor.py`: `replanejar(plano, evento) → proposta` (sugestões de troca, impactados, plano novo), regras do SPEC.
- Rotas: mudar status de um teste (RF-05); `POST /plano/eventos` devolve a proposta; `POST /plano/propostas/aceitar` cria a versão N+1; `GET /plano/versoes/{n}` consulta versões antigas.
- Tela: clicar num teste abre o painel de status; a proposta aparece com "Aceitar" (gerente da coordenação, RN-07).

## Aceite (§13)
- [ ] RN-05 com troca, sem troca e sem colisão.
- [ ] Atraso de +N (N > 1) empurra o fim N semanas.
- [ ] RN-08: não destrutivo que falha ganha reteste no mesmo carro; destrutivo ganha carro livre.
- [ ] RN-06 no replanejamento: passar da semana 20 vira impacto.
- [ ] RF-05: atrasado ou falhou dispara o replanejamento na mesma ação.
- [ ] RF-06: aceitar cria a versão N+1 e a N continua consultável.
