"""Copiloto de replanejamento (fatia 5, ADR 0003).

O LLM traduz texto em evento e explica. Quem calcula é o motor; quem decide é o gerente da coordenação.
"""
from dataclasses import asdict

from domain.motor import EventoInvalido
from domain.ports import ContextProvider, InterpretadorDeImprevisto

from .planejamento import Replanejamento


class Copiloto:
    def __init__(self, replanejamento: Replanejamento, contexto: ContextProvider, interpretador: InterpretadorDeImprevisto):
        self.replanejamento = replanejamento
        self.contexto = contexto
        self.interpretador = interpretador

    def perguntar(self, texto: str) -> dict:
        ctx = self.contexto.contexto()
        testes = [{"id": t.id, "nome": t.nome, "area": t.area} for t in self.replanejamento.repo.testes()]
        try:
            bruto = self.interpretador.interpretar(texto, ctx, testes)
        except Exception as e:  # LLM fora do ar não para o sistema: a mesma ação existe na tela
            return _pergunta(f"O copiloto está fora do ar ({type(e).__name__}). Registre o evento clicando no teste no Gantt.")
        tipo = bruto.get("tipo")
        if tipo not in ("atraso", "falha"):
            return _pergunta(bruto.get("pergunta") or "Não entendi qual teste mudou. Diga o ID do teste (ex.: AER-99) e o que aconteceu.")
        evento = {"tipo": tipo, "teste_id": str(bruto.get("teste_id", "")).upper()}
        if tipo == "atraso":
            evento["semanas"] = int(bruto.get("semanas") or 1)
        try:  # validação no domínio: evento inválido volta como pergunta, não vira plano
            status = "atrasado" if tipo == "atraso" else "falhou"
            proposta = self.replanejamento.mudar_status(evento["teste_id"], status, evento.get("semanas", 1))
        except (EventoInvalido, ValueError) as e:
            dica = "" if self.replanejamento.pendente else " Confira o ID do teste e tente de novo."
            return _pergunta(f"{e}.{dica}")
        resumo = {"evento": proposta.evento, "sugestoes": [asdict(s) for s in proposta.sugestoes],
                  "impactados": [asdict(i) for i in proposta.impactados], "marco": proposta.marco}
        try:
            explicacao = self.interpretador.explicar(resumo, ctx) or explicacao_padrao(resumo)
        except Exception:
            explicacao = explicacao_padrao(resumo)
        return {"evento": evento, "pergunta": None, "explicacao": explicacao, "proposta": resumo}


def _pergunta(texto: str) -> dict:
    return {"evento": None, "pergunta": texto, "explicacao": None, "proposta": None}


def explicacao_padrao(resumo: dict) -> str:
    """Explicação sem LLM, montada só com os números do motor."""
    partes = [f"{resumo['evento']}."]
    for s in resumo["sugestoes"]:
        if s.get("reteste"):
            partes.append(f"O {s['teste_id']} repete no {s['para']}, semanas {s['inicio']} a {s['fim']}, porque o {s['de']} não pode receber o reteste.")
        else:
            partes.append(f"O {s['teste_id']} estava prometido ao {s['de']} nas semanas {s['inicio']} a {s['fim']}; "
                          f"a sugestão é usar o {s['para']}, que está livre.")
    for i in resumo["impactados"]:
        partes.append(f"O {i['teste_id']} ({i['area']}) fica sem carro: {i['motivo']}.")
    m = resumo.get("marco")
    if m:
        partes.append("O lançamento não se move." if not m["semanas_consumidas"]
                      else f"O fim do plano vai da semana {m['fim_antes']} para a {m['fim_depois']}.")
    partes.append("Nada muda até o gerente da coordenação aceitar.")
    return " ".join(partes)
