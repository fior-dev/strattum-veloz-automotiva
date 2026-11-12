# ADR 0004 · Context Manager como seam; a Strattum fica atrás dele

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
Na arquitetura-alvo, o contexto da empresa (glossário, regras, histórico de lançamentos, registros das áreas) é servido aos agentes por uma plataforma de contexto. Esse é o papel da Strattum. Não temos a API da Strattum e não vamos inventá-la.

## Decisão
A port `ContextProvider` define o que o copiloto precisa: glossário, métricas e regras. O adapter do protótipo lê arquivos locais (`backend/semantic/`), que repetem o `CONTEXT.md`. O adapter Strattum é roadmap.

## Alternativas descartadas
- **Prompt com o glossário fixo no código.** Funciona hoje, mas a troca para a Strattum mexeria no caso de uso.
- **Simular a API da Strattum.** Seria inventar fato sobre a empresa (restrição do prompt).

## Consequências
- O protótipo mostra onde a Strattum entra, sem prometer como.
