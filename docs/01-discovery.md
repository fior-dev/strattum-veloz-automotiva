# Discovery · Veloz Automotiva, alocação da frota de protótipos

Versão 0.1, 11/11/2026. Este é o documento de descobertas da entrevista de discovery do case de FDE da Strattum.
O método é o *Fiortech's FDE Playbook*, Fase 1. Ele é a base para escrever o PRD e as specs (SDD). Ele não substitui nenhum dos dois.

**Etiqueta de fonte em cada afirmação:**

| Etiqueta | De onde veio |
|---|---|
| `[T]` | Transcrição da entrevista de 11/11, 11:30, com a Maira Neves no papel da cliente |
| `[N]` | Notas privadas do José na mesma entrevista |
| `[P]` | Premissa adotada pelo José em 11/11 para o mock. Vale até a Maira responder o e-mail de 11/11, 15:37; a resposta dela substitui a premissa |
| `[H]` | Hipótese ou proposta do FDE, a provar no protótipo |

`[A ESCLARECER]` marca o que depende da resposta da Maira.

---

## 1. Contexto

- A Veloz Automotiva, uma montadora fictícia, está testando um SUV novo. `[T]`
- Os protótipos são montados quase à mão, fora da linha de produção. Cada um custa de R$ 1 milhão a R$ 1,5 milhão. O carro de série vai custar uns R$ 150 mil. `[T]`
- O plano atual prevê **250 protótipos em 20 semanas** de teste. `[T]`
- Cinco áreas de engenharia usam os protótipos. Alguns testes inutilizam o carro, como o crash test. `[T]`
- **A diretoria quer reduzir a frota sem atrasar o lançamento.** `[T]`
- Quem chama o FDE é a **coordenação de projetos**, que não é área técnica. Ela recebe os pedidos de protótipo das engenharias e aloca a frota. `[T]`

## 2. Problema

A alocação da frota é negociada sem dado. Cada área pede sem ver as outras. A coordenação não sabe que teste roda em qual carro, nem o resultado de cada teste. O resultado é frota em excesso, que vira sucata, ou frota em falta, que estoura as 20 semanas. `[T]` Esta frase de problema é a do recap que a Maira validou na entrevista. `[T]`

## 3. Objetivo e métrica (Playbook, perguntas 1 e 2)

| | |
|---|---|
| Métrica principal | Número de protótipos alocados, porque cada um custa R$ 1 milhão ou mais. `[T]` |
| Métrica secundária | Semana de fim dos testes: reduzir as 20 semanas ajuda, mas pesa menos. `[T]` |
| Meta | Não foi dada. A avaliação do case olha o processo e a solução, não o número exato. `[N]` `[T]` |
| Resultado do projeto | Um plano único da frota, que olha as 5 áreas ao mesmo tempo, replaneja quando um teste atrasa ou falha e serve para os próximos modelos. `[T]` |

**Frase de sucesso** `[H]`, com o Y declarado como suposição na apresentação:

> Este sistema terá sucesso se reduzir a frota de protótipos em **Y%** (suposto), sem passar das 20 semanas. A medida é o número de protótipos alocados e a semana de fim dos testes. A integração reúne os pedidos das 5 engenharias num plano único, que a coordenação replaneja.

## 4. Usuários

| Ator | O que faz hoje | O que ganha com a solução | Fonte |
|---|---|---|---|
| Coordenação de projetos (usuário principal) | Consolida as planilhas, negocia os cortes, cobra status por e-mail e replaneja às cegas | Plano único, visão de conflitos e replanejamento sugerido | `[T]` |
| Engenharias (5 áreas) | Pedem carros e semanas em Excel livre e controlam os próprios testes | Carro garantido quando o teste falha, sem precisar pedir folga; o ganho em si é `[H]` | `[T]` |
| Diretoria | Quer frota menor sem atraso | Número de protótipos e risco de prazo à vista | `[T]` |

As 5 áreas não foram nomeadas: a Maira deixou o José nomear. Os exemplos dela foram elétrica, mecânica e aerodinâmica. `[T]` Para o mock: **Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Dinâmica veicular (tração, frenagem) e Segurança passiva (crash).** `[P]`

## 5. Processo de hoje (as-is)

