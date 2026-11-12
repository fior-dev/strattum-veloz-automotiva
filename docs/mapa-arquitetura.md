# Mapa de arquitetura

status: proposto, aguardando revisão do José · 12/11/2026

Uma linha por entrada: rota, tabela, script. SIPOC = quem fornece, o que entra, o que a entrada faz, o que sai, quem recebe.

**Quem pode chamar, no protótipo:** local por padrão. Publicado (ticket 08), qualquer um com a URL chama qualquer rota, sem login. A API escuta só em `127.0.0.1:8000`, sem login: quem está na máquina chama qualquer rota. A tela (Vite, `localhost:5173`) repassa `/api` para a API. Login e perfis entram na v2 (ROADMAP.md).

## Rotas da API (`backend/presentation/api.py`)

| Entrada | Fornece | Entra | Faz | Sai | Recebe | Credencial | ADR |
|---|---|---|---|---|---|---|---|
| `GET /api/plano?versao` | Tela | versão (opcional) | Lê o plano atual ou uma versão antiga; gera a v1 do mock se não houver plano | alocações, não cabe, reserva, avarias, versões | Gantt | nenhuma | [0001](adr/0001-clean-architecture-e-ports.md), [0002](adr/0002-heuristica-gulosa-vs-solver.md) |
| `GET /api/gestao?versao` | Tela | versão (opcional) | Calcula folga de cada teste pela cadeia do carro, marco da semana 20, uso da frota por semana, curva meta × carros | críticos, sinal, histograma | blocos de marco e de uso da frota | nenhuma | [0007](adr/0007-caminho-critico-pela-cadeia-do-carro.md) |
| `GET /api/comparativo` | Tela | — | Soma os pedidos "como hoje" e compara com o plano compartilhado | carros e semana de fim dos dois lados, redução % | faixa de números do topo | nenhuma | [0002](adr/0002-heuristica-gulosa-vs-solver.md) |
| `PUT /api/folga` | Tela (controle deslizante) | folga 0 a 0,3 | Recalcula os carros de reserva; o plano não muda. Com proposta pendente, recusa (422) | comparativo novo | faixa de números | nenhuma | PREMISSAS MK-06 |
| `POST /api/status` | Engenharia, pela tela | teste, status, semanas de atraso | Começou e terminou gravam direto; atrasou e falhou geram proposta de replanejamento (RN-05, RN-08). Com proposta pendente, recusa (422): uma decisão por vez | proposta ou nada | painel de proposta | nenhuma (v2: a engenharia dona do teste) | [0002](adr/0002-heuristica-gulosa-vs-solver.md) |
| `POST /api/avarias` | Engenharia, pela tela | carro, tipo, gravidade, semana, área | Avaria leve grava no plano atual, sem versão nova; compromete reuso tira o carro do pool e gera proposta (RN-09) | proposta ou nada | painel de proposta | nenhuma (v2: engenharia) | [0002](adr/0002-heuristica-gulosa-vs-solver.md) |
| `GET /api/proposta` | Tela | — | Devolve a proposta pendente | sugestões, impactados, impacto no marco | painel de proposta | nenhuma | [0007](adr/0007-caminho-critico-pela-cadeia-do-carro.md) |
| `POST /api/proposta/aceitar?estourar` | Gerente da coordenação | estourar (opcional, padrão falso) | Grava a versão N+1 (RN-07, RF-06). Proposta que termina depois da semana 20 só entra com estourar=true; sem ele, recusa (422) e nada é gravado (ticket 07) | versão nova | Gantt | nenhuma (v2: só o gerente) | [0001](adr/0001-clean-architecture-e-ports.md) |
| `POST /api/proposta/recusar` | Gerente da coordenação | — | Descarta a proposta; o plano fica na versão N | — | Gantt | nenhuma (v2: só o gerente) | [0001](adr/0001-clean-architecture-e-ports.md) |
| `GET /api/copiloto` | Tela | — | Diz qual modelo está em uso, ou "offline" sem chave | nome do modelo | caixa do copiloto | nenhuma | [0003](adr/0003-llm-fora-do-calculo.md) |
| `POST /api/copiloto` | Coordenação, texto livre | frase ("AER-99 atrasou 2 semanas") | LLM só traduz a frase em evento; o motor calcula; o LLM explica com os números do motor. Evento inválido volta como pergunta | evento, explicação, proposta | caixa do copiloto e painel de proposta | nenhuma na rota; a chave do LLM fica no `backend/.env` e só o backend lê | [0003](adr/0003-llm-fora-do-calculo.md), [0004](adr/0004-context-manager-como-seam.md) |

| `GET /` e arquivos da tela | Navegador | — | Serve o build da tela (Vite) quando `TELA_DIR` existe, só no contêiner; montado depois das rotas `/api` | HTML, JS, CSS | navegador | nenhuma | [0006](adr/0006-dados-e-nuvem.md) (ticket 08) |

## Dados

| Entrada | Fornece | Entra | Faz | Sai | Recebe | Credencial | ADR |
|---|---|---|---|---|---|---|---|
| `backend/data/mock.json` | `scripts/gerar_mock.py` (semente 42) | premissas MK-01 a MK-07 | Frota, 625 testes, 5 pedidos "como hoje" | arquivo JSON | `JsonPlanoRepository` (padrão) | arquivo local | [0006](adr/0006-dados-e-nuvem.md) |
| Tabelas `prototipos`, `testes`, `pedidos` (Supabase) | `scripts/seed_supabase.py` | o mesmo mock | Dado de referência, lido uma vez quando o backend sobe | linhas | `SupabasePlanoRepository` | chave secreta no `backend/.env`. RLS ligado sem política: a chave publicável não lê nada | [0006](adr/0006-dados-e-nuvem.md) |
| Tabela `planos` (Supabase) | Backend | plano inteiro como documento JSON, por versão | Guarda as versões; ajustar a folga regrava a mesma versão | versões do plano | `SupabasePlanoRepository` | idem | [0006](adr/0006-dados-e-nuvem.md) |
| `backend/semantic/contexto.json` | FDE | glossário, métricas, regras | Vocabulário da empresa para o copiloto | contexto | `ContextoLocal` → LLM | arquivo local | [0004](adr/0004-context-manager-como-seam.md) |

## Fora do backend

| Entrada | Fornece | Entra | Faz | Sai | Recebe | Credencial |
|---|---|---|---|---|---|---|
| OpenRouter (via LiteLLM) | Backend | frase + catálogo de testes + contexto | Tool calling `registrar_evento`; texto da explicação | evento JSON, texto | `application/copiloto.py` | `OPENROUTER_API_KEY` no `backend/.env` |
| `painel/index.html` | `node painel/gerar.mjs` | arquivos do repo e `git log` | Rastro do processo para a Strattum | HTML estático | quem abre o arquivo | nenhuma |
