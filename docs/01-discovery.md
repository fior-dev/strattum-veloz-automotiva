# Discovery · Veloz Automotiva, alocação da frota de protótipos

Versão 0.3, 12/11/2026. A v0.2 foi aprovada pelo José em 12/11. A v0.3 aplica a resposta da Maira por e-mail: os protótipos são idênticos, e existe desgaste parcial. Também aprova a RN-07 e a RN-08 e cria a RN-09 (avarias). Este é o documento de descobertas da entrevista de discovery do case de FDE da Strattum.
O método é o *Fiortech's FDE Playbook*, Fase 1. O documento é a base para escrever o PRD e as specs (SDD). Ele não substitui nenhum dos dois.

**Etiqueta de fonte em cada afirmação:**

| Etiqueta | De onde veio |
|---|---|
| `[T]` | Transcrição da entrevista de 11/11, 11:30, com a Maira Neves no papel da cliente |
| `[N]` | Notas privadas do José na mesma entrevista. `[N-G]` é o resumo do Gemini colado nas notas: é material de IA, não fala da cliente |
| `[E]` | E-mail da Maira ao José, 11/11, à tarde |
| `[P]` | Premissa adotada ou aprovada pelo José para o mock |
| `[H]` | Hipótese ou proposta do FDE, a provar no protótipo ou a confirmar pelo José |

Na v0.3 não há mais item `[A ESCLARECER]`: a Maira e o José responderam todos.

---

## 1. Contexto

- A Veloz Automotiva, uma montadora fictícia, está testando um SUV novo. `[T]`
- Os protótipos são montados quase à mão, fora da linha de produção. Cada um custa de R$ 1 milhão a R$ 1,5 milhão. O carro de série vai custar uns R$ 150 mil. `[T]`
- O plano atual prevê **250 protótipos em 20 semanas** de teste. `[T]`
- Cinco áreas de engenharia usam os protótipos. Alguns testes inutilizam o carro, como o crash test. `[T]`
- **A diretoria quer reduzir a frota sem atrasar o lançamento.** `[T]`
- Quem chama o FDE é a **coordenação de projetos**, que não é área técnica. Ela recebe os pedidos de protótipo das engenharias. `[T]`

## 2. Problema

**Recap validado pela Maira** `[T]`:
- O problema central é de gestão de projetos e de troca de informação entre a engenharia e a coordenação.
- O objetivo é entregar no prazo, com mais eficiência e menos gasto com protótipos.

**Síntese do FDE** `[H]`:
- A alocação da frota é negociada sem dado.
- Cada área pede sem ver as outras.
- A coordenação não recebe que teste roda em qual carro, nem o resultado.
- O resultado é frota em excesso, que vira sucata, ou frota em falta, que estoura as 20 semanas.

## 3. Objetivo e métrica (Playbook, perguntas 1 e 2)

| | |
|---|---|
| Métrica principal | Número de protótipos alocados. `[T]` |
| Métrica secundária | Semana de fim dos testes: reduzir as 20 semanas ajuda, mas pesa menos. `[T]` |
| Meta | Não foi dada. A avaliação do case olha o processo e a solução, não o número exato. `[T]` `[N]` |
| Resultado do projeto | Um plano que olha as 5 áreas ao mesmo tempo, replaneja quando um teste atrasa ou falha, acompanha o projeto e serve para os próximos modelos. `[T]` |

**Frase de sucesso** `[H]`, com o Y declarado como suposição na apresentação:

> Este sistema terá sucesso se reduzir a frota de protótipos em **Y%** (suposto), sem passar das 20 semanas. A medida é o número de protótipos alocados e a semana de fim dos testes. A integração reúne os pedidos das 5 engenharias num plano único, que a coordenação replaneja.

## 4. Usuários