1. **Pedido.** Cada área manda à coordenação um Excel no formato que quiser, só com o total de carros e de semanas. Exemplo da Maira: 50 carros por 10 semanas. O pedido não diz quais testes vai rodar. `[T]`
2. **Negociação.** A coordenação corta no chute, com base em lançamentos anteriores. Exemplo da Maira: dá 40 carros e 5 semanas a mais, ou repassa 10 que a Elétrica liberar na semana 15. `[T]`
3. **Execução.** Cada área controla os próprios testes, sem falar com as outras. `[T]`
4. **Acompanhamento.** Um e-mail semanal pergunta se há atraso. Não há registro do resultado de cada teste. `[T]`
5. **Fim.** Historicamente sobram carros, e o que sobra vira sucata, porque não pode ser vendido. Faltar carro é o pior caso: um protótipo novo demora e estoura as 20 semanas. `[T]`

**Onde a coordenação gasta mais braço:** consolidar planilhas sem padrão, negociar cortes sem dado, cobrar status e replanejar quando um teste falha ou atrasa por clima. `[T]`

## 6. Filtro de seleção (Playbook)

| Critério | Resposta | Fonte |
|---|---|---|
| Frequente | O acompanhamento é semanal durante 20 semanas, e o problema volta a cada modelo novo | `[T]` |
| Doloroso | Cada carro que sobra é R$ 1 milhão ou mais em sucata, e o que falta atrasa o lançamento, o marketing e a venda | `[T]` |
| Mensurável | Há dono (a coordenação) e há métrica (o número de protótipos), mas não há meta | `[T]` |

## 7. Frentes MECE (Playbook, pergunta 3)

| Frente | O que se sabe | Fonte |
|---|---|---|
| Dados | A planilha de cada área é confiável, mas tem formato próprio e uma gordura de tamanho desconhecido. A Maira citou 10 a 20% e disse que inventou o número na hora. Não há registro de teste, de resultado nem de repetição. Os dados do case não existem e serão mockados | `[T]` |
| Fluxo | Pedido em Excel, negociação no chute, e-mail semanal. As áreas não se veem | `[T]` |
| Sistemas | Não há sistema próprio: só um BI alimentado à mão e uma ferramenta de otimização de mercado, de uso opcional no case | `[T]` |
| Adoção | O risco está na engenharia. O incentivo dela é pedir folga, e o plano só funciona se ela registrar teste e status. Ninguém tem apego à planilha | `[T]` sobre o apego; o risco é `[H]` |

Impacto na ponta: o orçamento conta com a receita do lançamento, e as campanhas são presas a eventos marcados com até um ano de antecedência. Atraso = carro fora da concessionária, marketing descasado, venda perdida. `[T]`

Escala: com dois lançamentos ao mesmo tempo, o gargalo é a capacidade de teste de cada engenharia, que trabalha em fila. O atraso de um projeto empurra o outro. `[T]`

## 8. Glossário (substantivos) e eventos (verbos)

| Termo | Definição para o sistema |
|---|---|
| **Protótipo** | Um carro físico da frota, com ID e variante |
| **Variante** | Configuração do protótipo: Base, Intermediária ou Topo (RN-01) |
| **Área** | Uma das 5 engenharias, dona dos testes |
| **Teste** | Trabalho de uma área sobre um protótipo, com variante exigida, duração em semanas e a marca destrutivo sim/não |
| **Semana** | Unidade de tempo do plano, de 1 a 20 |
| **Alocação** | Um protótipo atribuído a um teste num intervalo de semanas. É a unidade do plano |
| **Plano** | O conjunto das alocações. Tem versão a cada replanejamento |

| Evento | Quem dispara | Efeito |
|---|---|---|
| Pedir teste | Área | Entra um teste na fila do plano |
| Alocar | Sistema, com aprovação da coordenação | Cria alocações |
| Concluir teste | Área | Libera o protótipo para reuso (RN-03), ou o encerra, se o teste for destrutivo |
| Atrasar (+1 semana) | Área | Dispara o replanejamento (RN-05) |
| Falhar (repetir) | Área | Dispara o replanejamento (RN-05) |
| Sucatear | Coordenação | Fim de vida do protótipo |

Hoje a tradução entre áreas mora no Excel de formato livre. O sistema troca esse Excel pelo vocabulário acima. `[H]`

