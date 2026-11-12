"""Composition root: o único lugar que conhece os adapters concretos (ADR 0001).

Trocar JSON por Postgres, ou o LLM, é mexer aqui (por variável de ambiente) e em infrastructure/.
"""
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

from application.copiloto import Copiloto
from application.planejamento import Planejamento, Replanejamento
from infrastructure.contexto_local import ContextoLocal
from infrastructure.interpretador_offline import InterpretadorOffline
from infrastructure.json_repo import JsonPlanoRepository

RAIZ = Path(__file__).resolve().parents[1]
MOCK = RAIZ / "data" / "mock.json"
load_dotenv(RAIZ / ".env")


@lru_cache  # uma instância por processo: o plano em memória vive enquanto o backend roda
def planejamento() -> Planejamento:
    return Planejamento(JsonPlanoRepository(MOCK))


@lru_cache
def replanejamento() -> Replanejamento:
    uc = planejamento()
    return Replanejamento(uc.repo, uc)


def modo_llm() -> str | None:
    """O modelo configurado no .env, se houver chave para ele. Sem chave, o copiloto roda offline."""
    modelo = os.getenv("LLM_MODEL", "")
    chave = {"openrouter/": "OPENROUTER_API_KEY", "anthropic/": "ANTHROPIC_API_KEY"}
    precisa = next((v for k, v in chave.items() if modelo.startswith(k)), None)
    return modelo if modelo and precisa and os.getenv(precisa) else None


@lru_cache
def copiloto() -> Copiloto:
    modelo = modo_llm()
    if modelo:
        from infrastructure.llm_litellm import InterpretadorLiteLLM  # só importa LiteLLM se for usar
        fallbacks = [m for m in os.getenv("LLM_FALLBACKS", "").split(",") if m]
        interpretador = InterpretadorLiteLLM(modelo, fallbacks)
    else:
        interpretador = InterpretadorOffline()
    return Copiloto(replanejamento(), ContextoLocal(RAIZ / "semantic" / "contexto.json"), interpretador)
