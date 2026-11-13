"""Casos de uso do planejamento. Recebem a port pelo construtor (ADR 0001)."""
import threading
from dataclasses import replace

from functools import cache, lru_cache

from domain.folga import FOLGA_PADRAO, carros_de_reserva, comparar
from domain.gestao import (MARCO, curva_meta, folgas, impacto_no_marco, memoria, resumo_marco, simular, uso_como_hoje,
                           uso_por_semana)
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
        return {**resumo_marco(plano, testes), "folgas": folgas(plano), "memoria": memoria(plano, testes),
                "uso": {"plano": uso_por_semana(plano, testes, frota), "como_hoje": self._uso_como_hoje()},
                "curva_meta": self._curva_meta()}

    @cache  # ponytail: o mock não muda enquanto o processo vive; com dado vivo, invalidar ao carregar
    def _uso_como_hoje(self):
        return uso_como_hoje(self.repo.testes(), self.repo.pedidos(), self.repo.prototipos())

    @cache
    def _curva_meta(self):
        return curva_meta(self.repo.testes(), self.repo.prototipos())

    @lru_cache(maxsize=512)  # a rota é pública: o cache não pode crescer sem limite
    def simular(self, por_area: int, meta: int, destrutivo_no_fim: bool, folga: float) -> dict:
        """Só leitura (ticket 10): o plano em vigor não muda."""
        return simular(self.repo.testes(), self.repo.pedidos(), self.repo.prototipos(), por_area, meta, destrutivo_no_fim, folga)

    def regerar(self, meta: int, destrutivo_no_fim: bool, folga: float) -> Plano:
        """A coordenação adota outra meta de fim ou outra regra do destrutivo: o plano é refeito do zero e vira a
        versão N+1. Os imprevistos já aceitos não entram no plano novo; a versão anterior fica para consulta."""
        if not 1 <= meta <= MARCO or not 0 <= folga <= 0.3:
            raise EventoInvalido(f"A meta vai de 1 a {MARCO} e a folga de reteste de 0% a 30%")
        fora = sorted({v.prototipo_id for v in self.plano().avarias if v.gravidade == "compromete_reuso"})
        if fora:  # ponytail: refazer do zero devolveria o carro avariado à frota (RN-09); replanejar sem ele fica para a v2
            raise EventoInvalido(f"O plano em vigor tem carro fora da frota por avaria ({', '.join(fora)}). Refazer o plano do zero o devolveria à frota")
        plano = planejar(self.repo.testes(), self.repo.prototipos(), horizonte=meta, destrutivo_no_fim=destrutivo_no_fim)
        plano.versao = self.plano().versao + 1
        plano.reserva = carros_de_reserva(plano, self.repo.prototipos(), self.repo.testes(), folga)
        self.repo.salvar(plano)
        return plano


class Replanejamento:
    """Evento → proposta → aceite do gerente da coordenação (RN-05, RN-07, RF-05, RF-06)."""

    def __init__(self, repo: PlanoRepository, planejamento: Planejamento):
        self.repo = repo
        self.planejamento = planejamento
        self.pendente: Proposta | None = None  # ponytail: uma proposta por vez, em memória
        self._trava = threading.Lock()  # rotas síncronas rodam em threads: dois aceites ao mesmo tempo

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
        atual = self._atual_e_pendente()
        for plano in atual:
            plano.status[teste_id] = status
        self.repo.salvar(atual[0])
        return None

    def registrar_avaria(self, avaria: Avaria) -> Proposta | None:
        """RF-08: registrar dispara o RN-09 na mesma ação."""
        if avaria.prototipo_id not in self.planejamento.plano().prototipos():
            raise EventoInvalido(f"O protótipo {avaria.prototipo_id} não está no plano")
        if avaria.tipo not in TIPOS_AVARIA or avaria.gravidade not in GRAVIDADES:
            raise EventoInvalido("Tipo ou gravidade de avaria desconhecidos")
        if avaria.gravidade == "leve":  # RN-09: leve só fica visível; não cria versão nem mexe na proposta pendente
            atual = self._atual_e_pendente()
            for plano in atual:
                plano.avarias.append(avaria)
            self.repo.salvar(atual[0])
            return None
        return self.propor(RegistroAvaria(avaria))

    def _atual_e_pendente(self) -> list[Plano]:
        """O que não precisa de aceite vale no plano atual e na proposta pendente, para o aceite não apagar."""
        return [self.planejamento.plano()] + ([self.pendente.plano] if self.pendente else [])

    def _sem_pendente(self):
        """RN-07: uma decisão por vez. Evento novo ou folga nova com proposta aberta apagariam a proposta."""
        if self.pendente is not None:
            raise EventoInvalido("Há uma proposta esperando o gerente da coordenação: aceite ou recuse antes")

    def ajustar_folga(self, folga: float) -> Plano:
        self._sem_pendente()
        return self.planejamento.ajustar_folga(folga)

    def regerar(self, meta: int, destrutivo_no_fim: bool, folga: float) -> Plano:
        with self._trava:
            self._sem_pendente()
            return self.planejamento.regerar(meta, destrutivo_no_fim, folga)

    def propor(self, evento) -> Proposta:
        with self._trava:
            self._sem_pendente()
            atual = self.planejamento.plano()
            p = replanejar(atual, evento, self._testes())
            p.marco = impacto_no_marco(atual, p.plano, getattr(evento, "teste_id", None))
            self.pendente = p
            return p

    def aceitar(self, estourar: bool = False, evento: str | None = None) -> Plano:
        """RF-06: cria a versão N+1; a versão N continua consultável.
        RN-06: proposta que empurra o fim além do marco só entra se o gerente escolher estourar (decisão do José, 12/11).
        evento: a proposta que o gerente viu; na demo publicada, outro avaliador pode tê-la trocado."""
        with self._trava:
            p = self.pendente
            if p is None:
                raise EventoInvalido("Não há proposta pendente")
            if evento is not None and evento != p.evento:
                raise EventoInvalido(f"A proposta mudou: agora é \"{p.evento}\". Confira antes de aceitar")
            fim, fim_antes = p.plano.semana_fim(), self.planejamento.plano().semana_fim()
            if fim > max(MARCO, fim_antes) and not estourar:
                raise EventoInvalido(f"A proposta termina na semana {fim}, depois do marco na semana {MARCO}. "
                                     "Recuse, ou marque a opção de passar do marco")
            self.pendente = None
            self.repo.salvar(p.plano)
            return p.plano

    def recusar(self) -> None:
        with self._trava:
            self.pendente = None
