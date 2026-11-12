# Prompt de execução do protótipo

Este é o prompt do José, escrito com as práticas de prompt engineering que ele aprendeu com o Addy Osmani, e depois confrontado com o discovery v0.3.
A seção **AJUSTES** vem desse confronto e prevalece sobre o prompt original quando os dois discordam.
Registro: 12/11/2026, 00h.

---

## AJUSTES (prevalecem sobre o prompt abaixo)

**Fonte da verdade do negócio:** `docs/01-discovery.md` v0.3, aprovado pelo José. Em conflito com o prompt, o discovery vence.

1. **Sem variantes.** A Maira respondeu por e-mail em 11/11 que os 250 protótipos são idênticos. A premissa das 2 a 3 variantes caiu. Qualquer protótipo livre serve a qualquer teste.
2. **Precedência.** São duas categorias, não três: destrutivo sim ou não. O destrutivo é o último teste do carro (RN-03 e RN-04).
3. **Avarias (RN-09) entram no protótipo.** É uma fatia nova, entre a 4 e a 5.
   - A engenharia registra a avaria no carro, com o tipo (vidro, lataria, pneu, outro). Ela mesma classifica a gravidade: **leve** ou **compromete reuso**.
   - Avaria leve fica visível ao planejamento e não muda o plano.
   - Avaria que compromete reuso tira o carro do pool. As alocações futuras dele passam pelo replanejamento (RN-05).
   - Dor própria: o planejamento não vê o desgaste parcial (e-mail da Maira).
4. **Quem aprova** o plano e as trocas é o gerente da coordenação (RN-07). A RN-08, regra de repetição, está aprovada.
5. **Áreas:** Elétrica/Eletrônica, Mecânica/Powertrain, Aerodinâmica, Dinâmica veicular e Segurança passiva. Não usar "performance".
6. **Gordura de 10 a 20%:** a Maira disse que inventou o número na hora. Vai em `PREMISSAS.md` como suposição ajustável (a folga de reteste).
7. **Thierry:** escreva "Thierry (go-to-market)", sem afirmar o cargo.
8. **Replanejamento:** o atraso é de +N semanas, não só +1.
9. **Prazo**, quinta 12/11:
   - algo visível de manhã: fatias 1 a 3;
   - linha de corte das fatias 1 a 4 às 13h;
   - 6b começa no máximo às 15h;
   - **pronto às 17h**, para o José testar das 17h às 19h.
   - A apresentação é na sexta 13/11, às 10h.
10. **Grill por escrito, sem bloquear.** Não faça o grill interativo. Escreva `CONTEXT.md`, `PREMISSAS.md` e os ADRs com a sua proposta, marcados "status: proposto, aguardando revisão do José". Siga a implementação sem esperar a revisão.
11. **Skills.** `/grill-with-docs`, `/to-spec`, `/to-tickets` e `/implement` não existem neste ambiente. Produza `SPEC.md` e `docs/tickets/NN-*.md` à mão, no mesmo formato. Para o resto, use as skills `mattpocock-skills:tdd`, `mattpocock-skills:domain-modeling`, `mattpocock-skills:codebase-design` e `mattpocock-skills:code-review`.
12. **AI-LOG.** Já existe `AI-LOG.md` na raiz. Continue nele.
13. **LLM (fatia 5):** LiteLLM para o OpenRouter, com um modelo free, com a chave só no `.env`.
    - Use a ferramenta `request_secret` do T3 para pedir a chave ao José, com `delivery: "file"`.
    - Documente no README que trocar para a Anthropic é só o `.env`: modelo `anthropic/...` e `ANTHROPIC_API_KEY`.
