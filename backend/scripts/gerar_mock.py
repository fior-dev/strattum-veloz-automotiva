"""Gera backend/data/mock.json com semente fixa (MK-07). Rodar: uv run python scripts/gerar_mock.py

Calibra só as entradas (número de testes por área). O pedido "como hoje" de cada área sai do
próprio motor, rodando a área sozinha na janela que ela quer (MK-03b) e somando a gordura (MK-05).
O plano compartilhado não é calibrado: sai do motor na API.
"""
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from domain.modelo import AREAS, Teste  # noqa: E402
from domain.motor import planejar  # noqa: E402

SEMENTE = 42  # MK-07
TESTES_POR_AREA = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 125  # MK-01 (calibrado: pedidos somam ~250)
DESTRUTIVOS = {"Segurança passiva": 0.40, "Mecânica/Powertrain": 0.15}  # MK-02: ~10-20% do total
NOMES = {
    "Elétrica/Eletrônica": ["Chicote elétrico", "Bateria 12V", "Infotainment", "Compatibilidade eletromagnética", "Iluminação", "Sensores ADAS"],
    "Mecânica/Powertrain": ["Durabilidade do motor", "Câmbio", "Arrefecimento", "Consumo", "Emissões", "Durabilidade extrema"],
    "Aerodinâmica": ["Túnel de vento", "Ruído aerodinâmico", "Vedação na chuva", "Arrasto", "Refrigeração de freios"],
    "Dinâmica veicular": ["Frenagem em pista seca", "Tração", "Estabilidade", "Suspensão", "Direção"],
    "Segurança passiva": ["Crash frontal", "Crash lateral", "Capotamento", "Airbags", "Cintos e fixações"],
}
DESTRUTIVOS_NOMES = {"Crash frontal", "Crash lateral", "Capotamento", "Durabilidade extrema"}


def gerar():
    rnd = random.Random(SEMENTE)
    frota = [f"P{i:03d}" for i in range(1, 251)]
    testes, pedidos = [], []
    for n_area, area in enumerate(AREAS, start=1):
        da_area = []
        for i in range(1, TESTES_POR_AREA + 1):
            destrutivo = rnd.random() < DESTRUTIVOS.get(area, 0)
            opcoes = [n for n in NOMES[area] if (n in DESTRUTIVOS_NOMES) == destrutivo] or NOMES[area]
            da_area.append(Teste(
                id=f"{area[:3].upper()}-{i:02d}".replace("É", "E").replace("Ã", "A"),
                area=area, nome=f"{rnd.choice(opcoes)} #{i}",
                duracao=rnd.randint(1, 6),  # MK-01b
                destrutivo=destrutivo,
            ))
        janela = rnd.randint(10, 14)  # MK-03b
        gordura = rnd.uniform(0.10, 0.20)  # MK-05
        sozinha = planejar(da_area, frota, horizonte=janela)
        assert not sozinha.nao_cabe, f"{area}: teste não cabe na janela {janela}"
        pedidos.append({"area": area, "carros": math.ceil(len(sozinha.prototipos()) * (1 + gordura)),
                        "semanas": janela, "gordura": round(gordura, 3)})
        testes += da_area
    return {"_fonte": "mock gerado por scripts/gerar_mock.py, semente 42; ver PREMISSAS.md",
            "prototipos": frota, "pedidos": pedidos,
            "testes": [t.__dict__ for t in testes]}


if __name__ == "__main__":
    dados = gerar()
    total = sum(p["carros"] for p in dados["pedidos"])
    destr = sum(t["destrutivo"] for t in dados["testes"])
    print(f"testes={len(dados['testes'])} destrutivos={destr} pedidos={total}",
          [(p["area"][:4], p["carros"], p["semanas"]) for p in dados["pedidos"]])
    if "--salvar" in sys.argv:
        Path(__file__).resolve().parents[1].joinpath("data", "mock.json").write_text(
            json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
