"""Ports: os contratos que o domínio exige do mundo de fora (ADR 0001).

Só existe port onde há troca prevista. Os adapters concretos moram em infrastructure/.
"""
from typing import Protocol

from .modelo import Pedido, Plano, Teste


class PlanoRepository(Protocol):
    """Onde moram frota, testes, pedidos e as versões do plano.
    Deixa trocar o JSON do protótipo pelo Postgres (Supabase) sem tocar no motor."""

    def testes(self) -> list[Teste]: ...
    def prototipos(self) -> list[str]: ...
    def pedidos(self) -> list[Pedido]: ...
    def plano(self, versao: int | None = None) -> Plano | None:
        """A versão pedida; sem versão, a mais recente. None se não houver plano."""
    def salvar(self, plano: Plano) -> None: ...
    def versoes(self) -> list[int]: ...


class ContextProvider(Protocol):
    """De onde o copiloto tira o vocabulário e as regras da empresa (Semantic Layer + Context Manager).
    Deixa trocar os arquivos locais do protótipo pela Strattum, sem tocar no caso de uso (ADR 0004)."""

    def contexto(self) -> dict:
        """{"glossario": [...], "metricas": [...], "regras": [...]}"""


class InterpretadorDeImprevisto(Protocol):
    """Quem traduz texto livre em evento e explica o impacto em linguagem de negócio.
    Deixa trocar o modelo (OpenRouter, Anthropic, modelo próprio) mexendo só no .env (ADR 0003)."""

    def interpretar(self, texto: str, contexto: dict, testes: list[dict]) -> dict:
        """{"tipo": "atraso"|"falha"|"pergunta", "teste_id": str, "semanas": int, "pergunta": str}"""

    def explicar(self, resumo: dict, contexto: dict) -> str: ...