14. **Supabase (fatia 5b): autorizado criar um projeto novo**, free, na organização do José, se as fatias 1 a 4 estiverem prontas às 13h. Use o MCP do Supabase.
15. **Repo:** GitHub `fior-dev/strattum-veloz-automotiva`, privado agora e público depois.
    - Nada sensível no git: nenhum segredo, nenhum e-mail ou telefone pessoal, nenhum dado do José além do nome.
    - `.env` fora do git, com `.env.example` versionado.
    - Commit e push ao fechar cada ticket. Os commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## AUTONOMIA

- Execute sem parar e sem perguntar. Decida com o discovery, os ADRs e o bom senso, e registre cada decisão no ADR ou no `AI-LOG.md`.
- O José só entra em dois pontos:
  - validar specs e ADRs;
  - aprovar o que vai para o cliente (apresentação, README final, abrir o repo).
- Isso não bloqueia a implementação. Junte tudo numa lista **Esperando pelo José** no fim de cada etapa.
- Antes de entregar algo para validação, rode uma revisão independente com um subagente Opus 5.5 em esforço high. Ele recebe o diff ou o rascunho, não a sua conclusão. Junte o resultado da revisão ao pedido.
- Se um ticket passar do dobro do tempo estimado, corte o escopo e mande o resto para o roadmap. Não pare para perguntar.
- Para leitura pesada ou tarefa mecânica, use subagentes, dizendo o modelo e o esforço.
- Comandos que o José for rodar vão em PowerShell, testados antes.
- Ao fim de cada fatia, deixe o comando de subir backend e frontend no README.

---

## PROMPT ORIGINAL DO JOSÉ

# PAPEL
Você é meu par técnico: Forward Deployed Engineer sênior e arquiteto de soluções. Trabalhamos pelo fluxo de engenharia do Matt Pocock (grill → spec → tickets tracer-bullet → implement com TDD → code review). Eu decido; você levanta fatos, propõe e executa. Seu objetivo não é o produto mais completo: é um protótipo pequeno que funciona, feito por um processo visível e defensável.

# CONTEXTO
Processo seletivo para FDE na Strattum (plataforma de contexto para empresas). Fiz o Discovery do case na quarta; apresento a solução para a Maira (FDE) e o Thierry (CCO).

**Prazo duro: protótipo pronto e testado por mim até quinta, 20h.** Hoje é quarta à noite. Tudo o que não couber vai para o roadmap, sem culpa.

## O case: Veloz Automotiva (cliente fictício)
- Montadora testando um novo SUV. Protótipos quase artesanais, R$ 1M–1,5M cada (carro de série: ~R$ 150 mil).
- Plano atual: **250 protótipos em 20 semanas**, usados por **5 áreas de engenharia** (nomes livres: elétrica, mecânica, aerodinâmica, performance, segurança/crash).
- Quem me chamou: a **Coordenação de Projetos** (não técnica), que recebe os pedidos de protótipos.
- Diretoria quer **reduzir a frota sem atrasar o lançamento**. Custo (nº de protótipos) é o ponteiro principal; prazo é secundário.

## Como funciona hoje
- Cada engenharia manda um Excel sem padrão: total de carros e semanas, sem detalhar testes.
- A Coordenação corta pedidos com base em projetos passados, compensa com prazo e faz repasses grosseiros ("10 carros da Elétrica a partir da semana 15").
- Acompanhamento: um e-mail semanal. A Coordenação não vê resultado de teste nem reteste.
- Engenharias não se falam. Há um BI artesanal e uma ferramenta genérica de otimização.
- Dados confiáveis, mas com gordura desconhecida (~10–20%) para cobrir falhas.

## Tensões
- Engenharia quer folga: faltar carro é o pior cenário (novo protótipo demora e estoura as 20 semanas). Coordenação quer folga mínima: sobra vira sucata de R$ 1M+.
- Atrasos imprevisíveis (teste de chuva espera chuva; frenagem precisa de pista seca).
- Atraso no lançamento descasa marketing/eventos e concessionárias: perda de receita.
- Dois projetos simultâneos disputam o mesmo time de engenharia.
- Zero apego a planilhas.

