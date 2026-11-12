# SPEC · Protótipo de alocação da frota da Veloz

status: proposto, aguardando revisão do José · 12/11/2026
Fonte do negócio: `docs/01-discovery.md` v0.3. Glossário e dores: `CONTEXT.md`. Números: `PREMISSAS.md`.

## Problema
A coordenação de projetos da Veloz aloca 250 protótipos de R$ 1 milhão ou mais entre 5 engenharias, sem dado. Cada área pede carros para si, com gordura escondida; ninguém vê o carro que a outra libera; atraso e reprovação chegam pelo e-mail semanal. Sobra vira sucata, falta atrasa o lançamento.

## Dores atacadas
D1 a D6 e D8 do `CONTEXT.md`. D7 (multi-projeto) fica no roadmap.

## Escopo do protótipo
| Fatia | Entrega para a coordenação | Requisitos | Dor |
|---|---|---|---|
| 1 | Esqueleto: a tela mostra um plano vindo da API, pelas 4 camadas | — | D2 |
| 2 | Motor gera o plano compartilhado; o "como hoje" vem dos pedidos | RF-01, RF-02, RN-01 a RN-04, RN-06 | D1 |
| 3 | Gantt por protótipo × semana; comparativo como hoje × proposto, com folga de reteste ajustável | RF-03, RF-04, RF-07 | D2, D3 |
| 4 | Status do teste; atraso de +N semanas e falha geram sugestões de troca ou impactados; aceitar cria versão N+1 | RF-05, RF-06, RN-05, RN-07, RN-08 | D4, D5 |
| 4b | Registro de avaria: leve só aparece; compromete reuso tira o carro do pool e replaneja | RF-08, RN-09 | D6 |
| 4c | Caminho crítico, marco do lançamento, impacto no marco e uso da frota por semana | ADR 0007 | D8 |
| 5 | Copiloto: texto livre → evento → `replanejar` → explicação; a coordenação aprova | ADR 0003 | D4 |
| 5b | Opcional: adapter Postgres (Supabase) no lugar do JSON | ADR 0006 | — |
| 6 | Acabamento, README, ROADMAP, diagrama final | — | — |

## Fora de escopo
ADR 0005.

## Regras do replanejamento (detalhe do RN-05, RN-08 e RN-09)
- **Atraso de A em +N semanas:** o fim de A anda N semanas. Todo teste B no mesmo carro que começa até o novo fim de A colide.
- **Falha de A, não destrutivo:** A ganha um reteste com a mesma duração, no mesmo carro, logo depois do fim. O que colide com o reteste segue a regra de colisão.
- **Falha de A, destrutivo:** o reteste vai para um carro livre, logo depois do fim de A.
- **Avaria que compromete reuso no carro P, na semana s:** todo teste prometido a P que começa depois de s colide. O teste em andamento na semana s fica no carro até o fim. Avaria leve não muda nada.
- **Colisão de B:** o sistema procura outro carro livre nas mesmas semanas de B, primeiro entre os carros do plano, depois entre os carros da folga de reteste, pelo menor ID. Achou: sugestão "mover B de P1 para P2". Não achou: B e a área dele aparecem como impactados e B sai do plano até alguém decidir.
- Passar da semana 20 também é impacto (RN-06).
- A proposta só vira plano quando o gerente da coordenação aceita (RN-07). Simplificação: aceita-se a proposta inteira, não sugestão por sugestão.

## Arquitetura-alvo

```mermaid
flowchart LR
  subgraph Usuarios
    C[Coordenação]:::u
    E[Engenharias]:::u
  end
  subgraph Plataforma
    SPA[SPA React]
    API[API FastAPI]
    subgraph Nucleo[Domínio]
      M[Motor de alocação<br/>planejar / replanejar]
    end
    AD[Agent Dispatcher]:::r
    MCP[MCP Gateway]:::r
    MG[Model Gateway<br/>LiteLLM]
    SL[Semantic Layer<br/>glossário e métricas]
    CM[Context Manager<br/>ContextProvider]
    DB[(Postgres<br/>Supabase)]
    LS[LLM Serving]:::r
  end
  ST[Strattum]:::ext
  OR[OpenRouter / Anthropic]:::ext
  C --> SPA --> API --> M
  E -. registra status e avaria .-> SPA
  API --> AD --> MCP --> M
  AD --> MG --> OR
  MG --> LS
  AD --> CM --> ST
  CM --> SL
  M --> DB
  classDef r stroke-dasharray: 5 5,color:#888
  classDef ext fill:#eee
  classDef u fill:#fff
```

Tracejado é roadmap. No protótipo, a API chama o copiloto direto (sem Dispatcher nem MCP), o `ContextProvider` lê arquivos locais e o banco é JSON em memória.

## Critérios de aceite
Os do §13 do discovery, um teste automatizado por critério de regra. Mais:
- O teste de fronteira de imports passa (ADR 0001).
- `uv run pytest` passa no backend; `npm run build` passa no frontend.
- O comando do README sobe backend e frontend no PowerShell.
