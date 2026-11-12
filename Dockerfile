# Ticket 08: um contêiner serve a tela e a API na mesma porta.
# Uma instância e um worker: a proposta pendente e (com DATA_BACKEND=json) as versões do plano vivem na memória do processo.
# Chaves só em tempo de execução (--env-file ou variáveis do host), nunca na imagem (.dockerignore).

FROM node:22-alpine AS tela
WORKDIR /tela
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /bin/uv
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/ ./
COPY --from=tela /tela/dist /app/tela
ENV TELA_DIR=/app/tela PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uv run --no-dev uvicorn presentation.api:app --host 0.0.0.0 --port ${PORT}"]
