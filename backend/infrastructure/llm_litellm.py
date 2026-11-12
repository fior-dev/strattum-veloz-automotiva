"""Model Gateway do protótipo: LiteLLM → OpenRouter (ADR 0003).

Trocar de modelo ou de provedor é só o .env: LLM_MODEL=anthropic/claude-sonnet-5-5 e ANTHROPIC_API_KEY=...
"""
import json

import litellm

FERRAMENTA = {
    "type": "function",
    "function": {
        "name": "registrar_evento",
        "description": "Registra o que aconteceu com um teste, para o motor replanejar. Não calcula alocação.",
        "parameters": {
            "type": "object",
            "properties": {
                "tipo": {"type": "string", "enum": ["atraso", "falha", "pergunta"],
                         "description": "atraso: vai terminar N semanas depois; falha: reprovou e repete; pergunta: falta informação"},
                "teste_id": {"type": "string", "description": "ID exato do teste, como AER-99"},
                "semanas": {"type": "integer", "minimum": 1, "description": "Só para atraso"},
                "pergunta": {"type": "string", "description": "Só para tipo pergunta: o que perguntar à coordenação, em português"},
            },
            "required": ["tipo"],
        },
    },
}


def _json_do_texto(texto: str) -> dict | None:
    inicio, fim = texto.find("{"), texto.rfind("}")
    if inicio < 0 or fim < inicio:
        return None
    try:
        return json.loads(texto[inicio:fim + 1])
    except json.JSONDecodeError:
        return None


class InterpretadorLiteLLM:
    def __init__(self, modelo: str, fallbacks: list[str] | None = None, timeout: int = 40):
        self.modelo, self.fallbacks, self.timeout = modelo, fallbacks or [], timeout

    def _chamar(self, **kw):
        return litellm.completion(model=self.modelo, fallbacks=self.fallbacks, timeout=self.timeout, temperature=0, **kw)

    def interpretar(self, texto: str, contexto: dict, testes: list[dict]) -> dict:
        catalogo = "\n".join(f"{t['id']}: {t['nome']} ({t['area']})" for t in testes)
        sistema = (
            "Você é o copiloto de replanejamento da coordenação de projetos da Veloz Automotiva. "
            "Sua única tarefa é transformar a mensagem num evento, chamando registrar_evento. "
            "Você nunca calcula alocação de carros: isso é do motor. "
            "Se não der para saber qual teste é, ou se é atraso ou falha, use tipo pergunta.\n\n"
            f"Contexto da empresa (Semantic Layer): {json.dumps(contexto, ensure_ascii=False)}\n\n"
            f"Testes do plano:\n{catalogo}"
        )
        r = self._chamar(messages=[{"role": "system", "content": sistema}, {"role": "user", "content": texto}],
                         tools=[FERRAMENTA], tool_choice="auto")
        msg = r.choices[0].message
        if msg.tool_calls:
            return json.loads(msg.tool_calls[0].function.arguments)
        # modelo que responde o JSON no texto em vez de chamar a ferramenta
        return _json_do_texto(msg.content or "") or {
            "tipo": "pergunta", "pergunta": msg.content or "Não entendi. Diga o ID do teste e o que aconteceu."}

    def explicar(self, resumo: dict, contexto: dict) -> str:
        r = self._chamar(messages=[
            {"role": "system", "content": "Explique à coordenação de projetos, em português e em até 4 frases curtas, o que o "
                                          "replanejamento propõe. Use só os números do resumo; não invente nenhum. Termine dizendo "
                                          "que nada muda até o gerente da coordenação aceitar. Vocabulário: "
                                          + json.dumps(contexto["glossario"], ensure_ascii=False)},
            {"role": "user", "content": json.dumps(resumo, ensure_ascii=False)},
        ])
        return (r.choices[0].message.content or "").strip()