| Ator | O que faz hoje `[T]` | O que ganha com a solução `[H]` |
|---|---|---|
| Coordenação de projetos (usuário principal) | Recebe os Excels, negocia os cortes com base em lançamentos anteriores e manda um e-mail semanal perguntando por atraso | Plano único, conflitos à vista, sugestão de replanejamento |
| Engenharias (5 áreas) | Pedem carros e semanas em Excel livre e controlam os próprios testes | Carro garantido quando o teste falha, sem precisar pedir folga |
| Diretoria | Quer frota menor sem atraso | Número de protótipos e risco de prazo à vista |

As 5 áreas não foram nomeadas: a Maira deixou o José nomear. Os exemplos dela foram elétrica, mecânica e aerodinâmica. `[T]` Para o mock, os nomes são **Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Dinâmica veicular (tração, frenagem) e Segurança passiva (crash)**. `[H]`

## 5. Processo de hoje (as-is) `[T]`

1. **Pedido.** Cada área manda à coordenação um Excel no formato que quiser, só com o total de carros e de semanas. Exemplo da Maira: 50 carros por 10 semanas. O pedido não diz quais testes vão rodar.
2. **Negociação.** A coordenação corta com base em lançamentos anteriores. Exemplo dela: dá 40 carros e 5 semanas a mais, ou repassa 10 que a Elétrica liberar na semana 15.
3. **Execução.** Cada área controla os próprios testes e pode ter um acompanhamento próprio. As áreas não falam entre si.
4. **Acompanhamento.** A coordenação manda um e-mail semanal perguntando se há atraso. Ela não recebe o resultado dos testes e tem pouquíssima visibilidade de quando um teste é repetido. Comparar as áreas é difícil.
5. **Fim.** Historicamente sobram carros. O que sobra vira sucata, porque não pode ser vendido. Faltar carro é o pior caso: um protótipo novo demora e estoura as 20 semanas.

## 6. Filtro de seleção (Playbook)

| Critério | Resposta | Fonte |
|---|---|---|
| Frequente | O acompanhamento é semanal durante 20 semanas, e o problema volta a cada modelo novo | `[T]` |
| Doloroso | Cada carro que sobra é R$ 1 milhão ou mais em sucata. O que falta atrasa o lançamento. O orçamento conta com a receita do lançamento, e as campanhas são presas a eventos marcados com até um ano de antecedência: atraso deixa o carro fora da concessionária, descasa o marketing e perde a venda | `[T]` |
| Mensurável | Ver o §3: há dono e há métrica, mas não há meta | `[T]` |

## 7. Frentes MECE (Playbook, pergunta 3)

| Frente | O que se sabe | Fonte |
|---|---|---|
| Dados | A planilha de cada área é confiável, mas tem formato próprio e uma gordura de tamanho desconhecido. A Maira citou 10 a 20% e disse que inventou o número na hora | `[T]` |
| | **Duas fontes de gordura.** A primeira é a reprovação: o teste pode falhar e precisar ser repetido, às vezes com outro carro. A segunda é o paralelismo: a área pede 2 a 4 carros para rodar testes ao mesmo tempo, porque um teste bloqueia o carro | `[T]` |
| | A coordenação não recebe o registro de teste e de resultado, mas cada área pode ter o seu. Esse registro é uma fonte de dado para o piloto. Os dados do case não existem e serão mockados | `[T]` |
| Fluxo | Pedido em Excel, negociação sem dado e e-mail semanal. As áreas não se veem | `[T]` |
| Sistemas | Não há sistema próprio: só um BI alimentado à mão e uma ferramenta de otimização de mercado, de uso opcional no case | `[T]` |
| Adoção | Ninguém tem apego à planilha `[T]`. O risco está na engenharia: o incentivo dela é pedir folga, e o plano só funciona se ela registrar teste e status `[H]` | |

Escala: com dois lançamentos ao mesmo tempo, o gargalo é a capacidade de teste de cada engenharia, que trabalha em fila. O atraso de um projeto empurra o outro. `[T]`

