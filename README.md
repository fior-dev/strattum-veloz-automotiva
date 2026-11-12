# Strattum · case de FDE · Veloz Automotiva

Este repositório guarda o case técnico de Forward Deployed Engineer da Strattum, com apresentação na sexta 13/11/2026.
O cliente é fictício: a Veloz Automotiva quer reduzir a frota de 250 protótipos de um SUV sem atrasar o lançamento.

## Como subir (Windows PowerShell)

Pré-requisitos: [uv](https://docs.astral.sh/uv/) e Node 20 ou mais novo.

```powershell
cd strattum-veloz-automotiva   # a pasta do clone
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

Abre duas janelas: o backend em http://127.0.0.1:8000/docs (Swagger) e a tela em http://localhost:5173.
Reiniciar o backend volta o plano para a versão 1 do mock (com o JSON, o padrão).

### Copiloto com LLM (opcional)

Sem chave, o copiloto roda offline e entende só "AER-99 atrasou 2 semanas" e "AER-99 falhou". Para ligar o LLM (LiteLLM → OpenRouter, modelo free):

```powershell
cd backend
Copy-Item .env.example .env
notepad .env   # preencha OPENROUTER_API_KEY e salve
```

Reinicie o backend. A tela mostra o modelo em uso embaixo da caixa do copiloto.
**Trocar para a Anthropic é só o `.env`:** `LLM_MODEL=anthropic/claude-sonnet-5-5`, `LLM_FALLBACKS=` vazio e `ANTHROPIC_API_KEY=...`. Nenhuma linha de código muda (ADR 0003).

### Dados no Supabase (opcional)

Por padrão o backend lê `backend/data/mock.json` e guarda as versões do plano em memória. Para usar o Postgres de um projeto Supabase (o plano Free basta):

1. No SQL Editor do projeto, rode `supabase/migrations/20261112000000_schema.sql`.
2. No `backend/.env`, preencha `SUPABASE_URL` (`https://<ref>.supabase.co`) e `SUPABASE_SECRET_KEY` (Project Settings → API Keys, a chave `sb_secret_...`).
3. Carregue o mock e ligue o Supabase:

```powershell
cd backend
uv run python scripts/seed_supabase.py
uv run pytest tests/test_repositorios.py
```

Depois, `DATA_BACKEND=supabase` no `.env` e reinicie o backend. No Supabase o plano aceito sobrevive ao reinício: para a demo voltar ao início, rode o seed de novo.

### Contêiner (ticket 08)

Um contêiner serve a tela e a API em http://127.0.0.1:8088. As chaves entram só na hora de rodar:

```powershell
docker build -t veloz-demo .
docker run --rm -p 8088:8000 --env-file backend\.env -e DATA_BACKEND=json veloz-demo
```

Sem `--env-file`, o copiloto roda offline. O `--env-file` leva todas as chaves do `.env` para o contêiner: serve só na sua máquina. No host publicado, passe só `OPENROUTER_API_KEY` e `LLM_MODEL`. Todos que abrem a URL dividem o mesmo plano; reiniciar o contêiner volta à versão 1.

Testes: `cd backend; uv run pytest`. Build da tela: `cd frontend; npm run build`.

## Roteiro da demo (10 min)

1. **O número.** Topo da tela: como hoje, 245 carros até a semana 14; plano compartilhado, 168 carros até a semana 20 (−31%). A folga de reteste está à vista e o controle deslizante muda só a reserva.
2. **O que segura o lançamento.** Bloco do marco: 553 de 625 testes estão no caminho crítico; o plano troca folga de prazo por carros. A tabela meta × carros mostra o preço de adiantar o fim.
3. **O imprevisto.** Busque `AER-99` → "Atrasou" → +2 semanas. O sistema propõe mover o DIN-02 do P006 para o P162, da folga, e diz que o marco não se move. Clique em **Recusar**: o plano fica na versão 1. (A decisão é do gerente da coordenação, RN-07.)
4. **O copiloto.** Na caixa de texto, escreva "o AER-99 atrasou duas semanas por causa da chuva". A proposta é a mesma do passo 3: o LLM só traduz a frase, quem calcula é o motor. Agora clique em **Aceitar**: nasce a versão 2, e a versão 1 continua para consulta no seletor de versão.
5. **A avaria.** Abra um teste, registre uma avaria "compromete reuso": o carro sai do pool e os testes seguintes viram troca ou impactado.
6. **O uso da frota.** Histograma: carro-semana parado hoje (1.716) × no plano (140).

## Onde está cada coisa

| Arquivo | O que é |
|---|---|
| `docs/01-discovery.md` | Descobertas da entrevista, fonte da verdade do negócio |
| `CONTEXT.md` | Glossário e dores (D1 a D8) |
| `PREMISSAS.md` | Todo número suposto, com ID (MK-xx) |
| `SPEC.md` | Escopo, regras do replanejamento, arquitetura-alvo (diagrama) |
| `ROADMAP.md` | Protótipo → v2 → v3, com valor, risco e camada tocada |
| `docs/mapa-arquitetura.md` | Uma linha por rota e tabela, com SIPOC e credencial |
| `docs/adr/` | Decisões difíceis de reverter |
| `docs/tickets/` | Fatias do protótipo |
| `AI-LOG.md` | Registro do uso de IA, uma das entregas do case |
| [`painel/index.html`](painel/index.html) | Painel de gestão do projeto: decisões, SDLC, tickets, rastreabilidade e prazo. Regenerar: `node painel/gerar.mjs` |
| `backend/domain/motor.py` | O motor de alocação |
| `backend/scripts/gerar_mock.py` | Gera o dado mockado, com semente fixa |

## Estado das fatias

| Fatia | Estado |
|---|---|
| 01 Esqueleto | pronta |
| 02 Motor e baseline | pronta |
| 03 Gantt e comparativo | pronta |
| 04 Replanejar | pronta |
| 04b Avarias | pronta |
| 04c Gestão de projetos | pronta |
| 05 Copiloto | pronta (modo offline até a chave do OpenRouter entrar no `.env`) |
| 05b Supabase | em andamento (adapter e teste prontos; falta o José rodar o schema e pôr a chave) |
| 06a Acabamento visual | pronta |
| 06b README, roadmap e mapa | pronta |
