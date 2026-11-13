# ADR 0001 · Clean Architecture com injeção por construtor, e onde ficam as ports

status: aprovado pelo José · 12/11/2026 · Decidido por: José

## Contexto
O protótipo é uma fatia fina de uma plataforma. Três peças vão trocar com certeza: a fonte de dados (JSON hoje, Postgres depois), o contexto da empresa (arquivo local hoje, Strattum depois) e o LLM (OpenRouter hoje, Anthropic ou modelo próprio depois). O resto não tem troca prevista.

O discovery (RNF-01, `[H]`) dizia "roda local, sem backend". O prompt de execução e o pedido do José em 12/11 pedem FastAPI e um comando para subir backend e frontend. **A instrução direta do José vence a hipótese do discovery.** Continua tudo local, sem deploy.

## Decisão
**Vocabulário.**
- **Motor:** o código que monta e refaz o plano (`backend/domain/motor.py`). Duas funções: `planejar` (testes + frota → plano) e `replanejar` (plano + imprevisto → proposta). Todas as regras de negócio moram nele. Ele não sabe o que é banco, HTTP ou LLM.
- **Port:** uma interface que o núcleo declara para dizer "eu preciso de alguém que faça isto", sem dizer quem. Ex.: `PlanoRepository` diz "preciso ler testes e guardar versões do plano". Existe para o núcleo não depender do que está fora dele.
- **Adapter:** a peça de fora que cumpre uma port. Ex.: `JsonPlanoRepository` e `SupabasePlanoRepository` cumprem a mesma port; trocar um pelo outro não toca no motor.
- **Injeção de dependência (DI):** quem usa a port não cria o adapter; recebe pronto. Aqui o caso de uso recebe pelo construtor: `Planejamento(repo)`.

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
| `ContextProvider` | De onde o copiloto tira glossário, métricas e regras. Hoje arquivos locais; na arquitetura-alvo, a Strattum. É a port; o "Context Manager" do desenho de arquitetura é o serviço que fica atrás dela (ADR 0004) |
| `InterpretadorDeImprevisto` | Qual LLM traduz texto livre em evento. Hoje LiteLLM → OpenRouter; trocar de modelo é só o `.env` |

O prompt previa uma port `SemanticLayer`. Ela não foi criada: o glossário e as métricas chegam ao copiloto pelo `ContextProvider`, porque os dois trocam juntos (a Strattum serve os dois). Uma port a menos.

**Há injeção de dependência; não há biblioteca de DI.** O projeto é Clean Architecture com DI: todo caso de uso recebe as ports pelo construtor. O que ficou de fora é um pacote como o `dependency-injector`, que monta os objetos por configuração. Com 3 ports, montar à mão cabe em 60 linhas, no `container.py`. Se o número de ports crescer, a biblioteca entra sem tocar em `domain/` nem em `application/`.

**`container.py` é a raiz de composição:** o único arquivo que cria os adapters concretos e os entrega aos casos de uso. Ele lê o `.env` e decide JSON ou Supabase, LLM ou intérprete offline. Fica em `presentation/` porque precisa importar `application/` e `infrastructure/` ao mesmo tempo, e só a camada mais de fora pode importar tudo. Se ficasse em `infrastructure/`, essa camada passaria a conhecer os casos de uso, e a regra "adapter só conhece o domínio" quebraria. Em projeto maior ele costuma virar uma pasta própria (`bootstrap/` ou `main`); a função é a mesma.

**`domain/` usa `dataclass`, não pydantic.** `dataclass` é da biblioteca padrão do Python; pydantic é um pacote externo. Na prática: o núcleo roda e é testado sem instalar nada, e uma troca de versão do pydantic ou do FastAPI não mexe em regra de negócio. O pydantic fica em `presentation/`, validando o que chega pela API.

Um teste (`backend/tests/test_fronteira.py`) falha se `domain/` ou `application/` importarem algo fora da biblioteca padrão e das camadas internas: `domain/` só importa a stdlib; `application/` importa `domain/` e a stdlib; nenhum dos dois importa `infrastructure/` nem `presentation/`.

## Alternativas descartadas
- **Tudo num arquivo FastAPI.** Mais rápido hoje, mas a troca de JSON para Postgres ou de LLM mexeria na regra de negócio.
- **Biblioteca de DI** (dependency-injector). Três ports não pagam a dependência.
- **Só frontend, sem backend** (RNF-01). Perde o Swagger e o lugar natural do motor e do LLM, que não pode ter chave no navegador.

## Consequências
- Ganho: trocar dado, contexto ou LLM mexe só em `infrastructure/` e no `container.py`.
- Perda: mais arquivos do que o protótipo precisaria sozinho. Tudo num arquivo só dispensaria as ports e o `container.py`.
- Por que a perda compensa: a troca já aconteceu uma vez. O Supabase entrou (ticket 05b) com um arquivo novo em `infrastructure/` e um desvio no `container.py`; o motor, os casos de uso e os testes de regra não mudaram. O mesmo vale para o LLM (OpenRouter, Anthropic ou offline, pelo `.env`). Se o software evoluir, cada item do ROADMAP diz qual camada toca, e o teste de fronteira impede que a regra de negócio comece a depender de banco ou de LLM.

## SIPOC
| Fornecedor | Entrada | Processo | Saída | Cliente |
|---|---|---|---|---|
| Coordenação (SPA) | Pedido HTTP | Rota → caso de uso → motor, com ports injetadas | JSON do plano | SPA, Swagger |
