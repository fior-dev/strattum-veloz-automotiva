# ADR 0007 · Caminho crítico pela cadeia do carro, não CPM completo

status: decidido pelo José em 12/11/2026 (a simplificação); detalhes de implementação propostos pelo FDE, aguardando revisão
data: 12/11/2026 · dor: D8 · ticket: 04c

## Contexto
A hipótese que o José validou com a Maira é que o problema é de gestão de projetos e de comunicação entre áreas (discovery §2, recap `[T]`). A tela precisa mostrar o que segura a data de lançamento. A Veloz não tem registro das dependências técnicas entre testes (a Maira não deu a lista de testes, §17 item 4).

## Decisão
- A dependência entre testes é só a sequência no mesmo carro, com o destrutivo por último (RN-04).
- Folga de um teste = semana de fim do plano − semana de fim da cadeia do carro dele. Folga 0 = caminho crítico.
- Folga do projeto = semana do lançamento (20) − semana de fim do plano, com sinal verde, amarelo e vermelho (MK-08).
- O impacto de um evento no marco é a diferença entre o fim do plano novo e o do atual. Pelo RN-05, o atraso troca o teste seguinte de carro em vez de empurrá-lo, então a cadeia sozinha superestimaria o impacto.
- O custo de comprar folga de prazo aparece numa tabela só de leitura: carros pedidos pelo motor para metas de 20, 19, 18 e 17 semanas. Ela não troca o plano em vigor, para não apagar as versões do replanejamento.

## Alternativas descartadas
- **CPM completo com dependências técnicas entre testes** (ex.: o crash só depois da validação dos airbags). É o certo para a v2, mas pede dados que a Veloz não tem. Vai para o roadmap.
- **Folga que soma as lacunas entre testes do carro.** No mock dá o mesmo número (553 críticos) e a regra fica mais difícil de explicar.

## Consequências
- No mock, 553 dos 625 testes saem críticos, e a folga do projeto é 0. Não é defeito: o motor minimiza carros enchendo cada carro até a semana 20. A tela diz isso em uma frase e mostra o preço da folga: +5 carros por semana, aproximadamente.
- Com tanto teste crítico, o destaque no Gantt é discreto (faixa no topo da barra) e a folga de cada teste aparece no hover.
- No cenário da demo, AER-99 está no caminho crítico, e a troca para um carro da folga de reteste segura o lançamento.

## SIPOC
| Fornecedor | Entrada | Processo | Saída | Cliente |
|---|---|---|---|---|
| Motor (plano em vigor) | Alocações por carro | `domain/gestao.py`: folga, marco, uso por semana | `GET /api/gestao` | Coordenação (tela), diretoria |
