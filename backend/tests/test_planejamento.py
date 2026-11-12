"""Casos de uso com repositório falso em memória (sem arquivo, sem rede), e a API sobre o mock real."""
from fastapi.testclient import TestClient

from application.planejamento import Planejamento
from domain.modelo import Pedido, Teste


class RepoFalso:
    def __init__(self, testes, prototipos, pedidos):
        self._t, self._p, self._ped, self.planos = testes, prototipos, pedidos, {}

    def testes(self): return self._t
    def prototipos(self): return self._p
    def pedidos(self): return self._ped
    def plano(self, versao=None):
        return self.planos.get(versao if versao is not None else max(self.planos)) if self.planos else None
    def salvar(self, plano): self.planos[plano.versao] = plano
    def versoes(self): return sorted(self.planos)


def uc():
    testes = [Teste(f"D{i}", "Segurança passiva", "Crash", 2, True) for i in range(10)] + \
             [Teste("N1", "Aerodinâmica", "Túnel", 3, False)]
    pedidos = [Pedido("Segurança passiva", 15, 10), Pedido("Aerodinâmica", 3, 12)]
    return Planejamento(RepoFalso(testes, [f"P{i:03d}" for i in range(1, 51)], pedidos))


def test_rf03_como_hoje_e_a_soma_dos_pedidos():
    c = uc().comparativo()
    assert c["como_hoje"]["carros"] == 18
    assert c["como_hoje"]["semana_fim"] == 12
    assert c["proposto"]["carros"] == c["proposto"]["carros_plano"] + c["proposto"]["carros_reserva"]


def test_folga_muda_a_reserva_e_nao_o_plano():
    caso = uc()
    antes = caso.plano().alocacoes
    caso.ajustar_folga(0.0)
    assert caso.comparativo()["proposto"]["carros_reserva"] == 0
    caso.ajustar_folga(0.25)  # 25% de 10 destrutivos = 2,5 → 3 carros
    assert caso.comparativo()["proposto"]["carros_reserva"] == 3
    assert caso.plano().alocacoes == antes
    assert not set(caso.plano().reserva) & set(caso.plano().prototipos())


def test_api_sobre_o_mock():
    from presentation.api import app
    cliente = TestClient(app)
    plano = cliente.get("/api/plano").json()
    assert plano["versao"] == 1 and plano["alocacoes"] and not plano["nao_cabe"]
    comp = cliente.get("/api/comparativo").json()
    assert comp["como_hoje"]["carros"] == 245  # soma dos pedidos do mock (MK-03)
    assert comp["proposto"]["carros"] < comp["como_hoje"]["carros"]
    assert cliente.put("/api/folga", json={"folga": 0.5}).status_code == 422
