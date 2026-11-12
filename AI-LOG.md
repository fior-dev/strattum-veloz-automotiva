# Registro do uso de IA

A Strattum pediu este registro como entrega do case. Cada linha diz o que foi feito, com qual ferramenta, a partir de qual entrada e o que saiu.

| Data | Etapa | Ferramenta | Entrada | Saída |
|---|---|---|---|---|
| 11/11 | Discovery | Granola | Entrevista de 11/11, 11:30 | Transcrição e resumo |
| 11/11 | Discovery | Gemini | Transcrição | Resumo das descobertas e primeira versão das regras de alocação, com 3 níveis de teste |
| 11/11 | Premissas | IA, colada pelo José | Regras do Gemini | Simplificação para 3 variantes, destrutivo sim/não e replanejamento por troca |
| 11/11 | Discovery | Claude Code (Opus 5.5) | Transcrição, notas do José, premissas, *FDE Playbook* | `docs/01-discovery.md` v0.1 |
| 11/11 | Discovery | Claude Code (Opus 5.5, esforço high), revisão independente | `docs/01-discovery.md` v0.1, transcrição, notas | 18 correções aplicadas na v0.2: etiquetas de fonte, "como hoje" definido, regra de repetição, heurística, premissas do mock, critérios por requisito |
| 12/11 | Prompt de execução | Claude Code (Opus 5.5) | Prompt do José + discovery v0.3 + e-mail da Maira | `docs/prompt-execucao.md`: 15 ajustes que prevalecem sobre o prompt (sem variantes, avarias, prazo 17h, grill por escrito) |
| 12/11 00h15 | Grill por escrito | Claude Code (Opus 5.5, esforço médio) + advisor | Discovery v0.3, prompt de execução | `CONTEXT.md`, `PREMISSAS.md`, ADRs 0001–0006, `SPEC.md`, tickets. O advisor apontou dois pontos que entraram: calibrar só a entrada do mock (o número do plano sai do motor) e registrar o conflito RNF-01 "sem backend" × FastAPI no ADR 0001 |
| 12/11 00h30 | Revisão independente | Claude Code (Opus 5.5, esforço high), subagente sem o contexto da sessão | Os rascunhos acima, discovery, prompt | Ver a seção "Revisões" abaixo |
| 12/11 00h35 | Fatias 1–3 | Claude Code (Opus 5.5) | Tickets 01–03 | TDD do motor: 11 testes vermelhos a partir do §13 do discovery, depois verdes. As fatias 1 e 2 saíram num só commit: o esqueleto já nasceu com o motor de verdade em vez de um plano fixo |
| 12/11 00h40 | Calibração do mock | Claude Code | MK-01 e MK-03 | 8 a 12 testes por área não chegavam perto de 250 carros. Calibrado para 125 por área (pedidos somam 245); o plano compartilhado (161 + 7 de folga) sai do motor sem ajuste. Desvio registrado em `PREMISSAS.md` |
| 12/11 01h | Fatias 4 e 4b | Claude Code (Opus 5.5) | Tickets 04 e 04b, §13 do discovery | TDD: 11 testes vermelhos de `replanejar` (RN-05 com troca, sem troca, sem colisão, +N semanas, RN-06, RN-08, RN-09), verdes na primeira implementação. Cenário da demo achado no mock: AER-99 "Vedação na chuva" atrasa e empurra DIN-02 para um carro da folga |
| 12/11 01h30 | Ticket 04c, pedido do José | Claude Code (Opus 5.5) + advisor | Pedido de 4 elementos de gestão de projetos | Antes de codar, medi no mock: 553 de 625 testes (88%) saem críticos pela regra do José, para qualquer meta de 17 a 20 semanas. O advisor recomendou manter a regra exata e fazer do número a mensagem (o plano troca folga de prazo por carros), mostrar a curva meta × carros só para leitura e medir o impacto no marco pela diferença entre planos, porque pelo RN-05 o atraso troca o carro em vez de empurrar a cadeia. ADR 0007 |