## 9. Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RN-01 | A frota tem 3 variantes: **Base** (ex.: 1.0 Turbo), **Intermediária** (ex.: 1.4 Híbrido) e **Topo** (ex.: 2.0 4x4 com ADAS e sensores). Cada teste exige uma variante ou aceita **Qualquer**. Exemplo: tração 4x4 exige Topo; aerodinâmica externa aceita Qualquer | `[P]` `[A ESCLARECER]` |
| RN-02 | Exclusividade no tempo: um protótipo está em no máximo 1 teste por semana | `[P]` |
| RN-03 | Teste não destrutivo: ao terminar, o protótipo volta a "disponível para reuso" e pode ir para outra área | `[P]`; reaproveitar carro entre testes é `[T]` |
| RN-04 | Teste destrutivo (crash, durabilidade extrema) é sempre o **último** da sequência do protótipo e encerra a vida dele | `[P]`; o crash test como destrutivo é `[T]` |
| RN-05 | Replanejamento: quando um teste vira "Atrasado (+1 semana)" ou "Falhou (repetir)", o sistema verifica se o protótipo estava prometido a outra área nas semanas seguintes. Se estava, sugere trocar por outro protótipo livre da mesma variante. Se não houver protótipo livre, avisa quem é impactado | `[P]`; a dor de replanejar com chuva ou reprovação é `[T]` |
| RN-06 | O plano não passa da semana 20 | `[T]` |
| RN-07 | A coordenação aprova o plano e as trocas sugeridas; o sistema sugere, não decide sozinho | `[H]` `[A ESCLARECER]`: quem aprova a alocação não foi perguntado |

A primeira versão das premissas, no resumo do Gemini, tinha três níveis: leve, desgaste e destrutivo. O José simplificou para dois (destrutivo sim/não) em 11/11. Valem RN-03 e RN-04. `[P]`

## 10. Hipóteses e como o protótipo testa (Playbook, perguntas 4 e 5)

| ID | Hipótese | Teste no protótipo, com dado mockado |
|---|---|---|
| H-1 | Parte da frota sobra porque cada área pede para si. Somar os pedidos e compartilhar os carros reduz a frota sem passar da semana 20 | Plano "como hoje" (soma dos pedidos por área) contra o plano compartilhado (RN-01 a RN-04): número de protótipos e semana de fim |
| H-2 | A folga que a engenharia pede existe para cobrir reprovação. Um replanejamento rápido cobre esse risco com menos folga | Simular reprovações e atrasos e medir quantas trocas o RN-05 resolve sem carro novo |
| H-3 | O gargalo da coordenação é a falta de visibilidade, não a falta de carro | Mostrar a visão por protótipo e por semana e os conflitos; julgamento qualitativo da Maira na demo |

## 11. Escopo do protótipo (sexta 13/11)

**Dentro**
- RF-01: Cadastro (ou carga de CSV mockado) de protótipos (ID, variante) e testes (área, variante exigida, duração em semanas, destrutivo).
- RF-02: Geração de um plano que respeita RN-01 a RN-04 e RN-06.
- RF-03: Comparação "como hoje" × "plano compartilhado": número de protótipos e semana de fim.
- RF-04: Visão do plano por protótipo × semana, com a área de cada célula.
- RF-05: Mudança de status de um teste (atrasado, falhou, concluído).
- RF-06: Replanejamento do RN-05: lista de trocas sugeridas ou de áreas impactadas, com aceite pela coordenação.
- RF-07: Indicação clara, na tela e na apresentação, do que é dado mockado e premissa.

**Fora** (vai para o roadmap)
- Integração com o BI e com a ferramenta de otimização de mercado.
- Login e perfis por área.
- Clima e previsão, capacidade de cada engenharia e custo por hora.
- Vários projetos ao mesmo tempo.
- Otimização matemática ótima. O protótipo usa uma heurística gulosa explicável.

**Não funcionais**
- RNF-01: Roda local, sem backend em produção. É só protótipo. `[T]`
- RNF-02: A geração do plano é determinística, com o mesmo dado e o mesmo plano, para a demo ser reproduzível.
- RNF-03: Tudo o que é suposto é rastreável: cada premissa tem o ID desta página.

## 12. Modelo de dados mínimo

O mock pede 4 colunas nos Testes e 2 nos Carros `[P]`. Para o RN-05 funcionar, ele precisa de mais duas coisas:

| Entidade | Campos |
|---|---|
| Prototipo | `id`, `variante` (Base, Intermediaria, Topo) |
| Teste | `id`, `area`, `variante_exigida` (Base, Intermediaria, Topo ou Qualquer), `duracao_semanas`, `destrutivo` (bool), **`status`** (planejado, em_andamento, atrasado, falhou, concluido) |
| **Alocacao** | `prototipo_id`, `teste_id`, `semana_inicio`, `semana_fim`, `versao_plano` |

