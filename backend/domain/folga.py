"""Comparativo "como hoje" × plano compartilhado, com a folga de reteste explícita (RF-03, MK-06)."""
import math

from .modelo import Pedido, Plano, Teste

FOLGA_PADRAO = 0.10  # MK-06


def carros_de_reserva(plano: Plano, prototipos: list[str], testes: list[Teste], folga: float) -> list[str]:
    """Folga de reteste: só o destrutivo que falha precisa de carro novo (RN-08).
    Reserva = folga × nº de testes destrutivos, arredondado para cima. Os IDs são os próximos livres da frota."""
    destrutivos = sum(t.destrutivo for t in testes)
    quantos = math.ceil(round(folga * destrutivos, 6))
    usados = set(plano.prototipos())
    return [p for p in sorted(prototipos) if p not in usados][:quantos]


def comparar(plano: Plano, pedidos: list[Pedido], testes: list[Teste]) -> dict:
    como_hoje = sum(p.carros for p in pedidos)
    proposto = len(plano.prototipos()) + len(plano.reserva)
    return {
        "como_hoje": {
            "carros": como_hoje,
            "semana_fim": max((p.semanas for p in pedidos), default=0),
            "por_area": [{"area": p.area, "carros": p.carros, "semanas": p.semanas} for p in pedidos],
        },
        "proposto": {
            "carros_plano": len(plano.prototipos()),
            "carros_reserva": len(plano.reserva),
            "carros": proposto,
            "semana_fim": plano.semana_fim(),
            "nao_cabe": len(plano.nao_cabe),
        },
        "testes": len(testes),
        "destrutivos": sum(t.destrutivo for t in testes),
        "reducao_pct": round(100 * (como_hoje - proposto) / como_hoje, 1) if como_hoje else 0,
    }
