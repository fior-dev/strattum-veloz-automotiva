"""Critérios de aceite do §13 do discovery para o motor `planejar` (fatia 2)."""
import pytest

from domain.modelo import Teste, MockInvalido, validar_testes
from domain.motor import planejar, cabe

FROTA = [f"P{i:03d}" for i in range(1, 11)]


def t(id, dur, destrutivo=False, area="Aerodinâmica"):
    return Teste(id=id, area=area, nome=id, duracao=dur, destrutivo=destrutivo)


def sem_sobreposicao(plano):
    por_carro = {}
    for a in plano.alocacoes:
        semanas = por_carro.setdefault(a.prototipo_id, set())
        faixa = set(range(a.inicio, a.fim + 1))
        assert not semanas & faixa, f"RN-02 violada em {a.prototipo_id}"
        semanas |= faixa


def test_rn01_qualquer_prototipo_livre_recebe_qualquer_teste():
    plano = planejar([t("A", 3, area="Elétrica/Eletrônica"), t("B", 3, area="Segurança passiva")], FROTA)
    # os dois cabem no mesmo carro, um depois do outro: o carro é de qualquer área
    assert {a.prototipo_id for a in plano.alocacoes} == {"P001"}


def test_rn02_um_carro_um_teste_por_semana():
    plano = planejar([t(f"T{i}", 4) for i in range(12)], FROTA)
    sem_sobreposicao(plano)


def test_rn02_cabe_recusa_sobreposicao():
    testes = {"A": t("A", 3)}
    from domain.modelo import Alocacao
    ocupado = [Alocacao("P001", "A", 3, 5)]
    assert not cabe(ocupado, 4, 4, False, testes)
    assert cabe(ocupado, 6, 6, False, testes)


def test_rn03_carro_liberado_recebe_teste_de_outra_area():
    plano = planejar([t("A", 6, area="Mecânica/Powertrain"), t("B", 2, area="Aerodinâmica")], ["P001"])
    b = next(a for a in plano.alocacoes if a.teste_id == "B")
    assert b.prototipo_id == "P001" and b.inicio == 7


def test_rn04_destrutivo_e_o_ultimo_e_unico():
    from domain.modelo import Alocacao
    testes = {"D": t("D", 2, destrutivo=True)}
    ocupado = [Alocacao("P001", "D", 8, 9)]
    assert not cabe(ocupado, 10, 10, False, testes)  # nada depois do destrutivo
    assert not cabe(ocupado, 1, 2, True, testes)  # segundo destrutivo recusado
    assert cabe(ocupado, 5, 7, False, testes)  # não destrutivo até a semana 7
    assert not cabe(ocupado, 6, 8, False, testes)


def test_rn04_no_plano_destrutivo_fica_no_fim_do_carro():
    testes = [t("N1", 5), t("N2", 4), t("D1", 3, True), t("D2", 2, True)]
    plano = planejar(testes, FROTA)
    for d in [a for a in plano.alocacoes if a.teste_id.startswith("D")]:
        depois = [a for a in plano.alocacoes if a.prototipo_id == d.prototipo_id and a.inicio > d.fim]
        assert depois == []
    carros_com_destrutivo = [a.prototipo_id for a in plano.alocacoes if a.teste_id.startswith("D")]
    assert len(carros_com_destrutivo) == len(set(carros_com_destrutivo))


def test_rn06_teste_que_passa_da_semana_20_nao_cabe():
    plano = planejar([t("LONGO", 21), t("OK", 2)], FROTA)
    assert [n.teste_id for n in plano.nao_cabe] == ["LONGO"]
    assert "20" in plano.nao_cabe[0].motivo
    assert all(a.teste_id != "LONGO" for a in plano.alocacoes)


def test_rn06_frota_esgotada_vira_nao_cabe():
    plano = planejar([t("A", 20), t("B", 20)], ["P001"])
    assert [n.teste_id for n in plano.nao_cabe] == ["B"]


def test_so_abre_carro_novo_quando_nenhum_serve():
    plano = planejar([t("A", 10), t("B", 10), t("C", 10)], FROTA)
    assert sorted({a.prototipo_id for a in plano.alocacoes}) == ["P001", "P002"]


def test_rf02_deterministico():
    testes = [t(f"T{i}", 1 + i % 6, destrutivo=i % 7 == 0) for i in range(40)]
    assert planejar(testes, FROTA) == planejar(list(reversed(testes)), FROTA)


def test_rf01_mock_invalido_recusado_com_o_item():
    with pytest.raises(MockInvalido, match="T2"):
        validar_testes([{"id": "T1", "area": "Aerodinâmica", "nome": "x", "duracao": 2, "destrutivo": False},
                        {"id": "T2", "area": "Aerodinâmica", "nome": "x", "duracao": 0, "destrutivo": False}])
    with pytest.raises(MockInvalido, match="area"):
        validar_testes([{"id": "T1", "nome": "x", "duracao": 2, "destrutivo": False}])
