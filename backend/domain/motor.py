"""Motor de alocação: a heurística gulosa do ADR 0002.

Interface pequena: `planejar` e `replanejar`. Todas as regras (RN-01 a RN-09) moram aqui.
"""
from .modelo import HORIZONTE, Alocacao, NaoCabe, Plano, Teste


def cabe(ocupado: list[Alocacao], inicio: int, fim: int, destrutivo: bool, testes: dict[str, Teste]) -> bool:
    """O carro com as alocações `ocupado` aceita um teste nas semanas inicio..fim?

    RN-02: no máximo um teste por semana.
    RN-04: o destrutivo é o último do carro, e só existe um por carro.
    """
    for a in ocupado:
        if inicio <= a.fim and a.inicio <= fim:  # sobreposição (RN-02)
            return False
        if testes[a.teste_id].destrutivo:
            if destrutivo or fim >= a.inicio:  # segundo destrutivo, ou algo depois dele
                return False
    if destrutivo and any(a.fim >= inicio for a in ocupado):  # destrutivo tem de ser o último
        return False
    return True


def primeira_semana(ocupado, duracao, destrutivo, testes, horizonte=HORIZONTE, a_partir=1):
    """A semana mais cedo em que o teste cabe no carro, ou None."""
    for inicio in range(a_partir, horizonte - duracao + 2):
        if cabe(ocupado, inicio, inicio + duracao - 1, destrutivo, testes):
            return inicio
    return None


def ordem(testes: list[Teste]) -> list[Teste]:
    """Não destrutivos antes, do mais longo ao mais curto; destrutivos por último (RF-02).
    O ID desempata, para o plano não depender da ordem do arquivo (RNF-02)."""
    return sorted(testes, key=lambda t: (t.destrutivo, -t.duracao, t.id))


def planejar(testes: list[Teste], prototipos: list[str], horizonte: int = HORIZONTE) -> Plano:
    """Gera o plano compartilhado: menos protótipos primeiro, menor semana de fim depois."""
    por_id = {t.id: t for t in testes}
    livres = sorted(prototipos)  # carros ainda não abertos, menor ID primeiro
    abertos: dict[str, list[Alocacao]] = {}
    alocacoes, nao_cabe = [], []

    for teste in ordem(testes):
        if teste.duracao > horizonte:
            nao_cabe.append(NaoCabe(teste.id, f"Dura {teste.duracao} semanas; o plano acaba na semana {horizonte}"))
            continue
        # o carro já aberto que comporta o teste mais cedo; empate fica com o menor ID
        melhor = None
        for pid in sorted(abertos):
            semana = primeira_semana(abertos[pid], teste.duracao, teste.destrutivo, por_id, horizonte)
            if semana is not None and (melhor is None or semana < melhor[1]):
                melhor = (pid, semana)
        if melhor is None:  # nenhum carro aberto serve: abre um novo
            if not livres:
                nao_cabe.append(NaoCabe(teste.id, f"Não há protótipo livre até a semana {horizonte}"))
                continue
            melhor = (livres.pop(0), 1)
            abertos[melhor[0]] = []
        pid, semana = melhor
        aloc = Alocacao(pid, teste.id, semana, semana + teste.duracao - 1)
        abertos[pid].append(aloc)
        alocacoes.append(aloc)

    alocacoes.sort(key=lambda a: (a.prototipo_id, a.inicio))
    return Plano(versao=1, alocacoes=alocacoes, nao_cabe=nao_cabe, status={t.id: "planejado" for t in testes})
