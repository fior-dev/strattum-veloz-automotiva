"""Adapter do PlanoRepository sobre o Supabase (Postgres via PostgREST), ticket 05b.

Usa só a stdlib (urllib): nenhuma dependência nova. A chave é a secreta, lida do .env pelo container;
ela passa por cima do RLS e nunca vai ao navegador.
Diferente do JSON, as versões do plano sobrevivem ao reinício. `scripts/seed_supabase.py` volta ao mock.
"""
import json
import urllib.request
from dataclasses import asdict

from domain.modelo import Alocacao, Avaria, NaoCabe, Pedido, Plano, validar_testes


class SupabasePlanoRepository:
    def __init__(self, url: str, chave: str, timeout: int = 15, ler_tabelas: bool = True):
        self._base, self._chave, self._timeout = url.rstrip("/") + "/rest/v1/", chave, timeout
        if not ler_tabelas:  # o seed escreve antes de haver o que ler
            return
        # frota, testes e pedidos não mudam durante a demo: lidos uma vez
        self._testes = validar_testes(self._get("testes?select=id,area,nome,duracao,destrutivo&order=id"))  # RF-01
        self._prototipos = [p["id"] for p in self._get("prototipos?select=id&order=id")]
        self._pedidos = [Pedido(p["area"], p["carros"], p["semanas"]) for p in self._get("pedidos?select=*&order=area")]

    def _req(self, metodo: str, caminho: str, corpo=None, prefer: str = ""):
        cab = {"apikey": self._chave, "Content-Type": "application/json"}
        if self._chave.count(".") == 2:  # chave legada (JWT) também vai no Authorization
            cab["Authorization"] = f"Bearer {self._chave}"
        if prefer:
            cab["Prefer"] = prefer
        dados = json.dumps(corpo).encode() if corpo is not None else None
        req = urllib.request.Request(self._base + caminho, data=dados, method=metodo, headers=cab)
        with urllib.request.urlopen(req, timeout=self._timeout) as r:
            texto = r.read().decode()
        return json.loads(texto) if texto else None

    def _get(self, caminho):
        return self._req("GET", caminho)

    def testes(self):
        return self._testes

    def prototipos(self):
        return self._prototipos

    def pedidos(self):
        return self._pedidos

    def plano(self, versao=None):
        filtro = f"versao=eq.{int(versao)}" if versao is not None else "order=versao.desc&limit=1"
        linhas = self._get(f"planos?select=dados&{filtro}")
        return _plano(linhas[0]["dados"]) if linhas else None

    def salvar(self, plano):
        # upsert: ajustar a folga regrava a mesma versão
        self._req("POST", "planos?on_conflict=versao", {"versao": plano.versao, "dados": asdict(plano)},
                  prefer="resolution=merge-duplicates,return=minimal")

    def versoes(self):
        return [p["versao"] for p in self._get("planos?select=versao&order=versao")]

    # usado pelo seed e pelo teste de contrato, fora da port
    def apagar_planos(self):
        self._req("DELETE", "planos?versao=gte.0", prefer="return=minimal")


def _plano(d: dict) -> Plano:
    return Plano(versao=d["versao"], alocacoes=[Alocacao(**a) for a in d["alocacoes"]],
                 nao_cabe=[NaoCabe(**n) for n in d["nao_cabe"]], reserva=d["reserva"], status=d["status"],
                 avarias=[Avaria(**v) for v in d["avarias"]], estado=d["estado"])
