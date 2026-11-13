"""Gestão de projeto sobre o plano: caminho crítico, marco do lançamento e uso da frota (ticket 04c, ADR 0007).

Funções puras sobre o Plano. Nenhuma recalcula alocação: quem aloca é o motor.
"""
import math

from .modelo import HORIZONTE, Pedido, Plano, Teste
from .motor import planejar

MARCO = HORIZONTE  # semana do lançamento: o plano não passa dela (RN-06)
# Em milhões de reais. carro: meio da faixa do discovery (R$ 1 a 1,5 milhão), MK-11.
# preco_suv: preço de venda do carro de série (R$ 150 mil, discovery). suvs_semana: volume de vendas suposto, MK-10
CUSTOS = {"carro": 1.25, "preco_suv": 0.15, "suvs_semana": 1000}
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


def curva_meta(testes: list[Teste], prototipos: list[str], metas=(20, 19, 18, 17, 16)) -> list[dict]:
    """Quantos carros o plano pede para cada meta de fim: o preço de comprar folga de prazo com frota.
    Só leitura: não muda o plano em vigor."""
    curva = []
    for meta in metas:
        p = planejar(testes, prototipos, horizonte=meta)
        curva.append({"meta": meta, "carros": len(p.prototipos()), "folga_projeto": MARCO - p.semana_fim(),
                      "nao_cabe": len(p.nao_cabe)})
    return curva


def memoria(plano: Plano, testes: dict[str, Teste]) -> dict:
    """Memória de cálculo: de onde sai o número de carros do plano (ticket 10).
    carros × semanas = carros-semana em teste + perdidos (carro destruído antes do fim) + vazios.
    O piso é o menor número de carros que qualquer plano precisaria: a soma das durações dividida pelas semanas,
    e nunca menos que um carro por teste destrutivo (RN-04)."""
    carros, semanas = len(plano.prototipos()), plano.semana_fim()
    uso = uso_por_semana(plano, testes, carros, semanas)
    em_teste = sum(u["em_uso"] for u in uso)
    destrutivos = len({a.teste_id for a in plano.alocacoes if testes[a.teste_id].destrutivo})
    return {"testes": len({a.teste_id for a in plano.alocacoes}), "destrutivos": destrutivos, "semanas": semanas,
            "carros": carros, "em_teste": em_teste, "destruido": sum(u["fora"] for u in uso),
            "vazio": sum(u["parados"] for u in uso),
            "piso": max(math.ceil(em_teste / semanas), destrutivos) if semanas else 0}


def simular(testes: list[Teste], pedidos: list[Pedido], prototipos: list[str], por_area: int, meta: int,
            destrutivo_no_fim: bool, folga: float) -> dict:
    """E se as áreas registrassem menos testes, a meta de fim fosse outra, ou o destrutivo rodasse no fim? (ticket 10)
    Só leitura: não toca no plano em vigor. O pedido de cada área é refeito do jeito do mock (MK-03): a área
    sozinha, na janela dela, com a mesma gordura do pedido original."""
    # ponytail: a amostra são os N primeiros testes de cada área na lista do mock; com dado real, a lista vem das áreas
    vistos: dict[str, int] = {}
    amostra = []
    for t in sorted(testes, key=lambda t: (len(t.id), t.id)):  # ordem fixa, igual no JSON e no Postgres
        vistos[t.area] = vistos.get(t.area, 0) + 1
        if vistos[t.area] <= por_area:
            amostra.append(t)
    por_id = {t.id: t for t in amostra}
    plano = planejar(amostra, prototipos, horizonte=meta, destrutivo_no_fim=destrutivo_no_fim)
    pedidos_sim = []
    for p in pedidos:
        cheio = len(planejar([t for t in testes if t.area == p.area], prototipos, horizonte=p.semanas).prototipos())
        so = len(planejar([t for t in amostra if t.area == p.area], prototipos, horizonte=p.semanas).prototipos())
        pedidos_sim.append({"area": p.area, "carros": -(-so * p.carros // cheio), "semanas": p.semanas})
    destrutivos = sum(t.destrutivo for t in amostra)
    reserva = math.ceil(round(folga * destrutivos, 6))
    f = folgas(plano)
    return {"por_area": por_area, "meta": meta, "destrutivo_no_fim": destrutivo_no_fim, "testes": len(amostra),
            "destrutivos": destrutivos, "pedidos": sum(p["carros"] for p in pedidos_sim), "pedidos_por_area": pedidos_sim,
            "carros_plano": len(plano.prototipos()), "carros_reserva": reserva,
            "carros": len(plano.prototipos()) + reserva, "semana_fim": plano.semana_fim(),
            "folga_projeto": MARCO - plano.semana_fim(), "criticos": sum(1 for v in f.values() if v == 0),
            "nao_cabe": len(plano.nao_cabe), "memoria": memoria(plano, por_id),
            "custo_frota": (len(plano.prototipos()) + reserva) * CUSTOS["carro"]}
