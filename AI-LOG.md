# Registro do uso de IA

A Strattum pediu este registro como entrega do case. Cada linha diz o que foi feito, com qual ferramenta, a partir de qual entrada e o que saiu.

| Data | Etapa | Ferramenta | Entrada | Saída | José |
|---|---|---|---|---|---|
| 11/11 | Discovery | Granola | Entrevista de 11/11, 11:30 | Transcrição e resumo |  |
| 11/11 | Discovery | Gemini | Transcrição | Resumo das descobertas e primeira versão das regras de alocação, com 3 níveis de teste |  |
| 11/11 | Premissas | IA, colada pelo José | Regras do Gemini | Simplificação para 3 variantes, destrutivo sim/não e replanejamento por troca | Escolheu as simplificações e colou as premissas |
| 11/11 | Discovery | Claude Code (Opus 5.5) | Transcrição, notas do José, premissas, *FDE Playbook* | `docs/01-discovery.md` v0.1 |  |
| 11/11 | Discovery | Claude Code (Opus 5.5, esforço high), revisão independente | `docs/01-discovery.md` v0.1, transcrição, notas | 18 correções aplicadas na v0.2: etiquetas de fonte, "como hoje" definido, regra de repetição, heurística, premissas do mock, critérios por requisito | Aprovou a v0.2 |
| 12/11 | Prompt de execução | Claude Code (Opus 5.5) | Prompt do José + discovery v0.3 + e-mail da Maira | `docs/prompt-execucao.md`: 15 ajustes que prevalecem sobre o prompt (sem variantes, avarias, prazo 17h, grill por escrito) | Escreveu o prompt e os 15 ajustes; aprovou a RN-07 e a RN-08 e definiu a RN-09 com a resposta da Maira |
| 12/11 00h15–00h21 | Grill por escrito | Claude Code (Opus 5.5, esforço médio) + advisor | Discovery v0.3, prompt de execução | `CONTEXT.md`, `PREMISSAS.md`, ADRs 0001–0006, `SPEC.md`, tickets. O advisor apontou dois pontos que entraram: calibrar só a entrada do mock (o número do plano sai do motor) e registrar o conflito RNF-01 "sem backend" × FastAPI no ADR 0001 |  |
| 12/11 00h21–10h40 | Revisão independente | Claude Code (Opus 5.5, esforço high), subagente sem o contexto da sessão | Os rascunhos acima, discovery, prompt | Ver a seção "Revisões" abaixo: 2 bloqueantes, 7 importantes e 4 menores, triados um a um |  |
| 12/11 00h21–00h27 | Fatias 1–3 | Claude Code (Opus 5.5) | Tickets 01–03 | TDD do motor: 11 testes vermelhos a partir do §13 do discovery, depois verdes. As fatias 1 e 2 saíram num só commit: o esqueleto já nasceu com o motor de verdade em vez de um plano fixo |  |
| 12/11 00h27 | Calibração do mock | Claude Code | MK-01 e MK-03 | 8 a 12 testes por área não chegavam perto de 250 carros. Calibrado para 125 por área (pedidos somam 245); o plano compartilhado (161 + 7 de folga) sai do motor sem ajuste. Desvio registrado em `PREMISSAS.md` |  |
| 12/11 00h27–00h31 | Fatias 4 e 4b | Claude Code (Opus 5.5) | Tickets 04 e 04b, §13 do discovery | TDD: 11 testes vermelhos de `replanejar` (RN-05 com troca, sem troca, sem colisão, +N semanas, RN-06, RN-08, RN-09), verdes na primeira implementação. Cenário da demo achado no mock: AER-99 "Vedação na chuva" atrasa e empurra DIN-02 para um carro da folga |  |
| 12/11 00h31–00h36 | Ticket 04c, pedido do José | Claude Code (Opus 5.5) + advisor | Pedido de 4 elementos de gestão de projetos | Antes de codar, medi no mock: 553 de 625 testes (88%) saem críticos pela regra do José, para qualquer meta de 17 a 20 semanas. O advisor recomendou manter a regra exata e fazer do número a mensagem (o plano troca folga de prazo por carros), mostrar a curva meta × carros só para leitura e medir o impacto no marco pela diferença entre planos, porque pelo RN-05 o atraso troca o carro em vez de empurrar a cadeia. ADR 0007 | Pediu os 4 elementos e definiu a regra do caminho crítico (ADR 0007) |
| 12/11 00h36–00h42 | Fatia 5, copiloto | Claude Code (Opus 5.5) | Ticket 05, ADR 0003 | Ports `ContextProvider` e `InterpretadorDeImprevisto`, Semantic Layer em `backend/semantic/contexto.json`, adapter LiteLLM → OpenRouter (`gemma-4-31b-it:free` com fallback `nemotron-3-ultra:free`, escolhidos na lista pública de modelos free com tool calling) e intérprete offline. A chave foi pedida pelo `request_secret` e não chegou; o copiloto roda offline até o José preencher o `.env` |  |
| 12/11 10h45 | Supabase (05b) | Claude Code (Opus 5.5) + MCP do Supabase | Ajuste 14 | A organização está no plano Pro: todo projeto novo é pago. Nada foi criado (conferido no `list_projects`) | Vetou projeto pago; a 05b espera a decisão dele |
| 12/11 10h50 | Formato do painel | Claude Code (Opus 5.5) | `painel/README.md`, pedido da thread do painel | Tickets com Estado, Real e Commits; coluna José no AI-LOG; linha duplicada da RN-09 tirada do §17 do discovery |  |
| 12/11 11h | Fatias 5b, 6a e 6b | Claude Code (Opus 5.5) | Tickets 05b, 06a, 06b | Adapter Supabase só com a stdlib, schema com RLS sem política e teste de contrato que roda o cenário da demo nos dois repositórios (o Supabase espera a chave). Acabamento da tela. `ROADMAP.md`, `docs/mapa-arquitetura.md` com SIPOC por rota, README com roteiro da demo; os números do roteiro conferidos na API | Criou o projeto Supabase numa organização Free |
| 12/11 11h30 | Revisão independente do código (code review) | Claude Code (Opus 5.5, esforço high), subagente sem o contexto da sessão | `git diff 8a7b3d0..HEAD` sem o painel | 1 bloqueante, 7 importantes, 6 menores; ver Revisões. Correções no commit 609794b | |

