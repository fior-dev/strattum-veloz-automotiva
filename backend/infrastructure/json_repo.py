"""Adapter do PlanoRepository: lê o mock JSON e guarda as versões do plano em memória (ADR 0006).

Reiniciar o backend volta ao mock: a demo fica reproduzível.
"""
import json
from pathlib import Path

from domain.modelo import Pedido, Plano, validar_testes


class JsonPlanoRepository:
    def __init__(self, caminho: Path):
        dados = json.loads(Path(caminho).read_text(encoding="utf-8"))
        self._testes = validar_testes(dados["testes"])  # RF-01
        self._prototipos = list(dados["prototipos"])
        self._pedidos = [Pedido(p["area"], p["carros"], p["semanas"]) for p in dados["pedidos"]]
        self._planos: dict[int, Plano] = {}

    def testes(self):
        return self._testes

    def prototipos(self):
        return self._prototipos

    def pedidos(self):
        return self._pedidos

    def plano(self, versao=None):
        if not self._planos:
            return None
        return self._planos.get(versao if versao is not None else max(self._planos))

    def salvar(self, plano):
        self._planos[plano.versao] = plano

    def versoes(self):
        return sorted(self._planos)
