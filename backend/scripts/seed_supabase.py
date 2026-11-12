"""Carrega o mock no Supabase e apaga as versões do plano: volta a demo ao ponto de partida.

Uso (na pasta backend, com SUPABASE_URL e SUPABASE_SECRET_KEY no .env):
    uv run python scripts/seed_supabase.py
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dotenv import load_dotenv  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
load_dotenv(RAIZ / ".env")

from infrastructure.supabase_repo import SupabasePlanoRepository  # noqa: E402

mock = json.loads((RAIZ / "data" / "mock.json").read_text(encoding="utf-8"))
repo = SupabasePlanoRepository(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"], timeout=60, ler_tabelas=False)
upsert = "resolution=merge-duplicates,return=minimal"
# o mock é a fonte: apaga testes e pedidos antigos para não sobrar linha de um mock anterior
repo._req("DELETE", "testes?id=neq.-", prefer="return=minimal")
repo._req("DELETE", "pedidos?area=neq.-", prefer="return=minimal")
repo._req("POST", "prototipos", [{"id": p} for p in mock["prototipos"]], prefer=upsert)
repo._req("POST", "testes", [{k: t[k] for k in ("id", "area", "nome", "duracao", "destrutivo")} for t in mock["testes"]], prefer=upsert)
repo._req("POST", "pedidos", [{k: p[k] for k in ("area", "carros", "semanas")} for p in mock["pedidos"]], prefer=upsert)
repo.apagar_planos()
print(f"Supabase: {len(mock['prototipos'])} protótipos, {len(mock['testes'])} testes, {len(mock['pedidos'])} pedidos; planos apagados.")