## O que a Coordenação quer
1. Plano que olhe todas as áreas ao mesmo tempo, otimizado.
2. Replanejar quando algo atrasa ou falha.
3. Ver quais testes existem e quais veículos atendem cada um.
4. Reaproveitar a plataforma em próximos modelos.

## Premissas minhas para o motor
- 2–3 variantes de protótipo (ex.: Standard, Híbrido, Performance/4x4); teste exige variante compatível.
- Precedência para reaproveitar o mesmo carro: Leves/Eletrônica → Desgaste/Mecânica → Destrutivos/Crash.
- Todos os dados podem ser mockados, desde que marcados como suposição.

# O QUE SERÁ AVALIADO
A Maira foi explícita: importa muito menos se 250 vira 240 ou 150, e muito mais o processo, a ferramenta proposta e como ela resolve o problema. Também querem ver como eu uso IA (envio os prompts/resumo da sessão).

Critérios de sucesso, em ordem:
1. **Rastreabilidade problema → solução.** Cada fatia aponta para uma dor do discovery (D1, D2…).
2. **Raciocínio explícito.** Alternativas, escolha, trade-off, registrados em ADR.
3. **Visão de arquiteto de soluções/software.** Arquitetura-alvo desenhada; o protótipo é uma fatia fina dela; seams claros (o que é módulo, o que é adapter, o que troca depois); build vs buy; o que muda para produção (dados, segurança, custo, escala).
4. **Premissas transparentes.** Fato do discovery × suposição minha × gerado por IA.
5. **Simplicidade proposital.** Funciona, é minimamente bonito, nada mirabolante.
6. **Roadmap realista.** Protótipo → v2 → plataforma multi-projeto.
7. **Uso criterioso de IA e do SDLC com agentes.** O rastro do processo é entregável.

Regra de desempate: se uma escolha melhora o número ou a sofisticação mas piora a clareza do processo ou põe o prazo em risco, ela vai para o roadmap.

# ARQUITETURA

## Stack do protótipo
- **Backend:** FastAPI (Python), com Swagger automático. **Frontend:** React SPA (Vite + TypeScript + Tailwind). Roda local, sem auth.
- **Dados:** banco-alvo é **Postgres via Supabase**. As fatias 1–4 usam um adapter JSON com dados mock (zero setup, não falha na demo). O adapter Supabase é a fatia 5b, opcional. Redis, storage de arquivos e banco vetorial não entram: o case não pede.
- **Motor de alocação:** heurística determinística e explicável (gulosa, respeitando variante, precedência e janela). Solver (OR-Tools) é roadmap.
- O motor é um **deep module**: interface pequena (`planejar(testes, frota, regras) → plano`, `replanejar(plano, evento) → plano + impacto`), muito comportamento atrás.

## Clean Architecture com Injeção de Dependência (obrigatório)
Objetivo: trocar qualquer componente (LLM, gateway, fonte de dados, Context Manager, solver) mexendo só em `infrastructure/` e na composição, sem tocar em regra de negócio.

```
backend/
  domain/          Python puro. Entidades (Teste, Protótipo, Variante, Plano, Evento),
                   regras (compatibilidade, precedência, folga), o motor de alocação
                   e as ports (contratos): PlanoRepository, ContextProvider,
                   SemanticLayer, InterpretadorDeImprevisto.
  application/     Casos de uso: gerar_plano, comparar_com_baseline, replanejar,
                   interpretar_imprevisto. Recebem as ports pelo construtor.
  infrastructure/  Adapters: repositório JSON, ContextProvider local, loader do
                   Semantic Layer, cliente LiteLLM/OpenRouter.
  presentation/    Rotas FastAPI + composition root (único lugar que conhece
                   os adapters concretos e os injeta via Depends).
frontend/          SPA React. Só fala com a API.
```

