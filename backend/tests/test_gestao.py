"""Ticket 04c: caminho crítico pela cadeia do carro, marco, impacto no marco e uso da frota (ADR 0007)."""
from domain.gestao import folgas, impacto_no_marco, resumo_marco, uso_por_semana
from domain.modelo import Alocacao, Plano, Teste
from domain.motor import Atraso, replanejar


def t(id, dur, destrutivo=False):
    return Teste(id=id, area="Aerodinâmica", nome=id, duracao=dur, destrutivo=destrutivo)


TESTES = {x.id: x for x in [t("A", 5), t("B", 3), t("C", 2), t("D", 2, True), t("E", 4)]}


def plano(*alocs, reserva=()):
    return Plano(versao=1, alocacoes=list(alocs), reserva=list(reserva), status={})


# P001: A 1-5, B 6-8, D 9-10 (destrutivo)  -> a cadeia acaba na 10, que é o fim do plano
# P002: C 1-2, E 3-6                        -> a cadeia acaba na 6
P = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 8), Alocacao("P001", "D", 9, 10),
          Alocacao("P002", "C", 1, 2), Alocacao("P002", "E", 3, 6))


def test_fim_do_plano_e_a_maior_semana_de_fim():
    assert resumo_marco(P, TESTES)["fim_plano"] == 10


def test_folga_da_cadeia_inteira_e_fim_do_plano_menos_fim_da_cadeia():
    f = folgas(P)
    assert f["C"] == f["E"] == 4  # 10 - 6


def test_critico_e_folga_zero():
    f = folgas(P)
    assert f["A"] == f["B"] == f["D"] == 0
    assert resumo_marco(P, TESTES)["criticos"] == 3


def test_folga_do_projeto_e_marco_menos_fim_do_plano():
    r = resumo_marco(P, TESTES, marco=20)
    assert r["folga_projeto"] == 10
    assert r["sinal"] == "verde"
    assert resumo_marco(plano(Alocacao("P001", "A", 16, 20)), TESTES)["sinal"] == "vermelho"
    assert resumo_marco(plano(Alocacao("P001", "A", 14, 18)), TESTES)["sinal"] == "amarelo"


def test_impacto_atraso_fora_do_caminho_critico_nao_move_o_marco():
    prop = replanejar(P, Atraso("C", 2), TESTES)  # C vai a 1-4: E colide e muda de carro
    imp = impacto_no_marco(P, prop.plano, "C")
    assert imp == {"fim_antes": 10, "fim_depois": 10, "semanas_consumidas": 0, "folga_projeto_antes": 10,
                   "folga_projeto_depois": 10, "estava_no_caminho_critico": False}


def test_impacto_atraso_que_move_o_fim():
    prop = replanejar(P, Atraso("D", 3), TESTES)  # D é o último: o fim vai para 13
    imp = impacto_no_marco(P, prop.plano, "D")
    assert imp["fim_depois"] == 13 and imp["semanas_consumidas"] == 3 and imp["estava_no_caminho_critico"]


def test_uso_da_frota_por_semana_separa_em_uso_parado_e_destruido():
    semanas = uso_por_semana(P, TESTES, frota=3)  # P001, P002 e um carro parado o tempo todo
    assert semanas[0] == {"semana": 1, "em_uso": 2, "parados": 1, "fora": 0}
    assert semanas[7] == {"semana": 8, "em_uso": 1, "parados": 2, "fora": 0}
    assert semanas[10] == {"semana": 11, "em_uso": 0, "parados": 2, "fora": 1}  # P001 destruído pelo D


def test_cenario_da_demo_aer99_e_critico_e_a_troca_segura_o_marco():
    """AER-99 está no caminho crítico (P006 termina na semana 20), mas a troca para um carro da folga segura a data."""
    import json
    from pathlib import Path
    from domain.motor import planejar
    from domain.folga import carros_de_reserva
    d = json.loads((Path(__file__).parents[1] / "data" / "mock.json").read_text(encoding="utf-8"))
    ts = [Teste(**x) for x in d["testes"]]
    p = planejar(ts, d["prototipos"])
    p.reserva = carros_de_reserva(p, d["prototipos"], ts, 0.10)
    prop = replanejar(p, Atraso("AER-99", 2), {x.id: x for x in ts})
    imp = impacto_no_marco(p, prop.plano, "AER-99")
    assert imp["estava_no_caminho_critico"] and imp["semanas_consumidas"] == 0
