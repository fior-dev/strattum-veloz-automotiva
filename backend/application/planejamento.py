"""Casos de uso do planejamento. Recebem a port pelo construtor (ADR 0001)."""
from dataclasses import replace

from domain.folga import FOLGA_PADRAO, carros_de_reserva, comparar
from domain.modelo import Plano
from domain.motor import planejar
from domain.ports import PlanoRepository


class Planejamento:
    def __init__(self, repo: PlanoRepository):
        self.repo = repo

    def gerar_plano(self, folga: float = FOLGA_PADRAO) -> Plano:
        """Gera a versão 1 a partir dos testes e da frota, e guarda."""
        plano = planejar(self.repo.testes(), self.repo.prototipos())
        plano.reserva = carros_de_reserva(plano, self.repo.prototipos(), self.repo.testes(), folga)
        self.repo.salvar(plano)
        return plano

    def plano(self, versao: int | None = None) -> Plano | None:
        return self.repo.plano(versao) or (self.gerar_plano() if versao is None else None)

    def ajustar_folga(self, folga: float) -> Plano:
        """Muda só a reserva da versão atual; as alocações não mudam."""
        if not 0 <= folga <= 0.3:
            raise ValueError("A folga de reteste vai de 0% a 30%")
        atual = self.plano()
        novo = replace(atual, reserva=carros_de_reserva(atual, self.repo.prototipos(), self.repo.testes(), folga))
        self.repo.salvar(novo)
        return novo

    def comparativo(self) -> dict:
        return comparar(self.plano(), self.repo.pedidos(), self.repo.testes())
