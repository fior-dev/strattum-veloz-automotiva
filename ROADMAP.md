# Roadmap · do protótipo ao produto

status: proposto, aguardando revisão do José · 12/11/2026

Cada etapa diz o valor para a Veloz, o risco que ela tira e como validar com a coordenação antes de seguir. Cada item diz qual camada ou adapter toca (ADR 0001). O motor (`domain/`) só muda onde está escrito.

## Protótipo (hoje, 13/11)

O que existe: plano compartilhado com folga à vista, Gantt, replanejamento com aceite do gerente, avarias com a lista da versão, caminho crítico e marco, copiloto de texto livre, apresentação guiada em 5 passos e perfil simulado (gerente ou engenharia). Dados mockados (PREMISSAS.md), sem login. Banco: JSON, ou Supabase com `DATA_BACKEND=supabase`. Um contêiner serve tela e API (ticket 08).

**Validar na apresentação.** São as três hipóteses do protótipo que só a cliente confirma:

| Pergunta | Por que perguntar |
|---|---|
| A coordenação entende o plano sem ajuda? | A Maira disse que o processo importa mais que o número (ADR 0002). Se a coordenação não lê o Gantt sozinha, o plano compartilhado não substitui a planilha. O passo a passo da tela existe para testar isso |
| A regra de troca do RN-05 é a que ela usaria? | A regra "procura outro carro livre nas mesmas semanas" é premissa aprovada pelo José `[P]`, não fala da cliente. Se a coordenação preferir empurrar o teste em vez de trocar de carro, o replanejamento muda |
| 553 de 625 testes críticos (88%): é essa a conversa? | O plano de menor frota não tem folga de prazo. A tela mostra o preço (cerca de +5 carros por semana de folga). Falta saber se a Veloz prefere menos carros ou mais prazo |

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
| CPM completo | CPM é o método do caminho crítico (*Critical Path Method*), da gestão de projetos: dadas as tarefas e quais dependem de quais, acha a sequência que define a data final. Hoje a única dependência é a fila de testes no mesmo carro; o completo inclui dependência técnica entre testes de carros diferentes (ADR 0007). Primeiro passo: levantar essas dependências com as áreas | `domain/gestao.py` |
| Copiloto edita o plano | Frase vira evento de edição ("passa o ELE-01 para o P030"); o motor valida, o gerente aceita (ADR 0003) | evento novo em `domain/motor.py`; `application/copiloto.py` |
| Piso barato ao lado do plano (feito em 12/11, ticket 10) | max(⌈Σ duração ÷ 20⌉, nº de destrutivos): mostra a distância até o ótimo sem solver. Entrou junto com a memória de cálculo e a simulação | `domain/gestao.py` (`memoria`, `simular`), blocos na tela |
| Guardrails no copiloto | O texto do usuário só vira evento validado; recusa pedido fora do escopo e dado pessoal na entrada e na saída | `infrastructure/llm_litellm.py` (antes e depois da chamada); `application/copiloto.py` já recusa evento inválido |
| Streaming da explicação | A explicação do copiloto aparece enquanto o modelo escreve | `infrastructure/llm_litellm.py` (`stream=True`) e rota SSE em `presentation/api.py` |
| Histograma de uso com o plano estourado | Hoje o histograma para na semana 20 mesmo quando o gerente aceitou passar do marco (revisão de 12/11, achado 7) | `domain/gestao.py` (`uso_por_semana` com o fim do plano) |
| Comparar alternativas de replanejamento | Hoje o sistema propõe uma troca só. Mostrar duas ou três lado a lado (trocar de carro, empurrar o teste, usar a reserva), cada uma com o efeito no marco e nos carros, para o gerente escolher. Pedido do José em 13/11 | `domain/motor.py` (`replanejar` devolve mais de uma proposta); painel da proposta |
| Avisar as pessoas afetadas | Quando o gerente aceita, as áreas donas dos testes movidos recebem um aviso (e-mail ou Teams) com o antes e o depois. Hoje elas só veem se abrirem a tela. Pedido do José em 13/11 | port novo de notificação em `domain/ports.py`, adapter em `infrastructure/`; chamado no aceite, em `application/` |
| Histórico de avarias por carro | Tabela própria de avarias e tela com o histórico de cada carro, inclusive entre lançamentos. Hoje a avaria fica gravada dentro de cada versão do plano | schema e `infrastructure/supabase_repo.py`; tela nova |
| Simulação de reprovações (H-2) | Monte Carlo sobre o plano: quantos carros de folga seguram 90% dos cenários | `domain/` (função pura nova), sem tocar no motor |

## O que antecipar para a avaliação (RICE)

Nota = Alcance × Impacto × Confiança ÷ Esforço. Alcance: quantos dos critérios do case o item toca (1 a 3). Impacto: 1 a 3. Esforço em horas. As notas são estimativa do FDE.

| Item | Alcance | Impacto | Confiança | Esforço | Nota | Situação |
|---|---|---|---|---|---|---|
| Perfil simulado na tela (fatia de "Login e perfis") | 3 | 2 | 90% | 0,5 h | 10,8 | feito em 12/11 |
| Apresentação guiada em 5 passos | 3 | 3 | 80% | 1 h | 7,2 | feito em 12/11 |
| Piso barato ao lado do plano | 2 | 2 | 80% | 0,5 h | 6,4 | feito em 12/11 (ticket 10), com a memória de cálculo e a simulação |
| Supabase como banco | 2 | 2 | 90% | 1 h | 3,6 | feito (ticket 05b) |
| Contêiner único (degrau da AWS) | 2 | 2 | 90% | 1 h | 3,6 | feito (ticket 08); a demo foi publicada por túnel em 13/11, o contêiner fica para o piloto |
| Langfuse no copiloto | 1 | 2 | 70% | 1 h | 1,4 | depois: pede conta e chave |
| Guardrails no copiloto | 2 | 1 | 70% | 2 h | 0,7 | parte existe: evento validado, texto limitado a 500 caracteres |
| Login de verdade (Supabase Auth + RLS) | 2 | 3 | 60% | 6 h | 0,6 | piloto |
| Solver CP-SAT | 2 | 2 | 50% | 8 h | 0,25 | v2 |
| CPM completo | 2 | 3 | 30% | 8 h + dado | 0,2 | v2: falta o dado das dependências |

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