## 8. Glossário (substantivos) e eventos (verbos)

| Termo | Definição para o sistema |
|---|---|
| **Protótipo** | Um carro físico da frota, com ID e estado (disponível, comprometido, destruído). Os 250 são idênticos `[E]` |
| **Avaria** | Desgaste parcial registrado pela engenharia: tipo (vidro, lataria, pneu, outro) e gravidade (leve, compromete reuso) (RN-09) |
| **Área** | Uma das 5 engenharias, dona dos testes |
| **Pedido** | O que a área pede hoje: N carros por S semanas. É a base do cenário "como hoje" |
| **Teste** | Trabalho de uma área sobre um protótipo. Tem duração em semanas, a marca destrutivo sim/não e um status |
| **Semana** | Unidade de tempo do plano, de 1 a 20 |
| **Alocação** | Um protótipo atribuído a um teste num intervalo de semanas. É a unidade do plano |
| **Plano** | O conjunto das alocações. Tem versão e estado (rascunho, aprovado) |
| **Sugestão de troca** | Proposta do replanejamento: mover o teste B do protótipo P1 para P2. Estado: pendente, aceita ou recusada |

| Evento | Quem dispara | Efeito | Fonte |
|---|---|---|---|
| Pedir teste | Área | Entra um teste na fila | `[T]` |
| Gerar plano | Sistema | Cria as alocações (RF-02) | `[H]` |
| Aprovar plano ou troca | Gerente da coordenação | Plano ou sugestão aprovados | `[P]` |
| Iniciar teste | Área | Status: em andamento | `[H]` |
| Concluir teste | Área | Libera o protótipo (RN-03), ou o destrói, se o teste for destrutivo | `[P]` |
| Atrasar (+1 semana) | Área | Dispara o replanejamento (RN-05) | `[P]` |
| Falhar (repetir) | Área | Dispara o replanejamento (RN-05 e RN-08) | `[P]` |
| Registrar avaria | Área | Avaria leve: só fica visível. Avaria que compromete reuso: o protótipo sai do pool e dispara o replanejamento (RN-09) | `[P]` |

Hoje a tradução entre áreas mora no Excel de formato livre. O sistema troca esse Excel pelo vocabulário acima. `[H]`

## 9. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RN-01 | Os 250 protótipos são idênticos: qualquer protótipo livre serve a qualquer teste. A premissa das 3 variantes caiu em 11/11 | `[E]` |
| RN-02 | Exclusividade no tempo: um protótipo está em no máximo 1 teste por semana | `[P]`; que um teste bloqueia o carro é `[T]` |
| RN-03 | Teste não destrutivo: ao terminar, o protótipo fica disponível para reuso por qualquer área | `[P]`; reaproveitar carro entre testes é `[T]` |
| RN-04 | Teste destrutivo (crash, durabilidade extrema) é sempre o **último** do protótipo e o destrói. Um protótipo tem no máximo 1 teste destrutivo | `[P]`; o crash test como destrutivo é `[T]` |
| RN-05 | Replanejamento. Quando um teste A vira "Atrasado (+1 semana)" ou "Falhou", o sistema recalcula o fim de A. Se o protótipo de A estava prometido a outro teste B que agora colide, o sistema sugere mover B para outro protótipo livre. Se não houver, lista B e a área dele como impactados | `[P]`; a dor de replanejar com chuva ou reprovação é `[T]` |
| RN-06 | O plano não passa da semana 20. O que não cabe aparece como "não cabe", com o motivo | `[T]` |
| RN-07 | A coordenação aprova o plano e as trocas, na figura do gerente dela. O sistema sugere, não decide sozinho | `[P]`, José em 12/11 |
| RN-08 | Repetição. Teste não destrutivo que falha repete inteiro, logo em seguida, no mesmo protótipo. Teste destrutivo que falha repete num protótipo novo ou livre e compatível | `[P]`, aprovada pelo José em 12/11 |
| RN-09 | Avaria. A engenharia registra o desgaste parcial no protótipo, com tipo e gravidade, e é ela quem classifica a gravidade. Avaria **leve** fica visível ao planejamento e não muda o plano. Avaria que **compromete reuso** tira o protótipo do pool. As alocações futuras dele são tratadas como colisão pelo RN-05 | existência do desgaste `[E]`; a regra é `[P]`, José em 12/11 |