## Revisões

### Revisão independente dos docs do grill (Opus 5.5, esforço high, só leitura)
A revisão leu os rascunhos das 00h21, antes do mock existir. Parte dos achados já estava resolvida no código quando o resultado chegou, às 10h40.

| # | Achado | O que foi feito |
|---|---|---|
| 1 | O "como hoje" não chega a 250 com 30 a 40 testes por área | Já resolvido: o mock foi calibrado para 125 testes por área (MK-01); os pedidos somam 245 e o plano compartilhado sai do motor (168). A queda em degraus não foi feita |
| 2 | Destrutivo em "carro livre" pode deixar de ser o último do carro (RN-04) | Já atendido: `cabe()` em `backend/domain/motor.py` recusa destrutivo com qualquer alocação depois; destrutivo sem carro vira impactado |
| 3 | A folga de reteste (MK-06) diverge do ajuste 6 | Aberto: vai para o José (`docs/tickets/README.md`, Esperando pelo José) |
| 4 | MK-01 é a premissa mais sensível | Entrou em Riscos e na fala da apresentação |
| 5 | Etiquetas de fonte erradas | Corrigido em `CONTEXT.md` (D2), ADR 0002 e ADR 0005 |
| 6 | Replanejamento não determinístico; falta "Recusar" | Já atendido: colisões em ordem de início e ID; "B sai do plano" declarado no SPEC; `POST /api/proposta/recusar` existe |
| 7 | A agenda não cabe; 04b sem status | 04b feita; 05b depende do José |
| 8 | Semana de fim do "como hoje" indefinida | Já atendido: a maior janela pedida (`backend/domain/folga.py`) |
| 9 | Y% da frase de sucesso fora do PREMISSAS | MK-09: é o resultado medido, −31,4% |
| 10 | Heurística mudou em silêncio | Desvio declarado no ADR 0002 |
| 11 | Piso barato ao lado do plano | Não feito: vai para o roadmap |
| 12 | Teste em andamento na avaria | Declarado no SPEC: fica no carro até o fim |
| 13 | Redação do ADR 0001 sobre a stdlib | Corrigida |

### Revisão independente do código (Opus 5.5, esforço high, só leitura), 12/11 11h30
Cada achado do motor virou primeiro um teste vermelho (`test_rn09_reteste_nao_volta_a_carro_fora_do_pool`, `test_rn06_reteste_que_nao_cabe_fica_em_nao_cabe`, `test_rn08_reteste_destrutivo_aparece_na_proposta`, `test_rn07_avaria_leve_nao_apaga_proposta_pendente`).

| # | Achado | O que foi feito |
|---|---|---|
| 1 | Bloqueante: no roteiro do README, o passo 4 (copiloto) não repetia a proposta do passo 3, porque o passo 3 já tinha aceitado | Roteiro corrigido: recusar no passo 3, aceitar no passo 4. Conferido na API |
| 2 | Reteste voltava para carro fora do pool (RN-09) | Corrigido: carro fora do pool trata o reteste como o destrutivo, em outro carro |
| 3 | Reteste que não cabe sumia depois do aceite (RN-06) | Corrigido: vira "não cabe" no plano novo |
| 4 | Atraso que passa da semana 20 deixa o plano aceito terminando depois do marco, e o Gantt corta a barra | Aberto: decisão do José (Esperando pelo José) |
| 5 | Avaria leve apagava a proposta pendente e criava versão sem o gerente (RN-07) | Corrigido: leve grava no plano atual, sem versão nova e sem tocar na proposta |
| 6 | Falha de destrutivo gastava carro da reserva sem aparecer na proposta | Corrigido: a proposta mostra "Repetir X fora do P1 no P2" |
| 7 | Anthropic recusa `temperature=0` nos modelos novos: "só o `.env`" seria falso | Corrigido: `temperature` só vai para modelos fora da Anthropic. Não testado ao vivo (sem chave) |
| 8 | Teste de contrato do Supabase falharia pela ordem das listas | Corrigido: compara ordenado |
| 9 | Proposta de avaria dizia "o teste não estava no caminho crítico" | Corrigido: a frase some quando o evento não tem teste |
| 10 | Controle da folga volta a 10% ao recarregar a página | Não corrigido: cosmético; o número de carros ao lado está certo |
| 11 | `CONTEXT.md` citava `glossario.json` | Corrigido para `contexto.json` |
| 12 | Linha tirada do §17 do discovery sem subir versão | Mantido: só tirou uma duplicata; registrado acima |
| 13 | Caminho local, nome da organização Supabase e ref do projeto no repo | Aberto: antes de tornar o repo público (Esperando pelo José) |
