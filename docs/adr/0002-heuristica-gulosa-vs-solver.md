# ADR 0002 · Heurística gulosa determinística, solver no roadmap

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
A Maira disse que importa pouco se 250 vira 240 ou 150. Importa o processo e se a coordenação entende o plano `[H]`. A coordenação não é técnica. A demo precisa dar o mesmo resultado sempre (RNF-02).

## Decisão
O motor é a heurística gulosa do discovery (RF-02):
1. testes não destrutivos primeiro, do mais longo para o mais curto; depois os destrutivos, também do mais longo (RN-04: o destrutivo é o último do carro);
2. cada teste vai para o protótipo já aberto que o comporta mais cedo; desempate pelo menor ID;
3. só abre protótipo novo se nenhum serve;
4. o que passaria da semana 20 vira "não cabe", com o motivo (RN-06).

Desvio do RF-02: o discovery ordena por duração e põe o destrutivo por último em cada carro. Aqui todos os não destrutivos vão antes de todos os destrutivos. O efeito é o mesmo para a RN-04, e a ordem fica explicável em uma frase.

Interface pequena, muito comportamento atrás: `planejar(testes, frota, horizonte) → plano` e `replanejar(plano, evento) → proposta`.

## Alternativas descartadas
- **Solver de programação inteira (OR-Tools CP-SAT).** Acha o mínimo de verdade, mas o plano não se explica em uma frase, o tempo de resolução varia e é uma dependência a mais. Entra no roadmap atrás da mesma interface.
- **Ferramenta de otimização de mercado** que a Veloz já tem. Uso opcional no case `[T]`, sem acesso.

## Consequências
- Ganho: cada alocação tem um porquê legível ("o carro livre mais cedo"). Determinístico.
- Perda: o número não é ótimo. A distância até o ótimo fica desconhecida até o solver entrar.
