# PREMISSAS

status: aprovado pelo José · 12/11/2026 · Decidido por: José

Todo número que não veio da cliente está aqui, com o ID que aparece na tela (RF-07).
Fonte: **discovery** (fala ou e-mail da Maira), **José** (premissa aprovada), **suposição** (do FDE, ajustável) ou **IA** (gerado por IA).

| ID | Item | Valor | Justificativa | Fonte |
|---|---|---|---|---|
| — | Frota atual | 250 protótipos | Plano da Veloz | discovery `[T]` |
| — | Horizonte | 20 semanas | Plano da Veloz | discovery `[T]` |
| — | Custo por protótipo | R$ 1 milhão a R$ 1,5 milhão | Fala da Maira | discovery `[T]` |
| RN-01 | Protótipos idênticos | Sem variante | E-mail de 11/11 | discovery `[E]` |
| MK-01 | Testes por área | 125 (625 no total) | A Maira não informou quantos testes cada área roda (discovery §17, item 4). O "8 a 12" era um chute do FDE, escrito na tabela de premissas do mock do discovery (§11), não uma fala da cliente. O chute não fecha a conta: com testes de 1 a 6 semanas, 8 a 12 testes por área ocupam uns 10 carros por área, longe dos 250. O número de testes foi a única entrada calibrada: com 125 por área, os pedidos somam 245. O §11 já dizia que o MK é "a calibrar ao gerar os dados" | suposição |
| MK-01b | Duração de um teste | 1 a 6 semanas | Discovery §11 | suposição |
| MK-02 | Testes destrutivos | 10% a 20%, concentrados em Segurança passiva e Mecânica | Discovery §11 | suposição |
| MK-03 | Pedido de cada área | A área planeja só com os próprios carros, numa janela menor que 20 semanas (paralelismo), e soma a gordura. A soma dos 5 pedidos fica perto de 250 | As duas fontes de gordura que a Maira citou: reprovação e paralelismo | suposição |
| MK-03b | Janela que cada área quer | 10 a 14 semanas | Exemplo da Maira: "50 carros por 10 semanas" | suposição |
| MK-05 | Gordura do pedido | 10% a 20% por área | A Maira disse que inventou o número na hora (ajuste 6). Fica como suposição | suposição |
| MK-04 | Reprovação e atraso por clima | 10% e 10% por teste | Discovery §11 | suposição |
| MK-06 | Folga de reteste no plano proposto | 10% dos testes destrutivos, arredondado para cima, ajustável na tela de 0% a 30% | Só o destrutivo que falha precisa de carro novo (RN-08). O não destrutivo repete no mesmo carro. O valor padrão segue a reprovação do MK-04. O José aceitou manter as duas premissas (gordura no pedido, folga de reteste no plano) em 12/11; o pior caso, com a mesma gordura dos dois lados, está no roteiro de teste | suposição |
| MK-09 | O Y% da frase de sucesso (§3) | Não é meta: é o resultado medido no mock, 245 → 168 carros (77 a menos, −31,4%) | O número sai do motor, não é calibrado (ver MK-01) | suposição |
| MK-08 | Faixas do sinal da folga do projeto | Verde > 2 semanas, amarelo 1 a 2, vermelho ≤ 0 | Sem número da cliente; escolhido para a demo | suposição |
| MK-07 | Semente do gerador do mock | 42 | Mesmo dado em toda execução (RNF-02) | suposição |
| MK-10 | Faturamento que uma semana de atraso no lançamento adia | 1.000 SUVs por semana × R$ 150 mil = R$ 150 milhões; o volume é ajustável na tela | O preço de venda de R$ 150 mil vem do discovery §1 `[T]`. O volume de 1.000 por semana é suposto: a cliente não informou. É faturamento (preço de venda × volume), não margem nem lucro: mede quanto dinheiro deixa de entrar na data, e parte dele pode entrar depois. Serve só para pôr carro e prazo na mesma unidade. O José autorizou supor em 13/11 e pediu o preço de venda como base | `[T]` o preço; o volume é suposição |
| MK-11 | Custo de um protótipo | R$ 1,25 milhão | Meio da faixa que a Maira deu (R$ 1 a 1,5 milhão, discovery §1). O meio é escolha do FDE | `[T]` a faixa; o meio é suposição |
| — | Nomes das 5 áreas | Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Hidráulica, Segurança passiva | A Maira deixou o José nomear | José |
| — | Nomes dos testes | Gerados por script a partir de uma lista por área | Ilustrativos | IA |

**O que vem das áreas no uso real.** A lista de testes de cada área, a duração de cada teste e se ele é destrutivo são dados que a engenharia informa. Aqui eles são supostos só para simular um lançamento e demonstrar o protótipo. O ROADMAP (v2) troca o mock pelo dado real de um lançamento.

**A planilha de hoje, no mock.** A Maira descreveu a planilha de cada área como "N carros por S semanas", sem a lista de testes. O mock tem uma linha dessas por área (o pedido), e o passo 1 da tela mostra a tabela: é o "antes". O "depois" é o plano compartilhado. Planilhas Excel de verdade, uma por área, não foram criadas: o formato real de cada uma é desconhecido.

| Área | Carros pedidos | Semanas | Gordura embutida |
|---|---|---|---|
| Elétrica/Eletrônica | 39 | 13 | 15,6% |
| Mecânica/Powertrain | 52 | 14 | 13,7% |
| Aerodinâmica | 37 | 14 | 18,0% |
| Hidráulica | 35 | 14 | 17,6% |
| Segurança passiva | 82 | 10 | 13,6% |
| **Soma** | **245** | | |

Como o mock é gerado: `backend/scripts/gerar_mock.py`. O script roda o motor em cada área sozinha, na janela dela (MK-03b), e soma a gordura (MK-05) para formar o pedido da área. O número de testes é a única coisa calibrada para os pedidos chegarem perto de 250. O plano compartilhado sai do motor, sem ajuste.
