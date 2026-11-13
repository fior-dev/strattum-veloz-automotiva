import { useEffect, useState } from 'react'
import { api, type Comparativo, type Gestao, type Memoria, type Simulacao, type UsoSemana } from './api'

const n = (x: number) => x.toLocaleString('pt-BR')

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
        <p className="mt-2"><b>{g.criticos} de {g.testes_no_plano} testes ({Math.round((100 * g.criticos) / g.testes_no_plano)}%)</b> estão no caminho crítico, isto é, sem folga até o fim do plano: qualquer atraso neles,
          sem troca de carro, empurra o fim do plano.{g.folga_projeto > 0 && ' O lançamento só se move depois de gasta a folga do projeto.'} O número é alto porque o plano usa cada carro até a última semana: é o preço da frota menor.
          Para ter folga, a coordenação escolhe uma meta de fim mais cedo, na simulação abaixo.</p>
        <p className="text-xs text-grafite mt-2">Caminho crítico pela sequência de testes em cada carro (ADR 0007). Dependência técnica entre testes fica para o roadmap.</p>
      </div>
      <div>
        <p className="font-medium">Quanto custa comprar folga de prazo, com o destrutivo o quanto antes</p>
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
        <p className="text-xs text-grafite mt-1">Só leitura. Para adotar uma meta, use a simulação abaixo: a escolha é da coordenação.</p>
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

// Memória de cálculo: de onde sai o número de carros do plano (ticket 10)
export function MemoriaDeCalculo({ m, reserva }: { m: Memoria; reserva: number }) {
  const total = m.carros * m.semanas
  const partes = [
    { rotulo: 'em teste', valor: m.em_teste, classe: 'bg-tinta' },
    { rotulo: 'perdido: carro já destruído', valor: m.destruido, classe: 'destruido border border-linha' },
    { rotulo: 'vazio: carro inteiro, sem teste', valor: m.vazio, classe: 'bg-faixa' },
  ]
  return (
    <section className="bg-pista border border-linha rounded-md p-5">
      <h2 className="font-cond text-2xl font-semibold">De onde saem os {m.carros} carros do plano</h2>
      <ol className="mt-2 list-decimal pl-5 space-y-1 max-w-[85ch]">
        <li>Os {m.testes} testes do plano somam <b>{n(m.em_teste)} carros-semana</b> de teste: é a soma das durações, com os atrasos e as repetições já aceitos.</li>
        <li>Divididos pelas {m.semanas} semanas do plano, dão <b>{m.piso} carros</b>. É o piso: nenhum plano termina na semana {m.semanas} com menos.</li>
        <li>{m.destrutivos} testes destroem o carro. Depois do teste o carro não volta: são <b>{n(m.destruido)} carros-semana perdidos</b> até a semana {m.semanas}.</li>
        <li>Carros inteiros e sem teste somam <b>{n(m.vazio)} carros-semana</b>.</li>
        <li>({n(m.em_teste)} + {n(m.destruido)} + {n(m.vazio)}) ÷ {m.semanas} semanas = <b>{m.carros} carros no plano</b>.</li>
        <li>Reserva para reteste ainda livre: <b>{reserva} carros</b>. Total: <b>{m.carros + reserva}</b>.</li>
      </ol>
      <div className="mt-3 flex h-6 w-full max-w-3xl" role="img" aria-label={partes.map((p) => `${p.rotulo}: ${n(p.valor)} carros-semana`).join('; ')}>
        {partes.map((p) => <div key={p.rotulo} className={p.classe} style={{ width: `${(100 * p.valor) / total}%` }} title={`${p.rotulo}: ${n(p.valor)} carros-semana`} />)}
      </div>
      <ul className="mt-1 flex flex-wrap gap-4 text-sm">
        {partes.map((p) => <li key={p.rotulo} className="flex items-center gap-1.5"><span className={`w-3 h-3 ${p.classe}`} />{p.rotulo} ({n(p.valor)})</li>)}
      </ul>
      {m.carros > m.piso && m.destruido > 0 && <p className="text-sm mt-2 max-w-[85ch]">O plano tem {m.carros - m.piso} carros acima do piso. A causa é a regra do motor:
        o teste destrutivo roda o quanto antes, e o carro sai da frota cedo. Rodar o destrutivo no fim do carro elimina essa perda,
        mas o resultado do teste só chega no fim do plano. Essa escolha está na simulação do passo 4.</p>}
    </section>
  )
}

