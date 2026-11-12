# ADR 0005 · O que ficou fora do protótipo, e por quê

status: proposto, aguardando revisão do José · 12/11/2026

Regra de desempate do prompt: se uma escolha melhora o número ou a sofisticação mas piora a clareza ou põe o prazo em risco, vai para o roadmap.

| Fora | Por quê | Entra quando |
|---|---|---|
| Variantes de protótipo | Caíram: os 250 são idênticos (e-mail da Maira, 11/11) | Não volta, salvo fato novo |
| Login e perfis por área | Não muda a decisão da coordenação na demo | Piloto |
| Solver ótimo | ADR 0002 | v2 |
| Clima, capacidade por engenharia, custo por hora | Sem dado; o discovery deixa fora | v2 |
| Vários projetos ao mesmo tempo | D7; muda o modelo de dados | v3 |
| Integração com o BI e a ferramenta de otimização | Sem acesso | Piloto |
| Agent Dispatcher, MCP Gateway, LLM Serving | Um agente só, com uma ferramenta | v3 |
| Deploy na AWS | A entrevista pede "nada em produção" `[T]`; rodar local é hipótese do FDE `[H]` (ADR 0006) | Piloto |
| Simulação de reprovações (H-2) | O replanejamento já mostra o mecanismo; a simulação só entra se sobrar tempo | v2 |