**Livre**: um protótipo não destruído nem comprometido, sem alocação nas semanas pedidas e sem destrutivo agendado antes do fim delas.

## 10. Hipóteses e como o protótipo testa (Playbook, perguntas 4 e 5)

| ID | Hipótese | Teste no protótipo, com dado mockado |
|---|---|---|
| H-1 | A frota sobra porque cada área reserva carros dedicados: um por teste em paralelo, mais a folga. Compartilhar os carros entre áreas, respeitando a regra do destrutivo, reduz a frota sem passar da semana 20 | Comparar o "como hoje" (§11, RF-03) com o plano compartilhado: número de protótipos e semana de fim |
| H-2 | A folga contra reprovação pode cair se o replanejamento achar um carro livre na hora | Simular reprovações e atrasos com a taxa do mock (MK-04) e contar quantas o RN-05 resolve sem carro novo |
| H-3 | O gargalo da coordenação é a falta de visibilidade, não a falta de carro | Mostrar a visão por protótipo e semana, com os conflitos. É um julgamento qualitativo da Maira na demo |

## 11. Escopo do protótipo (sexta 13/11)

**Dentro**
- RF-01: Carga do mock: protótipos (ID), pedidos por área e testes (área, duração em semanas, destrutivo).
- RF-02: Geração de um plano que respeita RN-01 a RN-04 e RN-06. O objetivo é, primeiro, o menor número de protótipos e, depois, a menor semana de fim. A heurística é gulosa, nesta ordem:
  1. duração maior primeiro;
  2. destrutivos por último em cada protótipo.

  O teste vai para o protótipo já aberto que o comporta mais cedo, e só abre protótipo novo se nenhum serve. O desempate é pelo menor ID.
- RF-03: Comparação "como hoje" × "plano compartilhado". **Como hoje** é a soma dos pedidos por área, ou seja, carros dedicados, sem reuso entre áreas e já com a gordura (MK-03). A comparação mostra o número de protótipos e a semana de fim dos dois.
- RF-04: Visão do plano por protótipo × semana, com a área e o teste em cada célula.
- RF-05: Mudança de status de um teste: em andamento, atrasado, falhou, concluído.
- RF-06: Replanejamento do RN-05: lista de sugestões de troca ou de impactados, e o aceite pela coordenação, que gera uma nova versão do plano.
- RF-08: Registro de avaria (RN-09) e visão das avarias por protótipo.
- RF-07: Selo "mock" em todo dado suposto, na tela e na apresentação, com o ID da premissa.

**Fora** (vai para o roadmap)
- Integração com o BI e com a ferramenta de otimização de mercado.
- Login e perfis por área.
- Clima e previsão, capacidade de cada engenharia, custo por hora.
- Vários projetos ao mesmo tempo.
- Otimização matemática ótima.

**Não funcionais**
- RNF-01: É só protótipo, sem nada rodando em produção `[T]`. Roda local, sem backend `[H]`.
- RNF-02: A geração do plano é determinística: o mesmo dado sempre dá o mesmo plano, para a demo ser reproduzível.
- RNF-03: Toda suposição é rastreável pelo ID (RN-xx ou MK-xx).

**Premissas do mock** `[H]`, a calibrar ao gerar os dados:

