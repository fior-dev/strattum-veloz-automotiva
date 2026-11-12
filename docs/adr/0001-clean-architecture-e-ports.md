# ADR 0001 · Clean Architecture com injeção por construtor, e onde ficam as ports

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
O protótipo é uma fatia fina de uma plataforma. Três peças vão trocar com certeza: a fonte de dados (JSON hoje, Postgres depois), o contexto da empresa (arquivo local hoje, Strattum depois) e o LLM (OpenRouter hoje, Anthropic ou modelo próprio depois). O resto não tem troca prevista.

O discovery (RNF-01, `[H]`) dizia "roda local, sem backend". O prompt de execução e o pedido do José em 12/11 pedem FastAPI e um comando para subir backend e frontend. **A instrução direta do José vence a hipótese do discovery.** Continua tudo local, sem deploy.

## Decisão
Quatro camadas, com a dependência apontando para dentro:

| Camada | O que tem | Pode importar |
|---|---|---|
| `domain/` | Entidades, regras (RN-01 a RN-09), o motor e as ports | Só a biblioteca padrão do Python |
| `application/` | Casos de uso; recebem as ports pelo construtor | `domain` |
| `infrastructure/` | Adapters que implementam as ports | `domain`, bibliotecas externas |
| `presentation/` | Rotas FastAPI e `container.py`, o único lugar que conhece os adapters concretos | tudo |

Ports, só onde há troca prevista:

| Port | O que deixa trocar |
|---|---|
| `PlanoRepository` | Onde moram frota, testes, pedidos e versões do plano. Hoje JSON em memória; depois Postgres (Supabase), sem tocar no motor |
| `ContextProvider` | De onde o copiloto tira glossário, métricas e regras. Hoje arquivos locais; na arquitetura-alvo, a Strattum |
| `InterpretadorDeImprevisto` | Qual LLM traduz texto livre em evento. Hoje LiteLLM → OpenRouter; trocar de modelo é só o `.env` |

O prompt previa uma port `SemanticLayer`. Ela não foi criada: o glossário e as métricas chegam ao copiloto pelo `ContextProvider`, porque os dois trocam juntos (a Strattum serve os dois). Uma port a menos.

Sem biblioteca de DI. `domain/` usa `dataclass`, não pydantic.

Um teste (`backend/tests/test_fronteira.py`) falha se `domain/` ou `application/` importarem algo fora da biblioteca padrão ou de `infrastructure/`.

## Alternativas descartadas
- **Tudo num arquivo FastAPI.** Mais rápido hoje, mas a troca de JSON para Postgres ou de LLM mexeria na regra de negócio.
- **Biblioteca de DI** (dependency-injector). Três ports não pagam a dependência.
- **Só frontend, sem backend** (RNF-01). Perde o Swagger e o lugar natural do motor e do LLM, que não pode ter chave no navegador.

## Consequências
- Ganho: trocar dado, contexto ou LLM mexe só em `infrastructure/` e no `container.py`.
- Perda: mais arquivos do que o protótipo precisaria sozinho.

## SIPOC
| Fornecedor | Entrada | Processo | Saída | Cliente |
|---|---|---|---|---|
| Coordenação (SPA) | Pedido HTTP | Rota → caso de uso → motor, com ports injetadas | JSON do plano | SPA, Swagger |
