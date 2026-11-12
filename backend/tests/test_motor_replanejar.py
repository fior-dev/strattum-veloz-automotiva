"""Critérios de aceite do §13 do discovery para `replanejar` (fatias 4 e 4b)."""
from domain.modelo import Alocacao, Avaria, Plano, Teste
from domain.motor import Atraso, Falha, RegistroAvaria, replanejar


def t(id, dur, destrutivo=False, area="Aerodinâmica"):
    return Teste(id=id, area=area, nome=id, duracao=dur, destrutivo=destrutivo)


TESTES = {x.id: x for x in [t("A", 5), t("B", 2, area="Dinâmica veicular"), t("C", 3), t("D", 2, True, "Segurança passiva")]}


def plano(*alocs, reserva=()):
    return Plano(versao=1, alocacoes=list(alocs), reserva=list(reserva), status={k: "planejado" for k in TESTES})


def test_rn05_com_troca():
    # A em P1 até a semana 5; B prometido a P1 na semana 6; P2 livre
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 7), Alocacao("P002", "C", 1, 3))
    prop = replanejar(p, Atraso("A", 1), TESTES)
    assert [(s.teste_id, s.de, s.para) for s in prop.sugestoes] == [("B", "P001", "P002")]
    assert prop.impactados == []
    novo = prop.plano
    assert novo.versao == 2
    assert Alocacao("P001", "A", 1, 6) in novo.alocacoes
    assert Alocacao("P002", "B", 6, 7) in novo.alocacoes
    assert novo.status["A"] == "atrasado"


def test_rn05_sem_troca_lista_impactado_com_area():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 7))
    prop = replanejar(p, Atraso("A", 1), TESTES)
    assert prop.sugestoes == []
    assert [(i.teste_id, i.area) for i in prop.impactados] == [("B", "Dinâmica veicular")]
    assert all(a.teste_id != "B" for a in prop.plano.alocacoes)


def test_rn05_sem_colisao_nao_sugere_nada():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 8, 9), Alocacao("P002", "C", 1, 3))
    prop = replanejar(p, Atraso("A", 1), TESTES)
    assert prop.sugestoes == [] and prop.impactados == []


def test_atraso_de_n_semanas():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 8, 9), Alocacao("P002", "C", 1, 3))
    prop = replanejar(p, Atraso("A", 3), TESTES)  # A vai até a 8: colide com B
    assert Alocacao("P001", "A", 1, 8) in prop.plano.alocacoes
    assert [(s.teste_id, s.para) for s in prop.sugestoes] == [("B", "P002")]


def test_carro_da_reserva_entra_quando_o_plano_nao_tem_livre():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 7), reserva=["P009"])
    prop = replanejar(p, Atraso("A", 1), TESTES)
    assert [(s.teste_id, s.para) for s in prop.sugestoes] == [("B", "P009")]


def test_rn06_atraso_que_passa_da_semana_20_e_impacto():
    p = plano(Alocacao("P001", "A", 15, 19))
    prop = replanejar(p, Atraso("A", 3), TESTES)
    assert [i.teste_id for i in prop.impactados] == ["A"]
    assert "20" in prop.impactados[0].motivo


def test_rn08_nao_destrutivo_que_falha_repete_no_mesmo_carro():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 7), Alocacao("P002", "C", 1, 3))
    prop = replanejar(p, Falha("A"), TESTES)
    assert Alocacao("P001", "A", 6, 10, reteste=True) in prop.plano.alocacoes
    assert [(s.teste_id, s.para) for s in prop.sugestoes] == [("B", "P002")]
    assert prop.plano.status["A"] == "falhou"


def test_rn08_destrutivo_que_falha_vai_para_carro_livre():
    p = plano(Alocacao("P001", "D", 1, 2), Alocacao("P002", "C", 1, 3))
    prop = replanejar(p, Falha("D"), TESTES)
    assert Alocacao("P002", "D", 4, 5, reteste=True) in prop.plano.alocacoes


def test_rn09_avaria_leve_nao_muda_o_plano():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 6, 7))
    prop = replanejar(p, RegistroAvaria(Avaria("P001", "vidro", "leve", 3, "Aerodinâmica")), TESTES)
    assert prop.plano.alocacoes == p.alocacoes
    assert prop.plano.avarias == [Avaria("P001", "vidro", "leve", 3, "Aerodinâmica")]


def test_rn09_avaria_que_compromete_reuso_tira_o_carro_do_pool():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P001", "B", 7, 8), Alocacao("P001", "C", 10, 12),
              Alocacao("P002", "D", 1, 2))
    prop = replanejar(p, RegistroAvaria(Avaria("P001", "lataria", "compromete_reuso", 6, "Aerodinâmica")), TESTES)
    # P2 está destruído pelo D: B e C não têm para onde ir
    assert sorted(i.teste_id for i in prop.impactados) == ["B", "C"]
    assert Alocacao("P001", "A", 1, 5) in prop.plano.alocacoes  # o que já acabou fica


def test_rn09_carro_comprometido_nao_recebe_alocacao_nova():
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P002", "C", 1, 3), Alocacao("P002", "B", 4, 5))
    p.avarias = [Avaria("P001", "pneu", "compromete_reuso", 5, "Aerodinâmica")]
    prop = replanejar(p, Atraso("C", 1), TESTES)  # B colide em P2; P1 está fora do pool
    assert prop.sugestoes == [] and [i.teste_id for i in prop.impactados] == ["B"]


# Achados da revisão independente de 12/11 (Opus 5.5, esforço high)

def test_rn09_reteste_nao_volta_a_carro_fora_do_pool():
    # P001 saiu do pool por avaria; A falha: o reteste não pode ficar em P001 (RN-08, RN-09)
    p = plano(Alocacao("P001", "A", 1, 5), Alocacao("P002", "C", 1, 3))
    p.avarias = [Avaria("P001", "lataria", "compromete_reuso", 5, "Aerodinâmica")]
    prop = replanejar(p, Falha("A"), TESTES)
    assert all(a.prototipo_id != "P001" for a in prop.plano.alocacoes if a.reteste)
    assert [(s.teste_id, s.de, s.para) for s in prop.sugestoes] == [("A", "P001", "P002")]


def test_rn06_reteste_que_nao_cabe_fica_em_nao_cabe():
    p = plano(Alocacao("P001", "A", 15, 19))
    prop = replanejar(p, Falha("A"), TESTES)
    assert [i.teste_id for i in prop.impactados] == ["A"]
    assert [n.teste_id for n in prop.plano.nao_cabe] == ["A"]


def test_rn08_reteste_destrutivo_aparece_na_proposta():
    p = plano(Alocacao("P001", "D", 1, 2), reserva=["P009"])
    prop = replanejar(p, Falha("D"), TESTES)
    assert [(s.teste_id, s.de, s.para, s.inicio) for s in prop.sugestoes] == [("D", "P001", "P009", 3)]
