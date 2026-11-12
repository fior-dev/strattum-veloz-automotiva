# ADR 0003 · O LLM traduz e explica; quem calcula é o motor; quem decide é a coordenação

status: proposto, aguardando revisão do José · 12/11/2026

## Contexto
O único uso de agente é o copiloto de replanejamento: a coordenação escreve "o teste de chuva da Aerodinâmica atrasou 2 semanas". Um LLM que calcula alocação erra sem avisar e não reproduz o resultado.

## Decisão
1. O LLM só transforma texto em um evento estruturado (`teste_id`, tipo, semanas) e explica o impacto em linguagem de negócio.
2. O evento passa por validação no domínio (o teste existe? semanas > 0?). Evento inválido volta como pergunta, não vira plano.
3. O motor `replanejar` calcula.
4. A tela mostra a proposta. Só o gerente da coordenação aceita (RN-07). Aceitar cria a versão N+1 do plano.

Sem framework de agente. Uma chamada de tool calling, via LiteLLM.

## Alternativas descartadas
- **LLM monta o plano.** Não é determinístico e não respeita as regras por construção.
- **Framework de grafo de agentes** (LangGraph). Um agente com uma ferramenta não justifica. Vai para o roadmap com o Agent Dispatcher.

## Consequências
- O número nunca depende do modelo. Trocar de modelo muda só a qualidade da tradução.
- O LLM fora do ar não para o sistema: a mesma ação existe na tela, sem texto livre.