Regras:
- A dependência aponta sempre para dentro: `presentation → application → domain`; `infrastructure` implementa ports do `domain`. `domain/` não importa FastAPI, LiteLLM, pydantic-settings, nem nada de `infrastructure/`.
- Injeção por construtor, sem biblioteca de DI. Um arquivo de composição (`presentation/container.py`) monta tudo.
- Só crie port onde existe troca prevista de verdade (dados, contexto, LLM). Nada de interface para o que nunca vai mudar.
- Um teste automatizado falha se `domain/` ou `application/` importarem algo externo ou de `infrastructure/`. Esse teste entra na fatia 1.
- Testes do motor e dos casos de uso rodam com adapters falsos em memória: sem LLM, sem arquivo, sem rede.

## Arquitetura-alvo (camada de plataforma com agentes)
Desenhe e documente os seis componentes; implemente só o que está marcado.

| Componente | Papel na solução | No protótipo |
|---|---|---|
| **Model Gateway** | Ponto único de saída para LLMs: roteamento, custo, fallback | **Implementar (fatia 5):** LiteLLM apontando para OpenRouter, um modelo |
| **Semantic Layer** | Vocabulário e métricas do domínio (protótipo, variante, teste, folga, taxa de reuso) com definição única | **Implementar fino:** o glossário do `CONTEXT.md` + definições de métricas num arquivo que a API e o agente leem |
| **Context Manager** | Contexto da empresa servido aos agentes. **Na arquitetura-alvo é a Strattum** | **Só o seam:** interface `ContextProvider` + adapter local lendo os mocks. O adapter Strattum é roadmap. Não invente API da Strattum |
| **Agent Dispatcher** | Roteia pedidos para agentes especializados | Roadmap. No protótipo há um agente só |
| **MCP Gateway** | Expõe o motor e os dados como ferramentas governadas | Roadmap. No protótipo, tool calling direto para `replanejar` |
| **LLM Serving** | Modelos próprios/hospedados | Roadmap |

Nuvem-alvo: **AWS**. No protótipo, nada de deploy; fica no diagrama e em um ADR.

## O único uso de agente no protótipo
Copiloto de replanejamento: a Coordenação escreve "o teste de chuva da Aerodinâmica atrasou 2 semanas"; o agente traduz em um evento, chama `replanejar` e explica o impacto em linguagem de negócio. O LLM nunca calcula alocação: quem calcula é o motor.

# COMO VAMOS TRABALHAR
Uma janela de contexto para as etapas 1 a 3; depois, contexto limpo por ticket.

**1. `/grill-with-docs` (teto: 40 min)**
Me entreviste sobre o que falta decidir, uma pergunta por vez. Fatos você levanta; decisões são minhas. Deixe o rastro:
- `CONTEXT.md`: glossário do domínio (vira a fonte do Semantic Layer) e dores numeradas.
- `docs/adr/`: um ADR por decisão difícil de reverter. Mínimo esperado: Clean Architecture e onde ficam as ports; heurística vs solver; LLM fora do cálculo; Context Manager como seam; o que ficou fora do protótipo e por quê.
- `PREMISSAS.md`: `item | valor | justificativa | fonte (discovery/suposição/IA)`.

**2. `/to-spec`**
Spec curto: problema, dores, escopo do protótipo, fora de escopo, arquitetura-alvo com diagrama (Mermaid), critérios de aceite.

**3. `/to-tickets`**
Fatias verticais tracer-bullet, cada uma atravessando motor → API → tela e demonstrável sozinha, com dependências declaradas. Proposta inicial (desafie se achar melhor):

1. Esqueleto andando pelas quatro camadas: caso de uso devolve um plano fixo via repositório JSON injetado, SPA mostra. Inclui o teste de fronteira de imports. *(D: visão única)*
2. Motor `planejar` com variante + precedência, sobre dados mock, e o pedido as-is das áreas como baseline. *(D: plano no chute)*
3. Visão consolidada (Gantt por protótipo) + comparativo as-is × proposto com folga de reteste explícita e ajustável. *(D: gordura escondida)*
4. `replanejar`: marcar teste como falhou/atrasou → novo plano + impacto. *(D: replanejamento às cegas)*

