# 05 · Copiloto de replanejamento

Dor: D4 · Depende de: 04 · Estimativa: 2h · Só entra se 01 a 04 estiverem prontas às 13h. · Estado: em andamento · Commits: 482bce0

## O quê
- Port `InterpretadorDeImprevisto`; adapter LiteLLM → OpenRouter, modelo free, chave no `.env`.
- Port `ContextProvider`; adapter local lendo `backend/semantic/`.
- Caso de uso `interpretar_imprevisto`: texto → evento (tool calling) → validação → `replanejar` → explicação em linguagem de negócio.
- Tela: caixa de texto; a proposta aparece igual à da fatia 4, com "Aceitar".
- README: trocar para a Anthropic é só o `.env`.

## Aceite
- [x] Teste do caso de uso com interpretador falso em memória (sem rede): `backend/tests/test_copiloto.py`.
- [x] Texto que não vira evento válido volta como pergunta, sem mudar nada.
- [x] O número da proposta é o mesmo da fatia 4 para o mesmo evento (o LLM não calcula).
- [ ] Chamada real ao OpenRouter: falta a chave (pedida às 02h, sem resposta). O parsing do adapter está testado com `mock_response` do LiteLLM.

Decisão de implementação (FDE, 12/11): sem chave, o `container.py` usa um intérprete offline por regex. Ele é o dublê dos testes e a reserva da demo se o modelo free cair ao vivo.
