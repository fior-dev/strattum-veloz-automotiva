"""Adapter LiteLLM sem rede: mock_response do próprio LiteLLM simula a resposta do modelo."""
from infrastructure.llm_litellm import InterpretadorLiteLLM

CTX = {"glossario": [], "metricas": [], "regras": []}


class Simulado(InterpretadorLiteLLM):
    def __init__(self, resposta):
        super().__init__("openrouter/google/gemma-4-31b-it:free")
        self.resposta = resposta

    def _chamar(self, **kw):
        import litellm
        kw.pop("tools", None); kw.pop("tool_choice", None)
        return litellm.completion(model="gpt-4o-mini", mock_response=self.resposta, **kw)


def test_modelo_que_responde_json_no_texto():
    r = Simulado('Claro: {"tipo": "atraso", "teste_id": "AER-99", "semanas": 2}').interpretar("x", CTX, [])
    assert r == {"tipo": "atraso", "teste_id": "AER-99", "semanas": 2}


def test_resposta_sem_json_vira_pergunta():
    r = Simulado("Qual teste atrasou?").interpretar("x", CTX, [])
    assert r == {"tipo": "pergunta", "pergunta": "Qual teste atrasou?"}


def test_explicar_devolve_o_texto_do_modelo():
    assert Simulado("Mover ELE-01 para o P162.").explicar({"evento": "x"}, CTX) == "Mover ELE-01 para o P162."
