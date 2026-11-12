# 01 · Esqueleto andando pelas quatro camadas

Dor: D2 · Depende de: — · Estimativa: 1h

## O quê
Um caso de uso `ver_plano` devolve um plano fixo lido por um `JsonPlanoRepository` injetado no `container.py`. A rota `GET /plano` o expõe. A SPA mostra a tabela.

## Aceite
- [ ] `uv run pytest` passa, com `test_fronteira.py`: `domain/` e `application/` só importam a biblioteca padrão e o próprio pacote.
- [ ] Swagger em `http://localhost:8000/docs`.
- [ ] A SPA em `http://localhost:5173` mostra as alocações vindas da API.
- [ ] README com o comando PowerShell para subir os dois, testado.