| ID | Premissa |
|---|---|
| MK-01 | De 8 a 12 testes por área, com duração de 1 a 6 semanas |
| MK-02 | De 10% a 20% dos testes são destrutivos, concentrados em Segurança passiva e Mecânica |
| MK-03 | Os pedidos "como hoje" somam 250 carros. Cada área pede 1 carro por teste que roda em paralelo, mais a gordura |
| MK-04 | Taxa de reprovação de 10% e de atraso por clima de 10% por teste |

## 12. Modelo de dados mínimo

O mock do José previa 4 colunas nos Testes e 2 nos Carros `[P]`. A variante caiu com o e-mail da Maira, e as specs precisam de mais:

| Entidade | Campos |
|---|---|
| Prototipo | `id`, `estado` (disponivel, comprometido, destruido) |
| Avaria | `prototipo_id`, `tipo` (vidro, lataria, pneu, outro), `gravidade` (leve, compromete_reuso), `semana`, `area` |
| Pedido | `area`, `carros`, `semanas`: entra só no "como hoje" |
| Teste | `id`, `area`, `duracao_semanas`, `destrutivo` (bool), `status` (planejado, em_andamento, atrasado, falhou, concluido) |
| Alocacao | `prototipo_id`, `teste_id`, `semana_inicio`, `semana_fim`, `plano_versao` |
| Plano | `versao`, `estado` (rascunho, aprovado), `criado_em` |
| SugestaoTroca | `teste_id`, `de_prototipo`, `para_prototipo` (vazio quando só há impacto), `estado` (pendente, aceita, recusada) |

## 13. Critérios de aceite (base das specs)

**Regras**
- **RN-01.** Qualquer protótipo livre pode receber qualquer teste.
- **RN-02.** Com P1 alocado ao teste A nas semanas 3 a 5, uma alocação de P1 a outro teste na semana 4 é recusada.
- **RN-03.** Com o teste não destrutivo A concluído em P1 na semana 6, o plano aloca a P1 um teste de outra área a partir da semana 7.
- **RN-04.** Com P1 tendo um destrutivo nas semanas 8 a 9:
  - qualquer alocação de P1 depois da semana 9 é recusada;
  - um segundo destrutivo em P1 é recusado;
  - um não destrutivo em P1 só entra até a semana 7.
- **RN-05, com troca.** O teste A está em P1 até a semana 5, e o teste B está prometido a P1 na semana 6. Quando A vira "Atrasado (+1 semana)" e P2 está livre, aparece a sugestão "mover B de P1 para P2".
- **RN-05, sem troca.** No mesmo cenário, sem protótipo livre, B e a área dele aparecem como impactados.
- **RN-05, sem colisão.** Se B só começa na semana 8, o atraso de A não gera sugestão.
- **RN-06.** Um teste que só caberia depois da semana 20 aparece como "não cabe", com o motivo, e não gera alocação.
- **RN-08.** Um teste não destrutivo que falha ganha uma nova alocação, com a mesma duração, no mesmo protótipo, logo depois da original, e o RN-05 trata a colisão. Um destrutivo que falha ganha a alocação num protótipo livre.
- **RN-09.** Avaria leve em P1: o plano não muda, e a avaria aparece na visão de P1. Avaria que compromete reuso em P1 na semana 6: P1 não recebe alocação nova, e cada teste prometido a P1 depois da semana 6 gera sugestão de troca ou aparece como impactado.

**Requisitos**
- **RF-01.** Um mock com campo faltando ou com duração inválida é recusado, com o item do erro.
- **RF-08.** Registrar uma avaria a mostra na visão do protótipo. Se a gravidade for "compromete reuso", o RN-09 dispara na mesma ação.
- **RF-02.** Rodar duas vezes com o mesmo CSV dá o mesmo plano, alocação por alocação. Nenhuma alocação viola RN-01 a RN-04 nem RN-06.
- **RF-03.** A tela mostra os dois números de protótipos e as duas semanas de fim. O "como hoje" é igual à soma dos pedidos.
- **RF-04.** Cada célula ocupada mostra a área e o ID do teste. A célula de protótipo destruído aparece marcada.
- **RF-05.** Mudar o status para atrasado ou falhou dispara o RN-05 na mesma ação.
- **RF-06.** Aceitar uma sugestão cria a versão N+1 do plano, e a versão N continua consultável.
- **RF-07.** Todo número que vem do mock aparece com o selo e o ID MK-xx ou RN-xx.

