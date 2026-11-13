# CONTEXT · Veloz Automotiva

status: aprovado pelo José · 12/11/2026 · Decidido por: José

Glossário do domínio e dores numeradas. É a fonte do Semantic Layer: `backend/semantic/contexto.json` repete estes termos, e a API e o copiloto leem de lá.
A fonte do negócio é `docs/01-discovery.md` v0.3. Etiquetas de fonte: `[T]` entrevista, `[E]` e-mail da Maira, `[P]` premissa aprovada pelo José, `[H]` hipótese do FDE.

## Dores

| ID | Dor | Fonte | Fatia que ataca |
|---|---|---|---|
| D1 | **Plano no chute.** Cada área pede "N carros por S semanas" num Excel livre, sem dizer que testes vai rodar. A coordenação corta com base em lançamentos anteriores | `[T]` | 2 |
| D2 | **Áreas sem visão única.** Cada área pede carros para si (reservar só para si é a H-1, `[H]`). O repasse de carros entre áreas é feito à mão pela coordenação, sem ver o calendário dos carros | `[T]` | 1, 3 |
| D3 | **Gordura escondida.** A folga contra reprovação e o paralelismo ficam dentro do pedido, com tamanho desconhecido. O que sobra vira sucata de R$ 1 milhão ou mais | `[T]` | 3 |
| D4 | **Replanejamento às cegas.** Atraso por clima ou reprovação chega no e-mail semanal, sem o impacto nos outros testes | `[T]` | 4, 5 |
| D5 | **Sem resultado de teste.** A coordenação não sabe quando um teste falhou ou foi repetido | `[T]` | 4 |
| D6 | **Desgaste parcial invisível.** O carro volta de um teste com avaria e o planejamento não vê | `[E]` | 4b |
| D7 | **Recomeçar a cada modelo.** O processo volta a cada lançamento, e dois projetos disputam as mesmas engenharias | `[T]` | roadmap |
| D8 | **Ninguém vê o que segura a data de lançamento.** O problema central é de gestão de projetos e de troca de informação entre a engenharia e a coordenação (recap validado pela Maira, discovery §2). Sem caminho crítico nem marco, a coordenação não sabe quais atrasos mexem no lançamento | `[T]` recap; a dor formulada é `[H]`, José em 12/11 | 04c |

## Glossário

| Termo | Definição | Fonte |
|---|---|---|
| Protótipo | Carro físico da frota, com ID e estado: disponível, comprometido, destruído. Os protótipos são idênticos | `[E]` |
| Área | Uma das 5 engenharias: Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Hidráulica, Segurança passiva | `[H]` |
| Pedido | O que a área pede hoje, na planilha dela: N carros por S semanas, sem a lista de testes. Só entra no cenário dos pedidos por área (o processo atual) | `[T]` |
| Teste | Trabalho de uma área sobre um protótipo: duração em semanas, destrutivo sim ou não, status | `[T]` |
| Destrutivo | Teste que inutiliza o carro, como o crash. É sempre o último do carro | `[T]` `[P]` |
| Semana | Unidade de tempo do plano, de 1 a 20 | `[T]` |
| Alocação | Um protótipo atribuído a um teste num intervalo de semanas | `[H]` |
| Plano | Conjunto das alocações, com versão e estado (rascunho, aprovado) | `[H]` |
| Evento | Fato que muda o plano: atraso de +N semanas, falha, avaria | `[P]` |
| Sugestão de troca | Proposta do replanejamento: mover o teste B do protótipo P1 para P2. Pendente, aceita ou recusada | `[P]` |
| Impactado | Teste que colidiu e não achou carro livre. Aparece com a área dona | `[P]` |
| Avaria | Desgaste parcial: tipo (vidro, lataria, pneu, outro) e gravidade (leve, compromete reuso) | `[E]` `[P]` |
| Gerente da coordenação | Quem aprova o plano e as trocas (RN-07). No protótipo não há login: o perfil é escolhido no topo da tela, só como simulação (ADR 0005) | `[P]` |
| Folga de reteste | Carros reserva para repetir testes destrutivos que falham. É explícita e ajustável, ao contrário da gordura do pedido | `[H]` |

## Métricas

| Métrica | Definição |
|---|---|
| Frota do plano | Número de protótipos distintos com pelo menos uma alocação |
| Frota proposta | Frota do plano + folga de reteste |
| Frota dos pedidos por área | Soma dos pedidos das 5 áreas no processo atual. O discovery chama este cenário de "como hoje"; no código o campo é `como_hoje` |
| Semana de fim | Maior `semana_fim` entre as alocações |
| Taxa de reuso | Alocações por protótipo |
| Testes sem alocação | Testes que o motor não conseguiu pôr em nenhum carro até a semana 20 (RN-06). Aparecem numa lista, com o motivo. No código o campo é `nao_cabe` |
| Folga de um teste | Fim do plano − fim da cadeia do carro dele (ADR 0007) |
| Caminho crítico | Testes com folga 0 |
| Folga do projeto | Semana do lançamento (20) − fim do plano. Verde acima de 2 semanas, amarelo de 1 a 2, vermelho 0 ou menos (MK-08) |
| Carros-semana parados | Soma, nas 20 semanas, dos carros da frota que não estão em teste nem destruídos |
