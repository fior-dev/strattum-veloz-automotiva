"""ADR 0001: a dependência aponta para dentro.

domain/ só importa a biblioteca padrão e ele mesmo.
application/ só importa a biblioteca padrão e domain/.
Se um adapter concreto (FastAPI, LiteLLM, pydantic, infrastructure/) vazar para dentro, este teste falha.
"""
import ast
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
PERMITIDO = {"domain": {"domain"}, "application": {"domain", "application"}}


def importacoes(arquivo: Path):
    for no in ast.walk(ast.parse(arquivo.read_text(encoding="utf-8"))):
        if isinstance(no, ast.Import):
            yield from (a.name.split(".")[0] for a in no.names)
        elif isinstance(no, ast.ImportFrom) and no.level == 0:
            yield no.module.split(".")[0]


def test_dominio_e_aplicacao_nao_importam_nada_de_fora():
    violacoes = []
    for camada, internos in PERMITIDO.items():
        for arquivo in (RAIZ / camada).rglob("*.py"):
            for modulo in importacoes(arquivo):
                if modulo not in sys.stdlib_module_names and modulo not in internos:
                    violacoes.append(f"{arquivo.relative_to(RAIZ)} importa {modulo}")
    assert violacoes == []


def test_o_teste_de_fronteira_pega_vazamento(tmp_path):
    arquivo = tmp_path / "x.py"
    arquivo.write_text("from fastapi import FastAPI\nfrom infrastructure.json_repo import X\nimport json\n")
    assert [m for m in importacoes(arquivo) if m not in sys.stdlib_module_names] == ["fastapi", "infrastructure"]
