"""Composition root: o único lugar que conhece os adapters concretos (ADR 0001).

Trocar JSON por Postgres, ou o LLM, é mexer aqui e em infrastructure/.
"""
from functools import lru_cache
from pathlib import Path

from application.planejamento import Planejamento, Replanejamento
from infrastructure.json_repo import JsonPlanoRepository

MOCK = Path(__file__).resolve().parents[1] / "data" / "mock.json"


@lru_cache  # uma instância por processo: o plano em memória vive enquanto o backend roda
def planejamento() -> Planejamento:
    return Planejamento(JsonPlanoRepository(MOCK))


@lru_cache
def replanejamento() -> Replanejamento:
    uc = planejamento()
    return Replanejamento(uc.repo, uc)
