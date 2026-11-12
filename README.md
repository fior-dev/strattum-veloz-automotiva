# Strattum · case de FDE · Veloz Automotiva

Este repositório guarda o case técnico de Forward Deployed Engineer da Strattum, com apresentação na sexta 13/11/2026.
O cliente é fictício: a Veloz Automotiva quer reduzir a frota de 250 protótipos de um SUV sem atrasar o lançamento.

## Como subir (Windows PowerShell)

Pré-requisitos: [uv](https://docs.astral.sh/uv/) e Node 20 ou mais novo.

```powershell
cd "C:\Users\josefiori\OneDrive\Documentos\1. Pessoal\1. Projetos\Fior\Portfólio\strattum-veloz-automotiva"
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

Abre duas janelas: o backend em http://127.0.0.1:8000/docs (Swagger) e a tela em http://localhost:5173.
Reiniciar o backend volta o plano para a versão 1 do mock.

### Copiloto com LLM (opcional)

Sem chave, o copiloto roda offline e entende só "AER-99 atrasou 2 semanas" e "AER-99 falhou". Para ligar o LLM (LiteLLM → OpenRouter, modelo free):

```powershell
cd backend
Copy-Item .env.example .env
notepad .env   # preencha OPENROUTER_API_KEY e salve
```

Reinicie o backend. A tela mostra o modelo em uso embaixo da caixa do copiloto.
**Trocar para a Anthropic é só o `.env`:** `LLM_MODEL=anthropic/claude-sonnet-5-5`, `LLM_FALLBACKS=` vazio e `ANTHROPIC_API_KEY=...`. Nenhuma linha de código muda (ADR 0003).

Testes: `cd backend; uv run pytest`. Build da tela: `cd frontend; npm run build`.

## Onde está cada coisa

| Arquivo | O que é |
|---|---|
| `docs/01-discovery.md` | Descobertas da entrevista, fonte da verdade do negócio |
| `CONTEXT.md` | Glossário e dores (D1 a D7) |
| `PREMISSAS.md` | Todo número suposto, com ID (MK-xx) |
| `SPEC.md` | Escopo, regras do replanejamento, arquitetura-alvo |
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
| 05b Supabase | — |
| 06 Acabamento e docs | — |
