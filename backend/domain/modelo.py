"""Entidades do domínio. Python puro: nada de FastAPI, pydantic ou banco (ADR 0001).

O vocabulário é o do CONTEXT.md.
"""
from dataclasses import dataclass, field

HORIZONTE = 20  # semanas do plano (RN-06, fato do discovery)

AREAS = [
    "Elétrica/Eletrônica",
    "Mecânica/Powertrain",
    "Aerodinâmica",
    "Dinâmica veicular",
    "Segurança passiva",
]

STATUS = ["planejado", "em_andamento", "atrasado", "falhou", "concluido"]
TIPOS_AVARIA = ["vidro", "lataria", "pneu", "outro"]
GRAVIDADES = ["leve", "compromete_reuso"]


@dataclass(frozen=True)
class Teste:
    __test__ = False  # avisa o pytest que isto não é classe de teste
    id: str
    area: str
    nome: str
    duracao: int  # semanas
    destrutivo: bool


@dataclass(frozen=True)
class Pedido:
    """O que a área pede hoje: N carros por S semanas. Só entra no "como hoje"."""
    area: str
    carros: int
    semanas: int


@dataclass(frozen=True)
class Alocacao:
    prototipo_id: str
    teste_id: str
    inicio: int  # semana, inclusive
    fim: int  # semana, inclusive
    reteste: bool = False


@dataclass(frozen=True)
class NaoCabe:
    teste_id: str
    motivo: str


@dataclass(frozen=True)
class Avaria:
    prototipo_id: str
    tipo: str
    gravidade: str
    semana: int
    area: str


@dataclass
class Plano:
    versao: int
    alocacoes: list[Alocacao]
    nao_cabe: list[NaoCabe] = field(default_factory=list)
    reserva: list[str] = field(default_factory=list)  # carros da folga de reteste (MK-06)
    status: dict[str, str] = field(default_factory=dict)  # teste_id -> status
    avarias: list[Avaria] = field(default_factory=list)
    estado: str = "rascunho"  # rascunho | aprovado

    def prototipos(self) -> list[str]:
        return sorted({a.prototipo_id for a in self.alocacoes})

    def semana_fim(self) -> int:
        return max((a.fim for a in self.alocacoes), default=0)


class MockInvalido(ValueError):
    pass


def validar_testes(linhas: list[dict]) -> list[Teste]:
    """RF-01: recusa mock com campo faltando ou duração inválida, dizendo o item."""
    testes = []
    for i, linha in enumerate(linhas):
        item = linha.get("id", f"linha {i + 1}")
        for campo in ("id", "area", "nome", "duracao", "destrutivo"):
            if campo not in linha:
                raise MockInvalido(f"Teste {item}: falta o campo '{campo}'")
        if linha["area"] not in AREAS:
            raise MockInvalido(f"Teste {item}: área desconhecida '{linha['area']}'")
        if not isinstance(linha["duracao"], int) or not 1 <= linha["duracao"]:
            raise MockInvalido(f"Teste {item}: duração inválida ({linha['duracao']})")
        testes.append(Teste(**{k: linha[k] for k in ("id", "area", "nome", "duracao", "destrutivo")}))
    return testes
