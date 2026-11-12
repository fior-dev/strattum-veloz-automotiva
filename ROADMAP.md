# Roadmap · do protótipo ao produto

status: proposto, aguardando revisão do José · 12/11/2026

Cada etapa diz o valor para a Veloz, o risco que ela tira e como validar com a coordenação antes de seguir. Cada item diz qual camada ou adapter toca (ADR 0001). O motor (`domain/`) só muda onde está escrito.

## Protótipo (hoje, 13/11)

O que existe: plano compartilhado com folga à vista, Gantt, replanejamento com aceite do gerente, avarias, caminho crítico e marco, copiloto de texto livre. Dados mockados (PREMISSAS.md), local, sem login.

**Validar na apresentação:** a coordenação entende o plano sem ajuda? A regra de troca do RN-05 é a que ela usaria? O número de testes críticos (88%) é a conversa certa: o plano troca folga de prazo por carros?

## v2 · piloto com dado real (4 a 6 semanas)

**Valor:** o número deixa de ser suposição. A Veloz vê a redução com os testes reais de um lançamento.
**Risco que tira:** H-1 (cada área reserva para si) e H-2 (o tamanho real da reprovação), hoje suposições MK-04 a MK-06.
**Como validar:** rodar o plano em paralelo ao Excel de um lançamento em curso, sem trocar o processo, e comparar semana a semana.

| Item | O quê | Toca |
|---|---|---|
| Supabase como banco | Dado real das 5 engenharias, versões do plano persistidas. O adapter já existe (ticket 05b) | `infrastructure/supabase_repo.py`, `container.py` |
| Supabase Storage | Anexos de avaria (foto do dano) e laudo de teste | adapter novo de arquivos em `infrastructure/`; tela do painel do teste |
| Login e perfis | Engenharia registra status e avaria só dos próprios testes; só o gerente da coordenação aceita proposta (RN-07). Supabase Auth com RLS por área | `presentation/` (dependência de usuário), políticas no schema |
| Solver (OR-Tools CP-SAT) | Mesmo contrato `planejar(testes, frota, horizonte)`, com a gulosa como piso de comparação (ADR 0002) | `domain/` ganha uma segunda implementação atrás da mesma função |
| CPM completo | Dependência entre testes de carros diferentes, além da cadeia do carro (ADR 0007) | `domain/gestao.py` |
| Piso barato ao lado do plano | max(⌈Σ duração ÷ 20⌉, nº de destrutivos): mostra a distância até o ótimo sem solver | `domain/folga.py`, comparativo na tela |
| Guardrails no copiloto | O texto do usuário só vira evento validado; recusa pedido fora do escopo e dado pessoal na entrada e na saída | `infrastructure/llm_litellm.py` (antes e depois da chamada); `application/copiloto.py` já recusa evento inválido |
| Streaming da explicação | A explicação do copiloto aparece enquanto o modelo escreve | `infrastructure/llm_litellm.py` (`stream=True`) e rota SSE em `presentation/api.py` |
| Histograma de uso com o plano estourado | Hoje o histograma para na semana 20 mesmo quando o gerente aceitou passar do marco (revisão de 12/11, achado 7) | `domain/gestao.py` (`uso_por_semana` com o fim do plano) |
| Simulação de reprovações (H-2) | Monte Carlo sobre o plano: quantos carros de folga seguram 90% dos cenários | `domain/` (função pura nova), sem tocar no motor |

## v3 · produto (vários lançamentos)

**Valor:** o processo deixa de recomeçar a cada modelo (D7). Dois projetos disputam as mesmas engenharias à vista.
**Risco que tira:** depender de uma pessoa que sabe montar o plano.
**Como validar:** dois lançamentos simultâneos no mesmo calendário de frota, com a coordenação decidindo as disputas na tela.

| Item | O quê | Toca |
|---|---|---|
| Vários projetos | Frota e engenharias compartilhadas entre lançamentos | modelo de dados em `domain/modelo.py` e schema; o motor recebe o projeto como dimensão |
| Contêineres na AWS | Backend em ECS Fargate, tela em S3 + CloudFront, segredos no Secrets Manager (ADR 0006) | `Dockerfile` e infraestrutura; nenhuma camada de código muda |
| Prometheus e Grafana | Latência das rotas, tempo do motor, propostas aceitas × recusadas | `presentation/` (middleware de métricas) |
| Langfuse | Rastro de cada chamada ao LLM: entrada, saída, custo, avaliação humana da explicação | `infrastructure/llm_litellm.py` (callback do LiteLLM) |
| MLflow | Versão e avaliação dos prompts e modelos do copiloto contra um conjunto fixo de frases da coordenação | fora do backend: pipeline de avaliação que chama o port `InterpretadorDeImprevisto` |
| pgvector | Busca por semelhança em históricos de testes e avarias ("isso já aconteceu antes?") | adapter novo em `infrastructure/` atrás do `ContextProvider` (ADR 0004) |
| Strattum como Context Manager | O vocabulário e as regras vêm da Strattum, não de arquivo | `infrastructure/contexto_local.py` vira adapter da Strattum (ADR 0004) |
| Agent Dispatcher e MCP Gateway | Mais de um agente (planejamento, compras de protótipo, BI) chamando o motor como ferramenta | `presentation/` ganha um servidor MCP sobre os casos de uso; `application/` não muda |
| Integração com BI e ferramenta de otimização da Veloz | Ler o realizado e devolver o plano | adapters novos em `infrastructure/` |
