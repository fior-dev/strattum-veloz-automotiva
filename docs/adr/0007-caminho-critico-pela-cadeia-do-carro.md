# ADR 0007 · Caminho crítico pela cadeia do carro, não CPM completo

status: decidido pelo José em 12/11/2026 (a simplificação); detalhes de implementação propostos pelo FDE, aguardando revisão
data: 12/11/2026 · dor: D8 · ticket: 04c

## Contexto
A hipótese que o José validou com a Maira é que o problema é de gestão de projetos e de comunicação entre áreas (discovery §2, recap `[T]`). A tela precisa mostrar o que segura a data de lançamento e, principalmente, onde está o gargalo e o que a coordenação precisa decidir para evitar as dores do discovery (complemento do José, 12/11). A Veloz não tem registro das dependências técnicas entre testes (a Maira não deu a lista de testes, §17 item 4).

## Decisão
- A dependência entre testes é só a sequência no mesmo carro, com o destrutivo por último (RN-04).
- Folga de um teste = semana de fim do plano − semana de fim da cadeia do carro dele. Folga 0 = caminho crítico.
- Folga do projeto = semana do lançamento (20) − semana de fim do plano, com sinal verde, amarelo e vermelho (MK-08).
- O impacto de um evento no marco é a diferença entre o fim do plano novo e o do atual. Exemplo: o AER-99 ocupa o carro P006 até a semana 12 e o ELE-01 começa nele na 13. Se o AER-99 atrasa 2 semanas, a conta ingênua empurraria tudo que vem depois no P006 em 2 semanas, e o plano acabaria na 22. Mas a regra RN-05 não empurra: ela tira o ELE-01 do P006 e o põe em outro carro livre nas mesmas semanas. O fim do plano continua na 20. Por isso o impacto é medido comparando o plano novo com o atual, e não somando o atraso na fila do carro.
- O custo de comprar folga de prazo aparece nas opções da meta, na simulação (desde 13/11; antes era uma tabela): carros pedidos pelo motor para metas de 20 a 16 semanas. Só leitura: não troca o plano em vigor, para não apagar as versões do replanejamento.

## Alternativas descartadas
- **CPM completo com dependências técnicas entre testes** (ex.: o crash só depois da validação dos airbags). É o certo para a v2 e mostraria o gargalo real entre áreas, mas pede a lista de quais testes dependem de quais, que a Veloz não tem registrada. Sem esse dado, as dependências seriam inventadas e o gargalo mostrado seria falso. Vai para o roadmap, com o levantamento das dependências como primeiro passo do piloto.
- **Folga que soma as lacunas entre testes do carro.** No mock dá o mesmo número (553 críticos) e a regra fica mais difícil de explicar.

## Consequências
- No mock, 553 dos 625 testes saem críticos, e a folga do projeto é 0. Não é defeito: o motor minimiza carros enchendo cada carro até a semana 20. A tela diz isso em uma frase e mostra o preço da folga: +5 carros por semana, aproximadamente.
- Com tanto teste crítico, marcar 88% das barras não ajuda ninguém a decidir. **Desde 13/11 (ticket 11, pedido do José) a marcação é invertida:** a faixa amarela no topo da barra marca o teste **com** folga (72 de 625), que é a exceção e é onde a coordenação tem margem para absorver um atraso sem trocar de carro. Barra sem faixa é crítica. A folga de cada teste continua no hover. Se o plano em vigor já passa do lançamento, nada é marcado: a folga é medida até o fim do plano, e num plano atrasado ela não é margem para ninguém.
- **Filtro de linhas no Gantt (13/11, ticket 11).** São 168 linhas, e a coordenação decide olhando poucas. O seletor "Mostrar" tem: todos os carros; só os afetados pela proposta (o carro do teste ou da avaria do evento, o de origem e o de destino de cada troca, e os dos testes impactados; a lista vem do backend); só os carros com algum teste com folga. Com proposta pendente, o filtro dos afetados liga sozinho, porque a decisão do gerente é sobre aqueles carros; ao aceitar ou recusar, volta para todos. O que se perde: com o filtro ligado, o resto da frota some da vista; o seletor diz quantos carros estão em cada opção, e "todos" está a um clique.
- O valor para a coordenação não está na marcação, e sim em três respostas que ela não tem hoje: (1) quantos carros o plano compartilhado pede e quanto disso é folga; (2) quanto custa comprar prazo, na simulação (terminar na semana 18 pede +11 carros); (3) diante de um imprevisto, quem é afetado, qual troca resolve e se o lançamento se move. O número de críticos é ele mesmo um achado: o plano de menor frota não tem folga, e escolher a meta é a decisão que a tela põe na mão da coordenação.
- A tela se monta em 5 passos (apresentação guiada), para quem apresenta e para quem vê pela primeira vez: pedidos de hoje, plano compartilhado, conta da frota, marco, imprevisto.
- No cenário da demo, AER-99 está no caminho crítico, e a troca para um carro da folga de reteste segura o lançamento.

## SIPOC
| Fornecedor | Entrada | Processo | Saída | Cliente |
|---|---|---|---|---|
| Motor (plano em vigor) | Alocações por carro | `domain/gestao.py`: folga, marco, uso por semana | `GET /api/gestao` | Coordenação (tela), diretoria |
