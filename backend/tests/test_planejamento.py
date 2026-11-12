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


def test_api_cenario_da_demo_atraso_aceite_e_versao_antiga():
    from presentation.api import app
    from presentation.container import planejamento, replanejamento
    planejamento.cache_clear(); replanejamento.cache_clear()
    c = TestClient(app)
    r = c.post("/api/status", json={"teste_id": "AER-99", "status": "atrasado", "semanas": 2}).json()["proposta"]
    assert [(s["teste_id"], s["de"]) for s in r["sugestoes"]] == [("DIN-02", "P006")]
    assert r["marco"]["estava_no_caminho_critico"] and r["marco"]["semanas_consumidas"] == 0
    g = c.get("/api/gestao").json()
    assert g["fim_plano"] == 20 and g["sinal"] == "vermelho" and len(g["uso"]["plano"]) == 20
    assert g["curva_meta"][0] == {"meta": 20, "carros": 161, "folga_projeto": 0, "nao_cabe": 0}
    assert c.get("/api/plano").json()["versao"] == 1  # nada muda antes do aceite (RN-07)
    assert c.post("/api/proposta/aceitar").json()["versao"] == 2
    v2 = c.get("/api/plano").json()
    assert v2["status"]["AER-99"] == "atrasado"
    v1 = c.get("/api/plano?versao=1").json()  # RF-06: a versão 1 continua consultável
    assert {"prototipo_id": "P006", "teste_id": "DIN-02", "inicio": 13, "fim": 18, "reteste": False} in v1["alocacoes"]
    assert c.post("/api/proposta/aceitar").status_code == 422  # sem proposta pendente
    assert c.post("/api/status", json={"teste_id": "NAO-EXISTE", "status": "falhou"}).status_code == 422
    leve = c.post("/api/avarias", json={"prototipo_id": "P001", "tipo": "vidro", "gravidade": "leve", "semana": 3, "area": "Aerodinâmica"})
    assert leve.json()["proposta"] is None and c.get("/api/plano").json()["avarias"]


def test_rn07_avaria_leve_nao_apaga_proposta_pendente():
    from application.planejamento import Replanejamento
    from domain.modelo import Avaria
    caso = uc()
    rep = Replanejamento(caso.repo, caso)
    alvo = caso.plano().alocacoes[0]
    rep.mudar_status(alvo.teste_id, "atrasado", 1)
    pendente = rep.pendente
    rep.registrar_avaria(Avaria(alvo.prototipo_id, "vidro", "leve", 1, "Aerodinâmica"))
    assert rep.pendente is pendente  # a proposta continua esperando o gerente
    assert caso.repo.versoes() == [1] and caso.plano().avarias  # leve fica no plano atual, sem versão nova


def test_rn07_avaria_leve_e_status_sobrevivem_ao_aceite_da_proposta_pendente():
    from application.planejamento import Replanejamento
    from domain.modelo import Avaria
    caso = uc()
    rep = Replanejamento(caso.repo, caso)
    alvo, outro = caso.plano().alocacoes[0], caso.plano().alocacoes[-1]
    rep.mudar_status(alvo.teste_id, "atrasado", 1)
    rep.registrar_avaria(Avaria(alvo.prototipo_id, "vidro", "leve", 1, "Aerodinâmica"))
    rep.mudar_status(outro.teste_id, "concluido")
    rep.aceitar()
    assert caso.plano().versao == 2
    assert caso.plano().avarias == [Avaria(alvo.prototipo_id, "vidro", "leve", 1, "Aerodinâmica")]
    assert caso.plano().status[outro.teste_id] == "concluido"
