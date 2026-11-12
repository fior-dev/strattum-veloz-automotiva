# 07 · Aceite de proposta que passa do marco

Dor: D4 · Depende de: 04 · Estimativa: 30 min · Estado: feito · Real: 6 min · Commits: c1dd680

Pedido do José em 12/11, a partir do achado 4 da revisão do código: um atraso que empurra um teste além da semana 20 gerava um plano aceito que terminava depois do marco, e o Gantt cortava a barra na semana 20.

## O quê
- Por padrão, o aceite de uma proposta que termina depois do marco fica bloqueado (422 com o motivo).
- O gerente da coordenação pode marcar "passar do marco" na proposta; aí o aceite grava a versão nova.
- O Gantt ganha as semanas a mais, com o cabeçalho em vermelho depois do lançamento.

## Aceite
- [x] Sem a opção, o aceite é recusado e nada é gravado; com a opção, nasce a versão N+1: `test_rn06_proposta_que_passa_do_marco_so_e_aceita_se_o_gerente_permitir` em `backend/tests/test_planejamento.py`.
- [x] `POST /api/proposta/aceitar?estourar=true` no mapa de arquitetura.
- [x] `npm run build` passa. A tela não foi vista no navegador.
