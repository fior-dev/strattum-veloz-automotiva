# 11 · Ajustes do teste do José na tela

Dor: D3, D4, D8 · Depende de: 10 · Estimativa: 2h · Estado: feito, esperando o teste do José · Pedido do José em 13/11, ao testar a tela pelo roteiro (wireframes 1 a 5 e gráfico opção A aprovados).

## O quê
- **Conta dos 161 em uma linha.** O bloco "De onde saem os 161 carros" saiu: ocupava espaço demais. A conta virou um texto pequeno embaixo de "161 no plano + 7 de folga de reteste".
- **O marco dentro da simulação.** O bloco "O que segura a data de lançamento" virou um quadro pequeno no topo de "Simule antes de decidir": sinal, folga do projeto e testes sem folga. A tabela meta × carros virou o texto de cada opção da meta ("semana 18: 2 semanas de folga, 172 carros no plano").
- **Dinheiro na simulação.** Duas linhas novas na tabela: custo da frota e atraso que a folga absorve. Uma frase resume a troca ("11 carros a mais custam R$ 13,75 mi; 2 semanas de folga a mais absorvem até R$ 40 mi de atraso"). O custo do carro é o meio da faixa do discovery (MK-11); o custo da semana de atraso é suposição (MK-10), e a pessoa pode trocar na tela.
- **Gantt: filtro e marcação invertida** (racional no ADR 0007). O seletor "Mostrar" tem três opções: todos os carros, só os afetados pela proposta, só os que têm teste com folga. Com proposta pendente, o filtro dos afetados liga sozinho. A faixa amarela no topo da barra passou a marcar o teste **com** folga (72 de 625), não o crítico (553).
- **Prévia da troca no Gantt** (ideia 1): com proposta pendente, o teste aparece tracejado no carro de destino e esmaecido no de origem.
- **O passo mostra o bloco novo** (ideia 2): ao avançar, a tela rola até o bloco que apareceu, e ele pisca uma vez.
- **"Abrir teste" acha a barra** (ideia 3): a linha do carro fica amarela, a barra ganha contorno e o Gantt rola até ela.
- **Confirmação** (ideia 4): depois de "Começou", "Terminou" ou avaria leve, uma mensagem diz o que foi registrado.
- **Gráfico de uso, opção A:** dois gráficos empilhados, na mesma escala, cada um com o total de carros-semana parados ao lado (1.716 e 140).
- `GET /api/gestao` ganhou `custos`, `custo_frota` e `carros_com_folga`; a simulação devolve `custo_frota`; a proposta devolve `carros` (os que ela toca, com o do evento).

## Decisões
- **Filtro × prévia.** O José pediu que, em conflito, o filtro vencesse. Não há conflito: o filtro dos afetados inclui o carro de origem e o de destino, então a prévia aparece inteira em duas linhas.
- **A conta com o custo digitado é feita na tela.** É a única conta de negócio fora do backend: semanas de folga × o valor que a pessoa digita. Levar o valor à rota quebraria o cache de 350 combinações da simulação (ticket 10). Custo da frota, carros afetados e carros com folga vêm do backend. A tela ainda faz diferenças e percentuais de exibição entre dois números do backend (ex.: 179 − 168 carros).
- **Plano que já passou do marco** (depois do roteiro 5f): a faixa de folga some e o filtro "com folga" fica desabilitado. A folga é medida até o fim do plano; num plano atrasado ela marcaria 621 de 625 barras.
- **Abas: não entraram.** Os 5 passos já são a navegação, e aba esconderia o Gantt ao lado da proposta. Fica como opção para a v2, com wireframe antes.

## Aceite
- [x] `uv run pytest`: 67 passam (1 novo: carros da proposta, marcação de folga, curva até a semana 16).
- [x] `npm run build` passa.
- [x] No navegador (Playwright, 1280×720 e 390 de largura, 0 erros no console): a conta dos 161 aparece embaixo do número; meta 18 mostra R$ 223,75 mi de frota e R$ 40 mi de atraso absorvido; AER-99 +2 liga o filtro e deixa 2 linhas (P006 e P162) com a prévia do ELE-01; recusar volta para todos os carros; avaria leve mostra a confirmação; sem rolagem horizontal em 390.
- [x] Revisão independente (Fable 5.2, esforço high) sobre o diff: 3 graves (Gantt vazio em proposta sem troca; marcação de folga em plano atrasado; "+N carros" errado com menos testes, na meta 16 e depois de adotar), 6 médios e 9 menores. Corrigidos os 3 graves, os 6 médios e 7 menores. Conferido no motor pela revisão: 72 testes e 65 carros com folga, a conta dos 161, os valores em dinheiro e os 34% do roteiro.

## Fica para depois
- Leitor de tela: o sinal do marco ganhou texto, mas a faixa de folga na barra é só cor mais dica no hover.
- A barra esmaecida da prévia tem contraste baixo.
- [ ] Teste do José pelo roteiro.
