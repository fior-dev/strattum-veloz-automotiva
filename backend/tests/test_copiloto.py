"""Fatia 5: copiloto com intérprete falso em memória (sem rede, sem LLM). ADR 0003."""
from application.copiloto import Copiloto
from infrastructure.interpretador_offline import InterpretadorOffline
from presentation.container import planejamento, replanejamento


class ContextoFalso:
    def contexto(self):
        return {"glossario": [], "metricas": [], "regras": []}


class InterpretadorQuebrado:
    def interpretar(self, texto, contexto, testes):
        raise TimeoutError("modelo fora do ar")

    def explicar(self, resumo, contexto):
        raise TimeoutError


def copiloto(interp=None):
    planejamento.cache_clear(); replanejamento.cache_clear()
    return Copiloto(replanejamento(), ContextoFalso(), interp or InterpretadorOffline())


def test_texto_vira_evento_e_o_numero_e_o_do_motor():
    r = copiloto().perguntar("O teste AER-99 de vedação na chuva atrasou 2 semanas")
    assert r["evento"] == {"tipo": "atraso", "teste_id": "AER-99", "semanas": 2}
    direto = replanejamento().pendente  # a proposta é a mesma que a tela geraria
    assert [s.teste_id for s in direto.sugestoes] == ["DIN-02"]
    assert "DIN-02" in r["explicacao"]


def test_texto_sem_evento_valido_volta_como_pergunta_e_nao_muda_nada():
    c = copiloto()
    r = c.perguntar("choveu muito ontem")
    assert r["pergunta"] and r["proposta"] is None
    assert replanejamento().pendente is None
    r = c.perguntar("o XYZ-01 atrasou 2 semanas")  # teste que não existe
    assert "XYZ-01" in r["pergunta"]


def test_llm_fora_do_ar_nao_derruba_o_sistema():
    r = copiloto(InterpretadorQuebrado()).perguntar("AER-99 atrasou 2 semanas")
    assert r["proposta"] is None and "fora do ar" in r["pergunta"]