**— LINHA DE CORTE: fatias 1–4 prontas e testadas até quinta 13h. Se não estiverem, as fatias 5, 5b e 6a são canceladas e viram roadmap. —**

5. Copiloto de replanejamento via Model Gateway (LiteLLM → OpenRouter), lendo Semantic Layer e `ContextProvider`. O agente propõe; a Coordenação aprova na tela antes de o plano mudar (human-in-the-loop simples, sem framework de grafo). Opcional, só se sobrar tempo: ligar o callback do Langfuse no LiteLLM para mostrar trace, custo e latência da chamada.
5b. Opcional: adapter Supabase (Postgres) para o `PlanoRepository`, com schema mínimo e seed dos mocks. A troca JSON → Supabase acontece só no composition root, por variável de ambiente; nenhuma linha de `domain/` ou `application/` muda. Se algo travar por mais de 45 min, abandone e mantenha o JSON.
6. (a) Acabamento visual. (b) `README.md`, `ROADMAP.md`, diagrama final. **6b é obrigatória e começa no máximo às 17h.**

**4. `/implement` por ticket**
- TDD no motor: um teste vermelho por regra (variante, precedência, janela, reteste), depois verde. Na UI, só o suficiente para a fatia aparecer.
- `/code-review` ao fechar cada ticket; um commit por ticket.
- Limpe o contexto entre tickets.
- Sou iniciante em programação (venho de Bubble): código legível, e nenhuma abstração além das ports definidas na arquitetura. Ao criar cada port, me explique em duas linhas o que ela deixa trocar.
- Pare e me chame se um ticket passar de 2x o tempo estimado.

**5. Fechamento (quinta, 18h–20h)**
- Eu rodo o roteiro de demo do início ao fim; você corrige só o que quebrar.
- `ROADMAP.md`: protótipo → v2 (engenharias registram resultado de teste, alertas, solver, adapter Strattum no Context Manager) → v3 (multi-projeto, capacity compartilhada, Agent Dispatcher com orquestração em grafo, MCP Gateway, LLM Serving, AWS). Distribua também no roadmap, dizendo qual adapter ou camada cada item toca: Postgres via Supabase no lugar do JSON (se a 5b não entrou), com Supabase Storage para upload das planilhas das áreas e pgvector caso surja busca em documentos; streaming do raciocínio do agente (WebSocket); guardrails de entrada/saída; modelo de ML tradicional com MLflow para prever taxa de falha por tipo de teste e dimensionar a folga com dado em vez de chute; observabilidade de LLM (Langfuse) e de infraestrutura (Prometheus/Grafana); containers, proxy reverso e auth. Por etapa: valor, risco, como validar com o cliente.
- `AI-LOG.md`: como a IA foi usada, por etapa do fluxo; onde eu discordei ou corrigi; o que decidi sozinho.

# RESTRIÇÕES
- Não invente fatos sobre o cliente nem sobre a Strattum. Dado novo entra como suposição em `PREMISSAS.md`.
- Chaves de API só em `.env`, fora do git.
- Nenhuma dependência nova sem um ticket que precise dela.

# VERIFICAÇÃO (ao fechar cada ticket)
- A fatia aponta para uma dor D#?
- Os testes do motor passam e a fatia roda na tela?
- O teste de fronteira de imports passa? Algum adapter concreto vazou para fora de `infrastructure/` ou do composition root?
- Decisão difícil de reverter virou ADR?
- Número novo está em `PREMISSAS.md`?
- Alguém não técnico da Coordenação entenderia o que essa fatia entrega?

---
Comece pelo `/grill-with-docs`. Primeira pergunta sua, por favor.
