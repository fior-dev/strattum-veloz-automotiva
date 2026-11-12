"""Gestão de projeto sobre o plano: caminho crítico, marco do lançamento e uso da frota (ticket 04c, ADR 0007).

Funções puras sobre o Plano. Nenhuma recalcula alocação: quem aloca é o motor.
"""
from .modelo import HORIZONTE, Pedido, Plano, Teste
from .motor import planejar

MARCO = HORIZONTE  # semana do lançamento: o plano não passa dela (RN-06)
AMARELO_ATE = 2  # MK-08: folga do projeto de 1 a 2 semanas é amarelo; 0 ou menos, vermelho


def _cadeias(plano: Plano) -> dict[str, list]:
    carros: dict[str, list] = {}
    for a in plano.alocacoes:
        carros.setdefault(a.prototipo_id, []).append(a)
    return carros


def folgas(plano: Plano) -> dict[str, int]:
    """Folga de um teste = fim do plano − fim da cadeia do carro dele (ADR 0007).
    A dependência entre testes é só a sequência no mesmo carro, com o destrutivo por último (RN-04).
    Teste com reteste fica com a menor folga das suas alocações."""
    fim = plano.semana_fim()
    resultado: dict[str, int] = {}
    for alocs in _cadeias(plano).values():
        folga = fim - max(a.fim for a in alocs)
        for a in alocs:
            resultado[a.teste_id] = min(folga, resultado.get(a.teste_id, folga))
    return resultado


def resumo_marco(plano: Plano, testes: dict[str, Teste], marco: int = MARCO) -> dict:
    fim = plano.semana_fim()
    folga_projeto = marco - fim
    sinal = "verde" if folga_projeto > AMARELO_ATE else "amarelo" if folga_projeto > 0 else "vermelho"
    f = folgas(plano)
    return {"marco": marco, "fim_plano": fim, "folga_projeto": folga_projeto, "sinal": sinal,
            "criticos": sum(1 for v in f.values() if v == 0), "testes_no_plano": len(f)}


def impacto_no_marco(antes: Plano, depois: Plano, teste_id: str, marco: int = MARCO) -> dict:
    """Quanto um evento mexe no fim do plano. Pelo RN-05, o atraso troca o teste seguinte de carro em vez de
    empurrá-lo; por isso o impacto é medido entre os dois planos, não pela cadeia."""
    fa, fd = antes.semana_fim(), depois.semana_fim()
    return {"fim_antes": fa, "fim_depois": fd, "semanas_consumidas": max(0, fd - fa),
            "folga_projeto_antes": marco - fa, "folga_projeto_depois": marco - fd,
            "estava_no_caminho_critico": None if teste_id is None else folgas(antes).get(teste_id) == 0}  # avaria não tem teste


def uso_por_semana(plano: Plano, testes: dict[str, Teste], frota: int, horizonte: int = HORIZONTE) -> list[dict]:
    """Histograma de recursos: por semana, carros em uso, parados e fora da frota.
    Carro destruído por teste destrutivo conta como fora, não como parado."""
    destruido_apos = [a.fim for a in plano.alocacoes if testes[a.teste_id].destrutivo]
    semanas = []
    for s in range(1, horizonte + 1):
        em_uso = len({a.prototipo_id for a in plano.alocacoes if a.inicio <= s <= a.fim})
        fora = sum(1 for fim in destruido_apos if fim < s)
        semanas.append({"semana": s, "em_uso": em_uso, "parados": frota - em_uso - fora, "fora": fora})
    return semanas


def uso_como_hoje(testes: list[Teste], pedidos: list[Pedido], prototipos: list[str], horizonte: int = HORIZONTE) -> list[dict]:
    """O "como hoje" semana a semana: cada área roda os próprios testes nos próprios carros, na janela que pediu,
    do mesmo jeito que o gerador do mock montou os pedidos (MK-03). A frota é a soma dos pedidos."""
    total = [{"semana": s, "em_uso": 0, "parados": 0, "fora": 0} for s in range(1, horizonte + 1)]
    por_id = {t.id: t for t in testes}
    for pedido in pedidos:
        da_area = [t for t in testes if t.area == pedido.area]
        plano = planejar(da_area, prototipos, horizonte=pedido.semanas)
        for linha, da in zip(total, uso_por_semana(plano, por_id, pedido.carros, horizonte)):
            for k in ("em_uso", "parados", "fora"):
                linha[k] += da[k]
    return total


def curva_meta(testes: list[Teste], prototipos: list[str], metas=(20, 19, 18, 17)) -> list[dict]:
    """Quantos carros o plano pede para cada meta de fim: o preço de comprar folga de prazo com frota.
    Só leitura: não muda o plano em vigor."""
    curva = []
    for meta in metas:
        p = planejar(testes, prototipos, horizonte=meta)
        curva.append({"meta": meta, "carros": len(p.prototipos()), "folga_projeto": MARCO - p.semana_fim(),
                      "nao_cabe": len(p.nao_cabe)})
    return curva
