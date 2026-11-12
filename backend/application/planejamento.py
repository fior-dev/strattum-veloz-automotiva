"""Casos de uso do planejamento. Recebem a port pelo construtor (ADR 0001)."""
from dataclasses import replace

from functools import cache

from domain.folga import FOLGA_PADRAO, carros_de_reserva, comparar
from domain.gestao import curva_meta, folgas, impacto_no_marco, resumo_marco, uso_como_hoje, uso_por_semana
from domain.modelo import GRAVIDADES, STATUS, TIPOS_AVARIA, Avaria, Plano
from domain.motor import Atraso, EventoInvalido, Falha, Proposta, RegistroAvaria, planejar, replanejar
from domain.ports import PlanoRepository


class Planejamento:
    def __init__(self, repo: PlanoRepository):
        self.repo = repo

    def gerar_plano(self, folga: float = FOLGA_PADRAO) -> Plano:
        """Gera a versão 1 a partir dos testes e da frota, e guarda."""
        plano = planejar(self.repo.testes(), self.repo.prototipos())
        plano.reserva = carros_de_reserva(plano, self.repo.prototipos(), self.repo.testes(), folga)
        self.repo.salvar(plano)
        return plano

    def plano(self, versao: int | None = None) -> Plano | None:
        return self.repo.plano(versao) or (self.gerar_plano() if versao is None else None)

    def ajustar_folga(self, folga: float) -> Plano:
        """Muda só a reserva da versão atual; as alocações não mudam."""
        if not 0 <= folga <= 0.3:
            raise ValueError("A folga de reteste vai de 0% a 30%")
        atual = self.plano()
        novo = replace(atual, reserva=carros_de_reserva(atual, self.repo.prototipos(), self.repo.testes(), folga))
        self.repo.salvar(novo)
        return novo

    def comparativo(self) -> dict:
        return comparar(self.plano(), self.repo.pedidos(), self.repo.testes())

    def gestao(self, versao: int | None = None) -> dict:
        """Caminho crítico, marco, uso da frota por semana e a curva meta × carros (ticket 04c)."""
        plano = self.plano(versao)
        testes = {t.id: t for t in self.repo.testes()}
        frota = len(plano.prototipos()) + len(plano.reserva)
        return {**resumo_marco(plano, testes), "folgas": folgas(plano),
                "uso": {"plano": uso_por_semana(plano, testes, frota), "como_hoje": self._uso_como_hoje()},
                "curva_meta": self._curva_meta()}

    @cache  # ponytail: o mock não muda enquanto o processo vive; com dado vivo, invalidar ao carregar
    def _uso_como_hoje(self):
        return uso_como_hoje(self.repo.testes(), self.repo.pedidos(), self.repo.prototipos())

    @cache
    def _curva_meta(self):
        return curva_meta(self.repo.testes(), self.repo.prototipos())


class Replanejamento:
    """Evento → proposta → aceite do gerente da coordenação (RN-05, RN-07, RF-05, RF-06)."""

    def __init__(self, repo: PlanoRepository, planejamento: Planejamento):
        self.repo = repo
        self.planejamento = planejamento
        self.pendente: Proposta | None = None  # ponytail: uma proposta por vez, em memória

    def _testes(self):
        return {t.id: t for t in self.repo.testes()}

    def mudar_status(self, teste_id: str, status: str, semanas: int = 1) -> Proposta | None:
        """RF-05. Atrasado ou falhou disparam o replanejamento na mesma ação; o resto só muda o status."""
        if status == "atrasado":
            return self.propor(Atraso(teste_id, semanas))
        if status == "falhou":
            return self.propor(Falha(teste_id))
        if status not in STATUS:
            raise EventoInvalido(f"Status desconhecido: {status}")
        if teste_id not in self._testes():
            raise EventoInvalido(f"O teste {teste_id} não existe")
        plano = self.planejamento.plano()
        plano.status[teste_id] = status
        self.repo.salvar(plano)
        return None

    def registrar_avaria(self, avaria: Avaria) -> Proposta | None:
        """RF-08: registrar dispara o RN-09 na mesma ação."""
        if avaria.prototipo_id not in self.planejamento.plano().prototipos():
            raise EventoInvalido(f"O protótipo {avaria.prototipo_id} não está no plano")
        if avaria.tipo not in TIPOS_AVARIA or avaria.gravidade not in GRAVIDADES:
            raise EventoInvalido("Tipo ou gravidade de avaria desconhecidos")
        if avaria.gravidade == "leve":  # RN-09: leve só fica visível; não cria versão nem mexe na proposta pendente
            plano = self.planejamento.plano()
            plano.avarias.append(avaria)
            self.repo.salvar(plano)
            return None
        return self.propor(RegistroAvaria(avaria))

    def propor(self, evento) -> Proposta:
        atual = self.planejamento.plano()
        self.pendente = replanejar(atual, evento, self._testes())
        self.pendente.marco = impacto_no_marco(atual, self.pendente.plano, getattr(evento, "teste_id", None))
        return self.pendente

    def aceitar(self) -> Plano:
        """RF-06: cria a versão N+1; a versão N continua consultável."""
        if self.pendente is None:
            raise EventoInvalido("Não há proposta pendente")
        plano, self.pendente = self.pendente.plano, None
        self.repo.salvar(plano)
        return plano

    def recusar(self) -> None:
        self.pendente = None
