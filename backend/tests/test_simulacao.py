"""Ticket 10: memória de cálculo, simulação (só leitura) e plano refeito com outra meta ou com o destrutivo no fim."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from domain.gestao import memoria, simular
from domain.modelo import Pedido, validar_testes
from domain.motor import EventoInvalido, cabe, planejar

MOCK = json.loads((Path(__file__).resolve().parents[1] / "data" / "mock.json").read_text(encoding="utf-8"))
TESTES = validar_testes(MOCK["testes"])
POR_ID = {t.id: t for t in TESTES}
FROTA = MOCK["prototipos"]
PEDIDOS = [Pedido(p["area"], p["carros"], p["semanas"]) for p in MOCK["pedidos"]]


def test_memoria_fecha_a_conta_do_plano_padrao():
    m = memoria(planejar(TESTES, FROTA), POR_ID)
    assert (m["carros"], m["semanas"], m["piso"], m["destrutivos"]) == (161, 20, 107, 65)
    assert (m["em_teste"], m["destruido"], m["vazio"]) == (2139, 1081, 0)
    assert m["carros"] >= m["piso"]


def test_destrutivo_no_fim_chega_ao_piso_sem_quebrar_as_regras():
    p = planejar(TESTES, FROTA, destrutivo_no_fim=True)
    assert len(p.prototipos()) == 107 and not p.nao_cabe and len(p.alocacoes) == len(TESTES)
    carros = {}
    for a in p.alocacoes:
        carros.setdefault(a.prototipo_id, []).append(a)
    for alocs in carros.values():
        for a in alocs:  # RN-02 e RN-04: sem sobreposição, um destrutivo por carro, e ele é o último
            assert cabe([x for x in alocs if x != a], a.inicio, a.fim, POR_ID[a.teste_id].destrutivo, POR_ID)
            if POR_ID[a.teste_id].destrutivo:
                assert a.fim == 20
    assert memoria(p, POR_ID)["destruido"] == 0


def test_simulacao_com_tudo_no_padrao_repete_os_numeros_da_tela():
    s = simular(TESTES, PEDIDOS, FROTA, 125, 20, False, 0.10)
    assert (s["testes"], s["pedidos"], s["carros_plano"], s["carros_reserva"], s["folga_projeto"]) == (625, 245, 161, 7, 0)


def test_simulacao_menos_testes_pede_menos_carros_e_meta_menor_pede_mais():
    base = simular(TESTES, PEDIDOS, FROTA, 125, 20, False, 0.10)
    menos = simular(TESTES, PEDIDOS, FROTA, 50, 20, False, 0.10)
    assert menos["testes"] == 250 and menos["carros_plano"] < base["carros_plano"] and menos["pedidos"] < base["pedidos"]
    meta18 = simular(TESTES, PEDIDOS, FROTA, 125, 18, False, 0.10)
    assert (meta18["carros_plano"], meta18["folga_projeto"]) == (172, 2)


@pytest.fixture
def cliente(monkeypatch):
    monkeypatch.setenv("DATA_BACKEND", "json")
    from presentation import container
    container.planejamento.cache_clear()
    container.replanejamento.cache_clear()
    from presentation.api import app
    yield TestClient(app)
    container.planejamento.cache_clear()
    container.replanejamento.cache_clear()


def test_api_simular_nao_muda_o_plano_e_regerar_cria_a_versao_seguinte(cliente):
    assert cliente.get("/api/simular", params={"meta": 18}).json()["carros_plano"] == 172
    assert cliente.get("/api/plano").json()["versao"] == 1
    assert cliente.post("/api/plano/regerar", json={"meta": 18, "folga": 0.1}).json() == {"versao": 2}
    g = cliente.get("/api/gestao").json()
    assert (g["fim_plano"], g["folga_projeto"], g["sinal"], g["memoria"]["carros"]) == (18, 2, "amarelo", 172)
    assert g["custos"] == {"carro": 1.25, "preco_suv": 0.15, "suvs_semana": 1000} and g["custo_frota"] == 179 * 1.25  # MK-10 e MK-11


def test_ticket11_carros_da_proposta_e_marcacao_de_folga(cliente):
    g = cliente.get("/api/gestao").json()
    assert len(g["carros_com_folga"]) == 65 and sum(v > 0 for v in g["folgas"].values()) == 72
    assert [c["meta"] for c in g["curva_meta"]] == [20, 19, 18, 17, 16]
    # atraso de um destrutivo, último do carro: proposta sem troca, mas o carro do evento vem na lista
    destrutivo = next(t["id"] for t in MOCK["testes"] if t["destrutivo"])
    p = cliente.post("/api/status", json={"teste_id": destrutivo, "status": "atrasado", "semanas": 1}).json()["proposta"]
    assert not p["sugestoes"] and len(p["carros"]) >= 1
    cliente.post("/api/proposta/recusar")
    p = cliente.post("/api/status", json={"teste_id": "AER-99", "status": "atrasado", "semanas": 2}).json()["proposta"]
    assert p["carros"] == ["P006", "P162"]
    cliente.post("/api/proposta/recusar")
    # plano aceito além do marco: nenhum carro é marcado como tendo folga
    cliente.post("/api/status", json={"teste_id": "AER-11", "status": "atrasado", "semanas": 2})
    assert cliente.post("/api/proposta/aceitar", params={"estourar": "true"}).status_code == 200
    g = cliente.get("/api/gestao").json()
    assert g["folga_projeto"] < 0 and g["carros_com_folga"] == []
    assert cliente.get("/api/plano", params={"versao": 1}).json()["semana_fim"] == 20  # a v1 fica para consulta


def test_rn07_regerar_e_recusado_com_proposta_pendente(cliente):
    cliente.post("/api/status", json={"teste_id": "AER-99", "status": "atrasado", "semanas": 2})
    r = cliente.post("/api/plano/regerar", json={"meta": 18})
    assert r.status_code == 422 and "proposta" in r.json()["detail"]
    assert cliente.get("/api/simular", params={"meta": 15}).status_code == 422  # fora da faixa da tela
    assert cliente.get("/api/simular", params={"folga": 0.1234}).status_code == 422  # só os passos da tela: o cache não é furado
    assert cliente.get("/api/simular", params={"por_area": 30}).status_code == 422
    assert cliente.get("/api/simular", params={"folga": 0.15, "por_area": 50}).status_code == 200


def test_rn09_regerar_e_recusado_se_ha_carro_fora_da_frota_por_avaria(cliente):
    cliente.post("/api/avarias", json={"prototipo_id": "P006", "tipo": "vidro", "gravidade": "compromete_reuso", "semana": 5, "area": "Aerodinâmica"})
    assert cliente.post("/api/proposta/aceitar").status_code == 200
    r = cliente.post("/api/plano/regerar", json={"meta": 18})
    assert r.status_code == 422 and "P006" in r.json()["detail"]
