# 04c · Gestão de projetos na tela: caminho crítico, marco, impacto e uso da frota

Dor: D8 · Origem: pedido do José, 12/11/2026, depois de ver a tela · Depende de: 04 · Estimativa: 1h30 · Antes da linha de corte das 13h
Decisão: ADR 0007. Ordem de corte se faltar tempo: elemento 4, depois 3, depois 2; o 1 fica.

## O quê
1. Caminho crítico: folga por teste (função pura em `domain/gestao.py`), destaque discreto no Gantt e folga no hover.
2. Marco do lançamento: linha na semana 20 e indicador de folga do projeto (verde, amarelo, vermelho).
3. Impacto no marco na proposta de replanejamento: fim antes e depois, semanas de folga consumidas, se o teste estava no caminho crítico.
4. Uso da frota por semana: em uso × parados × destruídos, como hoje e no plano.

Extra, só leitura: curva meta de fim × carros.

## Aceite
- [x] TDD: fim do plano, folga da cadeia, crítico = folga 0, folga do projeto e sinal, impacto com e sem mudança de fim, histograma (`backend/tests/test_gestao.py`).
- [x] Cenário da demo: AER-99 crítico e marco preservado (teste sobre o mock).
- [x] `GET /api/gestao` e `marco` na proposta.
- [x] Tela: bloco "O que segura a data de lançamento", Gantt com marco e crítico, impacto na proposta, histograma.