## 14. Cenário da demo ("momento uau")

1. O "como hoje", com os pedidos somados por área, contra o plano compartilhado: a frota cai de N para M, com os números do mock.
2. Ao vivo: o teste de aerodinâmica é marcado "Atrasado (+1 semana)", porque precisava de chuva. `[T]`
3. O sistema mostra que o protótipo estava prometido a um teste da Dinâmica veicular e sugere outro carro livre.
4. A coordenação aceita, e o plano ganha a versão 2.

## 15. Roadmap `[H]`

| Fase | O que entra | Quando |
|---|---|---|
| 0 · Protótipo (este case) | RF-01 a RF-07, dado mockado | 13/11 |
| 1 · Piloto com 1 projeto | Dados reais das 5 áreas, começando pelo registro que cada área já tem. A engenharia registra o status. A régua é frota e prazo do piloto contra o histórico | depois |
| 2 · Plano vivo | Capacidade por engenharia, clima, custo por hora e aprovação por papel | depois |
| 3 · Portfólio | Vários lançamentos ao mesmo tempo e reaproveitamento entre modelos. IA lê os Excels livres antigos e sugere premissas | depois |

## 16. Riscos

| Risco | Mitigação |
|---|---|
| A engenharia não registra o status, e o plano fica cego | O ganho dela precisa ser visível: carro garantido na reprovação sem pedir folga. Na demo, o RN-05 mostra isso |
| A resposta da Maira muda as premissas `[P]` | As regras estão isoladas no §9. Trocar a regra de destrutivo ou de avaria muda o código das regras e os testes, não a interface |
| A demo com números do mock parece prometer redução real | Declarar o Y e o mock na abertura (RF-07) |

## 17. Em aberto

| # | Pergunta | Afeta | Situação |
|---|---|---|---|
| 1 | Quem aprova a alocação dos veículos? | RN-07 | Resolvida em 12/11: o gerente da coordenação (José) |
| 2 | As variantes valem? Há outra restrição entre testes? | RN-01, RN-09 | Resolvida em 11/11 `[E]`: os carros são idênticos, e existe desgaste parcial invisível ao planejamento |
| 3 | O teste que falha repete no mesmo carro ou num novo? | RN-08 | Resolvida em 12/11: aprovada como está (José) |
| RN-09 | Avaria. A engenharia registra o desgaste parcial no protótipo, com tipo e gravidade, e é ela quem classifica a gravidade. Avaria **leve** fica visível ao planejamento e não muda o plano. Avaria que **compromete reuso** tira o protótipo do pool. As alocações futuras dele são tratadas como colisão pelo RN-05 | existência do desgaste `[E]`; a regra é `[P]`, José em 12/11 |
| 4 | Lista e quantidade de testes por área | mock | A Maira disse que não daria `[T]`. Fica no MK-01 |

## 18. Rastreabilidade: daqui para o PRD e para as specs

| PRD | Vem da seção |
|---|---|
| Problema e contexto | 1, 2, 5 |
| Objetivo, métricas, frase de sucesso | 3 |
| Personas | 4 |
| Requisitos funcionais e não funcionais, fora de escopo | 11 |
| Riscos e premissas | 9, 11 (MK), 16, 17 |
| Roadmap | 15 |

| Spec (SDD) | Vem da seção |
|---|---|
| Modelo de domínio e glossário | 8, 12 |
| Regras e invariantes | 9 |
| Critérios de aceite e testes | 13 |
| Cenário de ponta a ponta | 14 |
