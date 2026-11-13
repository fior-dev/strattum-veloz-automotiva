# ADR 0002 · Heurística gulosa determinística, solver no roadmap

status: aprovado pelo José · 12/11/2026 · Decidido por: José

## Contexto
A Maira disse que importa pouco se 250 vira 240 ou 150. Importa o processo e se a coordenação entende o plano `[H]`. A coordenação não é técnica. A demo precisa dar o mesmo resultado sempre (RNF-02).

## Decisão
**Por que "gulosa":** é o nome técnico (em inglês, *greedy*) do algoritmo que, a cada passo, pega a melhor opção daquele momento e nunca volta atrás para rever. É rápido e fácil de explicar; não garante o melhor resultado possível.

O motor é a heurística gulosa do discovery (RF-02):
1. testes não destrutivos primeiro, do mais longo para o mais curto; depois os destrutivos, também do mais longo (RN-04: o destrutivo é o último do carro);
2. cada teste vai para o protótipo já aberto que o comporta mais cedo; desempate pelo menor ID;
3. só abre protótipo novo se nenhum serve;
4. o que passaria da semana 20 fica na lista "testes sem alocação", com o motivo (RN-06).

O que cada passo quer dizer:
- **"Aberto"** é o carro que já tem pelo menos um teste no plano. **"ID"** é o código do carro (P001 a P250).
- **"Comporta mais cedo":** para cada carro aberto, o motor olha o calendário dele e acha a primeira semana em que o teste inteiro cabe sem encostar em outro teste. Ganha o carro em que essa semana é a menor. Se dois carros empatam, ganha o de menor código (P006 antes de P007), só para o resultado ser sempre o mesmo.
- **"Nenhum serve":** nenhum carro aberto tem uma janela livre do tamanho do teste até a semana 20, ou o carro já tem um teste destrutivo marcado (depois dele o carro não existe mais). No plano inicial não há avaria; avaria e destruição entram no replanejamento.
- **Como o motor sabe que um teste é destrutivo:** é um campo do teste (`destrutivo: sim ou não`), informado pela área junto com a duração. No mock ele é sorteado (MK-02).

Desvio do RF-02: o discovery ordena por duração e põe o destrutivo por último em cada carro. Aqui todos os não destrutivos vão antes de todos os destrutivos. O efeito é o mesmo para a RN-04, e a ordem fica explicável em uma frase.

Interface pequena, muito comportamento atrás: `planejar(testes, frota, horizonte) → plano` e `replanejar(plano, evento) → proposta`.

## Alternativas descartadas
- **Solver de programação inteira (OR-Tools CP-SAT).** Um solver é um programa de otimização: recebe as regras como equações e testa combinações até provar qual plano usa o menor número de carros. "Programação inteira" é a família de problemas em que as respostas são números inteiros (um carro ou nenhum). Acha o mínimo de verdade, mas o plano não se explica em uma frase, o tempo de resolução varia e é uma dependência a mais. Entra no roadmap atrás da mesma interface.
- **Ferramenta de otimização de mercado** que a Veloz já tem. Uso opcional no case `[T]`, sem acesso.

## Consequências
- Ganho: cada alocação tem um porquê legível ("o carro livre mais cedo"). Determinístico.
- Perda: o número de carros do plano (161 no mock) não é o ótimo. "Ótimo" é o menor número de carros que cumpre todas as regras até a semana 20.
- Para a regra em uso (destrutivo o quanto antes), só o solver prova qual é o mínimo. O que dá para dizer hoje é um piso: os 625 testes somam 2.139 semanas de carro, e cada carro oferece 20, então são pelo menos 107 carros (2.139 ÷ 20, arredondado para cima). O ótimo está entre 107 e 161. O piso ignora o carro que é destruído cedo, então o ótimo real pode ficar acima de 107.
- **Medido em 12/11 (ticket 10).** Os 54 carros entre o piso e o plano têm uma causa só: o motor roda o teste destrutivo o quanto antes, e o carro sai da frota cedo. São 1.081 carros-semana perdidos; (2.139 + 1.081) ÷ 20 = 161. A variante "destrutivo no fim do carro" (`planejar(..., destrutivo_no_fim=True)`) dá 107 carros no mock, igual ao piso: para essa regra, 107 é o ótimo. O preço é de engenharia, não de conta: o resultado dos 65 testes destrutivos só sai na semana 20, e um que falhe não tem semana para repetir. **Decisão do José em 13/11:** o padrão continua "o quanto antes". O resultado cedo do teste destrutivo vale mais que os 54 carros; a variante fica na simulação da tela, e o gerente da coordenação pode adotá-la.
