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