// Simulação: e se as áreas registrassem menos testes, a meta fosse outra, ou o destrutivo rodasse no fim? (ticket 10)
export function Simulador({ comp, g, folgaPct, podeAdotar, motivo, aoAdotar }: {
  comp: Comparativo; g: Gestao; folgaPct: number; podeAdotar: boolean; motivo: string; aoAdotar: () => void
}) {
  const [porArea, setPorArea] = useState(125)
  const [meta, setMeta] = useState(g.marco)
  const [noFim, setNoFim] = useState(false)
  const [s, setS] = useState<Simulacao>()
  const [erro, setErro] = useState('')
  const cenario = { meta, destrutivo_no_fim: noFim, folga: folgaPct / 100 }
  useEffect(() => {
    let vivo = true  // descarta a resposta de uma entrada que já mudou
    api.simular({ ...cenario, por_area: porArea }).then((r) => { if (vivo) { setS(r); setErro('') } }).catch((e) => vivo && setErro(e.message))
    return () => { vivo = false }
  }, [porArea, meta, noFim, folgaPct])

  const menos = (pedidos: number, carros: number) => `${pedidos - carros} (−${n(Math.round((1000 * (pedidos - carros)) / pedidos) / 10)}%)`
  const linhas: [string, React.ReactNode, React.ReactNode][] = s ? [
    ['Testes registrados pelas 5 áreas', comp.testes, s.testes],
    ['Processo atual: soma dos pedidos por área', comp.como_hoje.carros, s.pedidos],
    ['Carros no plano compartilhado', comp.proposto.carros_plano, s.carros_plano],
    ['Piso: mínimo de carros para essa meta', g.memoria.piso, s.memoria.piso],
    ['Reserva para reteste', comp.proposto.carros_reserva, s.carros_reserva],
    ['Frota total (plano + reserva)', comp.proposto.carros, s.carros],
    ['Carros a menos que o processo atual', menos(comp.como_hoje.carros, comp.proposto.carros), menos(s.pedidos, s.carros)],
    ['Semana em que o plano termina', g.fim_plano, s.semana_fim],
    ['Folga do projeto, até o lançamento', `${g.folga_projeto} sem.`, `${s.folga_projeto} sem.`],
    ['Testes sem folga até o fim do plano', `${g.criticos} de ${g.testes_no_plano}`, `${s.criticos} de ${s.testes - s.nao_cabe}`],
    ['Testes sem alocação', comp.proposto.nao_cabe, s.nao_cabe],
  ] : []
  const campo = 'border border-linha rounded-sm px-2 py-1 bg-pista'
  return (
    <section className="bg-pista border border-linha rounded-md p-5">
      <h2 className="font-cond text-2xl font-semibold">Simule antes de decidir</h2>
      <p className="text-sm mt-1 max-w-[85ch]">Mude as entradas e veja o plano que o motor montaria. As regras do motor são as mesmas; só os dados de entrada mudam.
        Nada aqui altera o plano em vigor até o gerente da coordenação adotar.</p>
      <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
        <label className="block font-medium">Testes que cada área registra: {porArea} ({porArea * 5} no total)
          <input type="range" min={25} max={125} step={25} value={porArea} onChange={(e) => setPorArea(Number(e.target.value))} className="block w-full accent-[var(--color-tinta)]" />
          <span className="font-normal text-grafite">Os {porArea} primeiros testes de cada área, na lista do mock.</span>
        </label>
        <label className="block font-medium">Meta de fim do plano
          <select className={`${campo} block mt-1`} value={meta} onChange={(e) => setMeta(Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((d) => <option key={d} value={g.marco - d}>semana {g.marco - d}{d ? `: ${d} semana${d > 1 ? 's' : ''} de folga` : ': sem folga'}</option>)}
          </select>
          <span className="font-normal text-grafite">O lançamento continua na semana {g.marco}.</span>
        </label>
        <label className="block font-medium">Quando roda o teste destrutivo
          <select className={`${campo} block mt-1`} value={noFim ? '1' : ''} onChange={(e) => setNoFim(e.target.value === '1')}>
            <option value="">O quanto antes: resultado cedo, carro perdido cedo</option>
            <option value="1">No fim do carro: resultado só no fim do plano</option>
          </select>
          <span className="font-normal text-grafite">Nos dois casos ele é o último teste do carro (RN-04).</span>
        </label>
      </div>
      {erro && <p className="mt-2 text-seg text-sm" role="alert">{erro}</p>}
      {s && <table className="mt-4 text-sm w-full max-w-3xl">
        <thead><tr className="text-left text-grafite"><th className="font-medium py-1">Número</th><th className="font-medium">Plano em vigor</th><th className="font-medium">Simulação</th></tr></thead>
        <tbody>{linhas.map(([rotulo, hoje, sim]) => (
          <tr key={rotulo} className="border-t border-linha"><th scope="row" className="py-1 font-normal text-left">{rotulo}</th><td>{hoje}</td>
            <td className={String(hoje) === String(sim) ? '' : 'font-semibold bg-faixa/30'}>{sim}</td></tr>
        ))}</tbody>
      </table>}
      {s && noFim && <p className="text-sm mt-2 max-w-[85ch]"><b>O que se perde com o destrutivo no fim:</b> o resultado dos {s.destrutivos} testes destrutivos só sai
        na semana {s.semana_fim}. Se um deles falha, a repetição só cabe nas semanas de folga que a meta deixar.</p>}
      {s && <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button disabled={!podeAdotar || porArea !== 125} className="px-3 py-1.5 rounded-sm bg-tinta text-pista font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => api.regerar(cenario).then(aoAdotar).catch((e) => setErro(e.message))}>
          Adotar esta simulação como o plano
        </button>
        <span className="text-grafite max-w-[60ch]">{porArea !== 125 ? 'Só dá para adotar com todos os testes registrados (125 por área).' : motivo ||
          'O plano é refeito do zero e vira uma versão nova. Imprevistos já aceitos não entram nele; a versão anterior fica para consulta.'}</span>
      </div>}
    </section>
  )
}
