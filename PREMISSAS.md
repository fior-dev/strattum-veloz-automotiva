# PREMISSAS

status: proposto, aguardando revisão do José

Todo número que não veio da cliente está aqui, com o ID que aparece na tela (RF-07).
Fonte: **discovery** (fala ou e-mail da Maira), **José** (premissa aprovada), **suposição** (do FDE, ajustável) ou **IA** (gerado por IA).

| ID | Item | Valor | Justificativa | Fonte |
|---|---|---|---|---|
| — | Frota atual | 250 protótipos | Plano da Veloz | discovery `[T]` |
| — | Horizonte | 20 semanas | Plano da Veloz | discovery `[T]` |
| — | Custo por protótipo | R$ 1 milhão a R$ 1,5 milhão | Fala da Maira | discovery `[T]` |
| RN-01 | Protótipos idênticos | Sem variante | E-mail de 11/11 | discovery `[E]` |
| MK-01 | Testes por área | 125 (625 no total) | **Desvio do discovery**, que dizia 8 a 12. Com testes de 1 a 6 semanas, 8 a 12 testes por área ocupam uns 10 carros por área, longe dos 250. O número de testes foi a única entrada calibrada: com 125 por área, os pedidos somam 245. O §11 diz que o MK é "a calibrar ao gerar os dados" | suposição |
| MK-01b | Duração de um teste | 1 a 6 semanas | Discovery §11 | suposição |
| MK-02 | Testes destrutivos | 10% a 20%, concentrados em Segurança passiva e Mecânica | Discovery §11 | suposição |
| MK-03 | Pedido de cada área | A área planeja só com os próprios carros, numa janela menor que 20 semanas (paralelismo), e soma a gordura. A soma dos 5 pedidos fica perto de 250 | As duas fontes de gordura que a Maira citou: reprovação e paralelismo | suposição |
| MK-03b | Janela que cada área quer | 10 a 14 semanas | Exemplo da Maira: "50 carros por 10 semanas" | suposição |
| MK-05 | Gordura do pedido | 10% a 20% por área | A Maira disse que inventou o número na hora (ajuste 6). Fica como suposição | suposição |
| MK-04 | Reprovação e atraso por clima | 10% e 10% por teste | Discovery §11 | suposição |
| MK-06 | Folga de reteste no plano proposto | 10% dos testes destrutivos, arredondado para cima, ajustável na tela de 0% a 30% | Só o destrutivo que falha precisa de carro novo (RN-08). O não destrutivo repete no mesmo carro. O valor padrão segue a reprovação do MK-04 | suposição |
| MK-07 | Semente do gerador do mock | 42 | Mesmo dado em toda execução (RNF-02) | suposição |
| — | Nomes das 5 áreas | Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Dinâmica veicular, Segurança passiva | A Maira deixou o José nomear | José |
| — | Nomes dos testes | Gerados por script a partir de uma lista por área | Ilustrativos | IA |

Como o mock é gerado: `backend/scripts/gerar_mock.py`. O script roda o motor em cada área sozinha, na janela dela (MK-03b), e soma a gordura (MK-05) para formar o pedido "como hoje". O número de testes é a única coisa calibrada para os pedidos chegarem perto de 250. O plano compartilhado sai do motor, sem ajuste.
