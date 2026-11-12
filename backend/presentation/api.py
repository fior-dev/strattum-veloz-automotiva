"""Rotas FastAPI. Swagger em /docs. Uvicorn: presentation.api:app"""
from dataclasses import asdict

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

from typing import Literal

from application.planejamento import Planejamento, Replanejamento
from domain.modelo import AREAS, HORIZONTE, Avaria
from domain.motor import EventoInvalido

from .container import planejamento, replanejamento

app = FastAPI(title="Veloz · alocação da frota de protótipos", version="0.1.0")


def _plano_json(plano, uc: Planejamento) -> dict:
    testes = {t.id: asdict(t) for t in uc.repo.testes()}
    return {**asdict(plano), "prototipos": plano.prototipos(), "semana_fim": plano.semana_fim(),
            "horizonte": HORIZONTE, "areas": AREAS, "testes": testes, "versoes": uc.repo.versoes()}


@app.get("/api/plano", summary="Plano atual (ou uma versão antiga)")
def ver_plano(versao: int | None = None, uc: Planejamento = Depends(planejamento)):
    plano = uc.plano(versao)
    if plano is None:
        raise HTTPException(404, f"Versão {versao} não existe")
    return _plano_json(plano, uc)


@app.get("/api/gestao", summary="Caminho crítico, marco do lançamento e uso da frota por semana (ticket 04c)")
def gestao(versao: int | None = None, uc: Planejamento = Depends(planejamento)):
    if uc.plano(versao) is None:
        raise HTTPException(404, f"Versão {versao} não existe")
    return uc.gestao(versao)


@app.get("/api/comparativo", summary="Como hoje × plano compartilhado (RF-03)")
def comparativo(uc: Planejamento = Depends(planejamento)):
    return uc.comparativo()


class Folga(BaseModel):
    folga: float = Field(ge=0, le=0.3, description="Folga de reteste, de 0 a 0.3 (MK-06)")


@app.put("/api/folga", summary="Ajusta a folga de reteste; o plano não muda, só a reserva")
def ajustar_folga(corpo: Folga, uc: Planejamento = Depends(planejamento)):
    uc.ajustar_folga(corpo.folga)
    return uc.comparativo()


# ---------------------------------------------------------------- replanejamento (fatias 4 e 4b)

class MudancaStatus(BaseModel):
    teste_id: str
    status: Literal["planejado", "em_andamento", "atrasado", "falhou", "concluido"]
    semanas: int = Field(1, ge=1, le=20, description="Só para atrasado: quantas semanas (+N)")


class NovaAvaria(BaseModel):
    prototipo_id: str
    tipo: Literal["vidro", "lataria", "pneu", "outro"]
    gravidade: Literal["leve", "compromete_reuso"]
    semana: int = Field(ge=1, le=20)
    area: str


def _proposta_json(p) -> dict | None:
    if p is None:
        return None
    return {"evento": p.evento, "sugestoes": [asdict(s) for s in p.sugestoes],
            "impactados": [asdict(i) for i in p.impactados], "versao_nova": p.plano.versao, "marco": p.marco}


def _sem_erro(func):
    try:
        return func()
    except EventoInvalido as e:
        raise HTTPException(422, str(e))


@app.post("/api/status", summary="Muda o status de um teste; atrasado e falhou devolvem uma proposta (RF-05)")
def mudar_status(corpo: MudancaStatus, rp: Replanejamento = Depends(replanejamento)):
    return {"proposta": _proposta_json(_sem_erro(lambda: rp.mudar_status(corpo.teste_id, corpo.status, corpo.semanas)))}


@app.post("/api/avarias", summary="Registra avaria; compromete reuso devolve uma proposta (RF-08, RN-09)")
def registrar_avaria(corpo: NovaAvaria, rp: Replanejamento = Depends(replanejamento)):
    p = _sem_erro(lambda: rp.registrar_avaria(Avaria(**corpo.model_dump())))
    return {"proposta": None if corpo.gravidade == "leve" else _proposta_json(p)}


@app.get("/api/proposta", summary="Proposta pendente de aceite, se houver")
def ver_proposta(rp: Replanejamento = Depends(replanejamento)):
    return {"proposta": _proposta_json(rp.pendente)}


@app.post("/api/proposta/aceitar", summary="O gerente da coordenação aceita: nasce a versão N+1 (RN-07, RF-06)")
def aceitar(rp: Replanejamento = Depends(replanejamento)):
    return {"versao": _sem_erro(rp.aceitar).versao}


@app.post("/api/proposta/recusar", summary="Descarta a proposta; o plano não muda")
def recusar(rp: Replanejamento = Depends(replanejamento)):
    rp.recusar()
    return {"proposta": None}
