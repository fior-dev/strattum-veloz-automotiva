import type { Gestao, UsoSemana } from './api'

const COR_SINAL = { verde: '#2e8b57', amarelo: '#f2b705', vermelho: '#c0392b' }

// Marco do lançamento e caminho crítico (ticket 04c, D8)
export function Marco({ g }: { g: Gestao }) {
  return (
    <section className="bg-pista border border-linha rounded-md p-5 grid md:grid-cols-[1fr_1.3fr] gap-6">
      <div>
        <h2 className="font-cond text-2xl font-semibold">O que segura a data de lançamento</h2>
        <p className="mt-2 flex items-center gap-2 text-lg">
          <span className="w-4 h-4 rounded-full" style={{ background: COR_SINAL[g.sinal] }} aria-hidden />
          Folga do projeto: <b>{g.folga_projeto} semana{Math.abs(g.folga_projeto) === 1 ? '' : 's'}</b>
          <span className="text-grafite text-base">(marco na semana {g.marco}, plano acaba na {g.fim_plano})</span>
        </p>
        <p className="mt-2"><b>{g.criticos} de {g.testes_no_plano} testes</b> estão no caminho crítico: qualquer atraso neles,
          sem troca de carro, empurra o lançamento. O plano compartilhado troca folga de prazo por carros a menos.</p>
        <p className="text-xs text-grafite mt-2">Caminho crítico pela sequência de testes em cada carro (ADR 0007). Dependência técnica entre testes fica para o roadmap.</p>
      </div>
      <div>
        <p className="font-medium">Quanto custa comprar folga de prazo</p>
        <table className="mt-1 text-sm w-full max-w-md">
          <thead><tr className="text-left text-grafite"><th className="font-medium py-1">Meta de fim</th><th className="font-medium">Carros no plano</th><th className="font-medium">Folga do projeto</th></tr></thead>
          <tbody>
            {g.curva_meta.map((c, i) => (
              <tr key={c.meta} className="border-t border-linha">
                <td className="py-1">semana {c.meta}</td>
                <td>{c.carros}{i > 0 && <span className="text-grafite"> (+{c.carros - g.curva_meta[0].carros})</span>}</td>
                <td>{c.folga_projeto} sem.</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-grafite mt-1">Só leitura: o plano em vigor não muda. Escolher a meta é decisão da coordenação.</p>
      </div>
    </section>
  )
}

// Histograma de recursos: carros em uso × parados por semana, nos pedidos por área e no plano
export function UsoFrota({ g }: { g: Gestao }) {
  const max = Math.max(...g.uso.como_hoje.map(total), ...g.uso.plano.map(total))
  const Barra = ({ u, rotulo }: { u: UsoSemana; rotulo: string }) => (
    <div className="flex flex-col-reverse w-full h-40" title={`${rotulo}, semana ${u.semana}: ${u.em_uso} em uso, ${u.parados} parados, ${u.fora} destruídos`}>
      <div style={{ height: `${(100 * u.em_uso) / max}%` }} className="bg-tinta" />
      <div style={{ height: `${(100 * u.parados) / max}%` }} className="bg-faixa" />
      <div style={{ height: `${(100 * u.fora) / max}%` }} className="destruido" />
    </div>
  )
  const parados = (us: UsoSemana[]) => us.reduce((s, u) => s + u.parados, 0)
  return (
    <section className="bg-pista border border-linha rounded-md p-5">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <h2 className="font-cond text-2xl font-semibold">Carros em uso e parados, semana a semana</h2>
        <ul className="flex flex-wrap gap-4 text-sm">
          <li className="flex items-center gap-1.5"><span className="w-3 h-3 bg-tinta" />em uso</li>
          <li className="flex items-center gap-1.5"><span className="w-3 h-3 bg-faixa" />parado</li>
          <li className="flex items-center gap-1.5"><span className="w-3 h-3 destruido border border-linha" />destruído</li>
        </ul>
      </div>
      <p className="text-sm mt-1">Em cada semana, a barra da esquerda são os pedidos por área (processo atual) e a da direita, o plano compartilhado.
        Somando as 20 semanas: <b>{parados(g.uso.como_hoje).toLocaleString('pt-BR')}</b> carros-semana parados nos pedidos por área, contra <b>{parados(g.uso.plano).toLocaleString('pt-BR')}</b> no plano.</p>
      <div className="mt-3 grid gap-1 items-end" style={{ gridTemplateColumns: `repeat(${g.uso.plano.length}, 1fr)` }}>
        {g.uso.plano.map((u, i) => (
          <div key={u.semana} className="flex flex-col items-center">
            <div className="flex gap-px w-full"><Barra u={g.uso.como_hoje[i]} rotulo="Pedidos por área" /><Barra u={u} rotulo="Plano" /></div>
            <span className="text-xs font-cond mt-1">S{u.semana}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const total = (u: UsoSemana) => u.em_uso + u.parados + u.fora
