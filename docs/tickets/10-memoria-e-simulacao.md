# 10 · Memória de cálculo e simulação

Dor: D3, D8 · Depende de: 09 · Estimativa: 2h · Estado: feito · Pedido do José em 12/11, ao testar a tela pelo roteiro.

O José não conseguia explicar de onde saem os 161 carros, e a tela só deixava mexer na folga de reteste, que não muda o plano.

## O quê
- **Memória de cálculo na tela** (passo 3): 625 testes somam 2.139 carros-semana; ÷ 20 semanas = 107 carros (o piso); os 65 destrutivos tiram o carro da frota cedo e perdem 1.081 carros-semana; (2.139 + 1.081 + 0) ÷ 20 = 161. É o item "piso barato" do ROADMAP.
- **Simulação** (passo 4), só leitura: quantos testes cada área registra (25 a 125), a meta de fim (semana 16 a 20) e quando roda o teste destrutivo. Mostra, lado a lado com o plano em vigor, pedidos por área, carros, piso, reserva, fim, folga do projeto e testes críticos.
- **Adotar a simulação**: o gerente da coordenação refaz o plano com a meta e a regra do destrutivo escolhidas. Nasce a versão N+1; a anterior fica para consulta. Recusado com proposta pendente (RN-07).
- **Destrutivo no fim do carro**: opção nova do motor (`planejar(..., destrutivo_no_fim=True)`). No mock, o plano cai de 161 para 107 carros, igual ao piso. O padrão não mudou: decisão do José, registrada como pendente no ADR 0002.
- Rotas novas: `GET /api/simular` e `POST /api/plano/regerar`. `GET /api/gestao` ganhou o campo `memoria`.

## Aceite
- [x] `uv run pytest`: 66 passam (7 novos em `tests/test_simulacao.py`).
- [x] `npm run build` passa.
- [x] No navegador (Playwright, 1280×720, 0 erros no console): a memória fecha em 161; a simulação com tudo no padrão repete 245, 161 e 7; meta 18 dá 172 carros e 2 semanas de folga; adotar cria a v2 com sinal amarelo; o atraso do AER-99 na v2 continua propondo a troca.
- [x] Revisão independente (Fable 5.2, esforço high) sobre o diff: 2 números errados (a fórmula da reserva depois de um aceite; a origem dos 65 destrutivos no roteiro), 6 achados médios e 13 menores. Corrigidos os 2 graves, os 6 médios e 9 menores. O que a revisão mediu: os números da tabela da simulação conferem no motor; o destrutivo no fim não violou regra em 3.000 instâncias aleatórias.
- [x] Adotar é recusado se o plano em vigor tem carro fora da frota por avaria (RN-09): refazer do zero o devolveria à frota.
- [ ] Teste do José pelo roteiro.

**13/11:** o bloco da memória de cálculo virou uma linha embaixo do número, e o José decidiu manter o destrutivo "o quanto antes" como padrão (ticket 11, ADR 0002).

## Fica para depois
- Adotar um plano novo preservando avarias e testes concluídos (hoje refaz do zero).
- A versão antiga em consulta mistura o texto do guia com os números da versão atual.
- "Vazio" na memória de cálculo conta o carro fora da frota por avaria.
- Em instância aleatória com frota curta, o destrutivo no fim pode usar mais carros (3 em 3.000); no mock, não acontece.
