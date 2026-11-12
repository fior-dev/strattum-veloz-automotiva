# 05 · Copiloto de replanejamento

Dor: D4 · Depende de: 04 · Estimativa: 2h · Só entra se 01 a 04 estiverem prontas às 13h. · Estado: feito · Real: 8 min · Commits: 482bce0

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
- [x] Chamada real ao OpenRouter em 12/11, 14h25: "o túnel de vento AER-99 vai atrasar duas semanas por causa da chuva" virou `atraso AER-99 +2` e a mesma proposta da fatia 4 (DIN-02 do P006 para o P162). O modelo free respondeu 429 (limite do provedor) antes de completar: é o risco da demo ao vivo.

Decisão de implementação (FDE, 12/11): sem chave, o `container.py` usa um intérprete offline por regex. Ele é o dublê dos testes e a reserva da demo se o modelo free cair ao vivo.
