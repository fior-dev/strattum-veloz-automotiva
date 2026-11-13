# Strattum · case de FDE · Veloz Automotiva

Este repositório guarda o case técnico de Forward Deployed Engineer da Strattum, com apresentação na sexta 13/11/2026.
O cliente é fictício: a Veloz Automotiva quer reduzir a frota de 250 protótipos de um SUV sem atrasar o lançamento.

## Apresentação

- **Deck da apresentação à Strattum (13/11):** [Protótipo Veloz Automotiva](https://claude.ai/artifact/UEPz8WSuFAwW2qxCzZY38g), feito no Claude Design.
- **Gestão do projeto Veloz:** [painel publicado](https://fior-dev.github.io/strattum-veloz-automotiva/) com as decisões, os tickets, os testes e o prazo, da entrevista à entrega. É o `painel/index.html`, gerado a partir deste repositório.

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

1. **O número.** Passos 1 a 3 da tela: pedidos por área, 245 carros até a semana 14; plano compartilhado, 168 carros até a semana 20 (−31%). A semana 14 dos pedidos é suposição (MK-03b); o programa tem 20 semanas até o lançamento. Terminando o programa na mesma semana 14, o plano compartilhado pede 209 carros (202 + 7), 14,7% a menos (medido com `planejar(..., horizonte=14)`; a tela simula de 16 a 20). A folga de reteste está à vista e o controle deslizante muda só a reserva.
2. **O que segura o lançamento.** Bloco "Simule antes de decidir": 553 de 625 testes não têm folga; o plano troca folga de prazo por carros. A simulação mostra o preço de adiantar o fim, em carros e em dinheiro.
3. **O imprevisto.** Busque `AER-99` → "Atrasou" → +2 semanas. O sistema propõe mover o ELE-01 do P006 para o P162, da folga, e diz que o marco não se move. Clique em **Recusar**: o plano fica na versão 1. (A decisão é do gerente da coordenação, RN-07.)
4. **O copiloto.** Na caixa de texto, escreva "o AER-99 atrasou duas semanas por causa da chuva". A proposta é a mesma do passo 3: o LLM só traduz a frase, quem calcula é o motor. Agora clique em **Aceitar**: nasce a versão 2, e a versão 1 continua para consulta no seletor de versão.
5. **A avaria.** Abra um teste, registre uma avaria "compromete reuso": o carro sai do pool e os testes seguintes viram troca ou impactado.
6. **O uso da frota.** Histograma: carro-semana parado hoje (1.716) × no plano (140).

## Onde está cada coisa

| Arquivo | O que é |
|---|---|
| `docs/01-discovery.md` | Descobertas da entrevista, fonte da verdade do negócio |
| `docs/prompt-execucao.md` | O prompt que dirigiu a execução, com os 15 ajustes do José |
| `CONTEXT.md` | Glossário e dores (D1 a D8) |
| `PREMISSAS.md` | Todo número suposto, com ID (MK-xx) |
| `SPEC.md` | Escopo, regras do replanejamento, arquitetura-alvo (diagrama) |
| `ROADMAP.md` | Protótipo → v2 → v3, com valor, risco e camada tocada |
| `docs/mapa-arquitetura.md` | Uma linha por rota e tabela, com SIPOC e credencial |
| `docs/adr/` | Decisões difíceis de reverter |
| `docs/tickets/` | Fatias do protótipo |
| `AI-LOG.md` | Registro do uso de IA, uma das entregas do case |
| [`painel/index.html`](painel/index.html) | Gestão do projeto Veloz: decisões, SDLC, tickets, rastreabilidade e prazo. Publicado no GitHub Pages. Regenerar: `node painel/gerar.mjs` |
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
| 05 Copiloto | pronta (com LLM pelo OpenRouter; sem chave, roda offline) |
| 05b Supabase | pronta (adapter, schema e seed; passa nos mesmos testes do JSON) |
| 06a Acabamento visual | pronta |
| 06b README, roadmap e mapa | pronta |
| 07 Aceite que passa do marco | pronta |
| 08 Publicar para a avaliação | pronta (contêiner no repo; a demo está no ar por túnel, com login por e-mail) |
| 09 Ajustes da revisão dos documentos | pronta |
| 10 Memória de cálculo e simulação | pronta |
| 11 Ajustes do teste na tela | pronta |
