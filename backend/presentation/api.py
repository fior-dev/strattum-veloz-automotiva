"""Rotas FastAPI. Swagger em /docs. Uvicorn: presentation.api:app"""
from dataclasses import asdict

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field

from application.planejamento import Planejamento
from domain.modelo import AREAS, HORIZONTE

from .container import planejamento

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


@app.get("/api/comparativo", summary="Como hoje × plano compartilhado (RF-03)")
def comparativo(uc: Planejamento = Depends(planejamento)):
    return uc.comparativo()


class Folga(BaseModel):
    folga: float = Field(ge=0, le=0.3, description="Folga de reteste, de 0 a 0.3 (MK-06)")


@app.put("/api/folga", summary="Ajusta a folga de reteste; o plano não muda, só a reserva")
def ajustar_folga(corpo: Folga, uc: Planejamento = Depends(planejamento)):
    uc.ajustar_folga(corpo.folga)
    return uc.comparativo()
