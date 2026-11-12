"""Contrato do PlanoRepository: o JSON e o Supabase se comportam igual (ticket 05b).

O Supabase só roda com SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente; apaga e regrava os planos do projeto.
"""
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv

from application.planejamento import Planejamento, Replanejamento
from infrastructure.json_repo import JsonPlanoRepository

RAIZ = Path(__file__).resolve().parents[1]
load_dotenv(RAIZ / ".env")


def _json():
    return JsonPlanoRepository(RAIZ / "data" / "mock.json")


def _supabase():
    if not (os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SECRET_KEY")):
        pytest.skip("sem SUPABASE_URL e SUPABASE_SECRET_KEY")
    from infrastructure.supabase_repo import SupabasePlanoRepository
    repo = SupabasePlanoRepository(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
    repo.apagar_planos()
    return repo


@pytest.fixture(params=["json", "supabase"])
def repo(request):
    return _json() if request.param == "json" else _supabase()


def test_mesmos_dados_de_entrada(repo):
    ref = _json()
    def ord(xs, k): return sorted(xs, key=k)  # o Supabase devolve em ordem de chave; o mock não
    assert ord(repo.testes(), lambda t: t.id) == ord(ref.testes(), lambda t: t.id)
    assert sorted(repo.prototipos()) == sorted(ref.prototipos())
    assert ord(repo.pedidos(), lambda p: p.area) == ord(ref.pedidos(), lambda p: p.area)


def test_cenario_da_demo_igual_nos_dois(repo):
    plan = Planejamento(repo)
    v1 = plan.plano()
    assert repo.versoes() == [1] and repo.plano(1) == v1
    plan.ajustar_folga(0.2)  # regrava a mesma versão
    assert repo.versoes() == [1] and repo.plano().reserva != v1.reserva
    rep = Replanejamento(repo, plan)
    proposta = rep.mudar_status("AER-99", "atrasado", 2)
    assert [(s.teste_id, s.de, s.para) for s in proposta.sugestoes] == [("DIN-02", "P006", "P162")]
    rep.aceitar()
    assert repo.versoes() == [1, 2] and repo.plano().versao == 2
    assert repo.plano(2) == proposta.plano
