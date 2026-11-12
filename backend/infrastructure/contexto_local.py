"""ContextProvider do protótipo: lê o Semantic Layer em arquivo. Na arquitetura-alvo, é a Strattum (ADR 0004)."""
import json
from pathlib import Path


class ContextoLocal:
    def __init__(self, caminho: Path):
        self._dados = json.loads(Path(caminho).read_text(encoding="utf-8"))

    def contexto(self) -> dict:
        return {k: self._dados[k] for k in ("glossario", "metricas", "regras")}