O que se acrescenta ao mock, e por quê: `status` é o gatilho do RN-05. A `Alocacao` é o que permite saber que um carro "estava prometido" a outra área.

## 13. Critérios de aceite (base das specs)

- **RN-02.** Dado um protótipo alocado a um teste nas semanas 3 a 5, quando outro teste tentar usar o mesmo protótipo na semana 4, o plano recusa a alocação.
- **RN-01.** Dado um teste que exige a variante Topo, quando o plano alocar um protótipo, ele só escolhe protótipos Topo. Dado um teste com "Qualquer", ele aceita as três variantes.
- **RN-04.** Dado um protótipo com um teste destrutivo alocado, quando outro teste pedir esse protótipo depois do destrutivo, o plano recusa. Um teste não destrutivo só entra antes do destrutivo.
- **RN-03.** Dado um teste não destrutivo concluído na semana 6, quando outra área pedir um carro da mesma variante a partir da semana 7, o plano pode reusar esse protótipo.
- **RN-05, troca possível.** Dado o teste A no protótipo P1, prometido ao teste B na semana seguinte, quando A virar "Atrasado (+1 semana)" e houver um protótipo P2 livre da mesma variante, o sistema sugere mover B para P2.
- **RN-05, sem troca.** No mesmo cenário, sem protótipo livre da variante, o sistema lista B e a área dona de B como impactados.
- **RN-06.** Nenhuma alocação termina depois da semana 20; o que não cabe é sinalizado.

## 14. Cenário da demo ("momento uau")

1. O plano "como hoje", com os pedidos somados por área, contra o plano compartilhado: a frota cai de N para M (números do mock).
2. Ao vivo: o teste de aerodinâmica é marcado "Atrasado (+1 semana)", porque precisava de chuva. `[T]`
3. O sistema mostra que o protótipo estava prometido à Dinâmica veicular e sugere trocar por outro livre da mesma variante.
4. A coordenação aceita, e o plano ganha a versão 2.

## 15. Roadmap

| Fase | O que entra | Quando |
|---|---|---|
| 0 · Protótipo (este case) | RF-01 a RF-07, dado mockado | 13/11 |
| 1 · Piloto com 1 projeto | Dado real das 5 áreas e registro de status pela engenharia; régua: frota e prazo do piloto contra o histórico | `[H]` |
| 2 · Plano vivo | Capacidade por engenharia, clima, custo por hora e aprovação por papel | `[H]` |
| 3 · Portfólio | Vários lançamentos ao mesmo tempo e reaproveitamento entre modelos; IA para ler os Excels livres de pedidos antigos e sugerir premissas | `[H]` |

## 16. Riscos

| Risco | Mitigação |
|---|---|
| A engenharia não registra o status, e o plano fica cego | O ganho dela precisa ser visível: carro garantido na reprovação sem pedir folga. Na demo, o RN-05 mostra isso |
| As premissas `[P]` não batem com a resposta da Maira | As regras ficam isoladas na seção 9; trocar uma regra não muda o modelo de dados |
| A demo com números do mock parece prometer redução real | Declarar o Y e o mock na abertura (RF-07) |

## 17. Em aberto

| # | Pergunta | Afeta | Situação |
|---|---|---|---|
| 1 | Quem aprova a alocação dos veículos? | RN-07 | `[A ESCLARECER]`, e-mail à Maira em 11/11, 15:37 |
| 2 | As variantes e a regra destrutivo/não destrutivo valem? | RN-01, RN-03, RN-04 | `[A ESCLARECER]`, mesmo e-mail |
| 3 | Lista e quantidade de testes por área | mock | A Maira disse que não daria. Fica no mock `[T]` |

## 18. Rastreabilidade: daqui para o PRD e para as specs

| PRD | Vem da seção |
|---|---|
| Problema e contexto | 1, 2, 5 |
| Objetivo, métricas, frase de sucesso | 3 |
| Personas | 4 |
| Requisitos funcionais e não funcionais | 11 |
| Fora de escopo | 11 |
| Riscos e premissas | 9, 16, 17 |
| Roadmap | 15 |

| Spec (SDD) | Vem da seção |
|---|---|
| Modelo de domínio e glossário | 8, 12 |
| Regras e invariantes | 9 |
| Critérios de aceite e testes | 13 |
| Cenário de ponta a ponta | 14 |
