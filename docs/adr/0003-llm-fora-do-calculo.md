# ADR 0003 · O LLM traduz e explica; quem calcula é o motor; quem decide é a coordenação

status: aprovado pelo José · 12/11/2026 · Decidido por: José

## Contexto
O único uso de agente é o copiloto de replanejamento: a coordenação escreve "o teste de chuva da Aerodinâmica atrasou 2 semanas". Um LLM que calcula alocação erra sem avisar e não reproduz o resultado.

## Decisão
1. O LLM só transforma texto em um evento estruturado (`teste_id`, tipo, semanas) e explica o impacto em linguagem de negócio.
2. O evento passa por validação no domínio (o teste existe? semanas > 0?). Evento inválido volta como pergunta, não vira plano.
3. O motor `replanejar` calcula.
4. A tela mostra a proposta. Só o gerente da coordenação aceita (RN-07). Aceitar cria a versão N+1 do plano.

Sem framework de agente. Uma chamada de tool calling, via LiteLLM.

**LiteLLM não é framework de agente.** É uma biblioteca que traduz a mesma chamada para vários provedores (OpenRouter, Anthropic e outros): troca-se o modelo no `.env` sem mudar código. No desenho de arquitetura ela é o Model Gateway. Framework de agente (LangGraph, CrewAI) é outra coisa: organiza vários passos, memória e várias ferramentas. Aqui há um passo e uma ferramenta.

## Alternativas descartadas
- **LLM monta o plano.** Não é determinístico e não respeita as regras por construção. Com MCP Gateway e framework de agente dá para obrigar o LLM a só agir por ferramentas que validam as regras. Mas aí quem garante a regra é a ferramenta, não o LLM, e essa ferramenta é o motor: é o desenho deste ADR. A alternativa "o LLM propõe e um validador recusa até acertar" cumpre as regras por conferência, com custo de tempo e um plano diferente a cada execução.
- **LLM ajuda a editar o plano** ("passa o ELE-01 para o P030"). Faz sentido e usa o mesmo desenho: a frase vira um evento de edição, o motor valida e o gerente aceita. Não entrou por prazo; está no ROADMAP (v2).
- **Framework de grafo de agentes** (LangGraph). Um agente com uma ferramenta não justifica. Vai para o roadmap com o Agent Dispatcher.

## Consequências
- O número nunca depende do modelo. Trocar de modelo muda só a qualidade da tradução.
- O LLM fora do ar não para o sistema: a mesma ação existe na tela, sem texto livre.
