"""Intérprete sem LLM: entende só "<ID> atrasou N semanas" e "<ID> falhou".

Serve de dublê nos testes e de reserva quando não há chave de LLM no .env (ADR 0003).
"""
import re

NUMEROS = {"uma": 1, "um": 1, "duas": 2, "dois": 2, "três": 3, "tres": 3, "quatro": 4, "cinco": 5, "seis": 6}


class InterpretadorOffline:
    def interpretar(self, texto: str, contexto: dict, testes: list[dict]) -> dict:
        t = texto.lower()
        achado = re.search(r"\b([a-z]{3})-?(\d{1,3})\b", t)
        if not achado:
            return {"tipo": "pergunta", "pergunta": "Qual teste? Diga o ID, por exemplo AER-99."}
        teste_id = f"{achado.group(1).upper()}-{int(achado.group(2)):02d}"
        if re.search(r"falh|reprov", t):
            return {"tipo": "falha", "teste_id": teste_id}
        if "atras" in t:
            n = re.search(r"(\d+|" + "|".join(NUMEROS) + r")\s+semana", t)
            semanas = (int(n.group(1)) if n.group(1).isdigit() else NUMEROS[n.group(1)]) if n else 1
            return {"tipo": "atraso", "teste_id": teste_id, "semanas": semanas}
        return {"tipo": "pergunta", "pergunta": f"O que aconteceu com o {teste_id}: atrasou ou falhou?"}

    def explicar(self, resumo: dict, contexto: dict) -> str:
        return ""  # o caso de uso usa a explicação padrão, montada com os números do motor
