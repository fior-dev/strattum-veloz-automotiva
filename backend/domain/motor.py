"""Motor de alocação: a heurística gulosa do ADR 0002.

Interface pequena: `planejar` e `replanejar`. Todas as regras (RN-01 a RN-09) moram aqui.
"""
from dataclasses import dataclass, field, replace

from .modelo import HORIZONTE, Alocacao, Avaria, NaoCabe, Plano, Teste


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


# ---------------------------------------------------------------- replanejamento (RN-05, RN-08, RN-09)

@dataclass(frozen=True)
class Atraso:
    """O teste atrasou +N semanas (ajuste 8: não só +1)."""
    teste_id: str
    semanas: int


@dataclass(frozen=True)
class Falha:
    """O teste falhou e precisa repetir (RN-08)."""
    teste_id: str


@dataclass(frozen=True)
class RegistroAvaria:
    """A engenharia registrou desgaste parcial no carro (RN-09)."""
    avaria: Avaria


@dataclass(frozen=True)
class SugestaoTroca:
    teste_id: str
    de: str
    para: str
    inicio: int
    fim: int


@dataclass(frozen=True)
class Impactado:
    teste_id: str
    area: str
    motivo: str


@dataclass
class Proposta:
    """O que o replanejamento propõe. Só vira plano quando a coordenação aceita (RN-07)."""
    evento: str
    sugestoes: list[SugestaoTroca] = field(default_factory=list)
    impactados: list[Impactado] = field(default_factory=list)
    plano: Plano | None = None
    marco: dict | None = None  # impacto no marco do lançamento (ticket 04c)


class EventoInvalido(ValueError):
    pass


def _ultima_alocacao(plano: Plano, teste_id: str) -> Alocacao:
    alocs = [a for a in plano.alocacoes if a.teste_id == teste_id]
    if not alocs:
        raise EventoInvalido(f"O teste {teste_id} não está no plano")
    return max(alocs, key=lambda a: a.inicio)


def replanejar(plano: Plano, evento, testes: dict[str, Teste], horizonte: int = HORIZONTE) -> Proposta:
    alocs = list(plano.alocacoes)
    status = dict(plano.status)
    avarias = list(plano.avarias)
    impactados: list[Impactado] = []
    colididos: list[Alocacao] = []
    origem = None  # carro de onde saem os testes que colidiram

    def no_carro(pid):
        return [a for a in alocs if a.prototipo_id == pid]

    if isinstance(evento, Atraso):
        if evento.semanas < 1:
            raise EventoInvalido("O atraso tem de ser de pelo menos 1 semana")
        a = _ultima_alocacao(plano, evento.teste_id)
        novo = replace(a, fim=a.fim + evento.semanas)
        alocs[alocs.index(a)] = novo
        status[a.teste_id] = "atrasado"
        origem = a.prototipo_id
        colididos = [x for x in no_carro(origem) if x != novo and a.inicio < x.inicio <= novo.fim]
        if novo.fim > horizonte:
            impactados.append(Impactado(a.teste_id, testes[a.teste_id].area,
                                        f"Com o atraso, termina na semana {novo.fim}; o plano acaba na semana {horizonte} (RN-06)"))
        descricao = f"{a.teste_id} atrasou {evento.semanas} semana(s)"

    elif isinstance(evento, Falha):
        a = _ultima_alocacao(plano, evento.teste_id)
        t = testes[a.teste_id]
        status[a.teste_id] = "falhou"
        origem = a.prototipo_id
        descricao = f"{a.teste_id} falhou e precisa repetir"
        if not t.destrutivo:  # RN-08: repete inteiro, logo em seguida, no mesmo carro
            reteste = Alocacao(a.prototipo_id, a.teste_id, a.fim + 1, a.fim + t.duracao, reteste=True)
            if reteste.fim > horizonte:
                impactados.append(Impactado(a.teste_id, t.area, f"O reteste terminaria na semana {reteste.fim}; o plano acaba na semana {horizonte} (RN-06)"))
            else:
                colididos = [x for x in no_carro(origem) if a.inicio < x.inicio <= reteste.fim]
                alocs.append(reteste)
        else:  # RN-08: o carro foi destruído; o reteste vai para um carro livre
            fora = _fora_do_pool(avarias) | {origem}
            melhor = None
            for pid in _candidatos(plano, fora):
                s = primeira_semana(no_carro(pid), t.duracao, True, testes, horizonte, a_partir=a.fim + 1)
                if s is not None and (melhor is None or s < melhor[1]):
                    melhor = (pid, s)
            if melhor:
                alocs.append(Alocacao(melhor[0], a.teste_id, melhor[1], melhor[1] + t.duracao - 1, reteste=True))
            else:
                impactados.append(Impactado(a.teste_id, t.area, "Não há carro livre para repetir o teste destrutivo"))

    elif isinstance(evento, RegistroAvaria):
        v = evento.avaria
        avarias.append(v)
        descricao = f"Avaria ({v.tipo}, {'leve' if v.gravidade == 'leve' else 'compromete reuso'}) em {v.prototipo_id} na semana {v.semana}"
        if v.gravidade == "compromete_reuso":  # RN-09: o carro sai do pool
            origem = v.prototipo_id
            colididos = [x for x in no_carro(origem) if x.inicio > v.semana]
    else:
        raise EventoInvalido(f"Evento desconhecido: {evento!r}")

    # RN-05: cada teste que colidiu procura outro carro livre nas mesmas semanas
    for x in colididos:
        alocs.remove(x)
    sugestoes = []
    fora = _fora_do_pool(avarias) | ({origem} if origem else set())
    for x in sorted(colididos, key=lambda x: (x.inicio, x.teste_id)):
        destrutivo = testes[x.teste_id].destrutivo
        para = next((pid for pid in _candidatos(plano, fora) if cabe(no_carro(pid), x.inicio, x.fim, destrutivo, testes)), None)
        if para:
            alocs.append(replace(x, prototipo_id=para))
            sugestoes.append(SugestaoTroca(x.teste_id, x.prototipo_id, para, x.inicio, x.fim))
        else:
            impactados.append(Impactado(x.teste_id, testes[x.teste_id].area,
                                        f"Sem carro livre nas semanas {x.inicio} a {x.fim}"))

    removidos = {i.teste_id for i in impactados} - {a.teste_id for a in alocs}
    usados = {a.prototipo_id for a in alocs}
    novo = Plano(
        versao=plano.versao + 1,
        alocacoes=sorted(alocs, key=lambda a: (a.prototipo_id, a.inicio)),
        nao_cabe=plano.nao_cabe + [NaoCabe(i.teste_id, i.motivo) for i in impactados if i.teste_id in removidos],
        reserva=[p for p in plano.reserva if p not in usados],
        status=status,
        avarias=avarias,
    )
    return Proposta(descricao, sugestoes, impactados, novo)


def _fora_do_pool(avarias: list[Avaria]) -> set[str]:
    return {v.prototipo_id for v in avarias if v.gravidade == "compromete_reuso"}


def _candidatos(plano: Plano, fora: set[str]) -> list[str]:
    """Primeiro os carros do plano, depois os da folga de reteste; menor ID primeiro."""
    return [p for p in plano.prototipos() + plano.reserva if p not in fora]
