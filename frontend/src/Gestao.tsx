import { useEffect, useState } from 'react'
import { api, type Comparativo, type Gestao, type Simulacao, type UsoSemana } from './api'
import { Selo } from './App'

const COR_SINAL = { verde: '#2e8b57', amarelo: '#f2b705', vermelho: '#c0392b' }
const n = (x: number) => x.toLocaleString('pt-BR')
const sem = (x: number) => `${x} semana${Math.abs(x) === 1 ? '' : 's'}`
const mi = (x: number) => `R$ ${x.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`

// Simulação: e se as áreas registrassem menos testes, a meta fosse outra, ou o destrutivo rodasse no fim? (tickets 10 e 11)
// O quadro do marco (folga do projeto e testes sem folga, ticket 04c) abre o bloco: é o motivo de simular.
export function Simulador({ comp, g, folgaPct, podeAdotar, motivo, aoAdotar }: {
  comp: Comparativo; g: Gestao; folgaPct: number; podeAdotar: boolean; motivo: string; aoAdotar: () => void
}) {
  const [porArea, setPorArea] = useState(125)
  const [meta, setMeta] = useState(g.marco)
  const [noFim, setNoFim] = useState(false)
  const [suvsSemana, setSuvsSemana] = useState(g.custos.suvs_semana)
  const custoSemana = suvsSemana * g.custos.preco_suv  // faturamento que uma semana de atraso adia, em milhões
  const [s, setS] = useState<Simulacao>()
  const [erro, setErro] = useState('')
  const cenario = { meta, destrutivo_no_fim: noFim, folga: folgaPct / 100 }
  useEffect(() => {
    let vivo = true  // descarta a resposta de uma entrada que já mudou
    api.simular({ ...cenario, por_area: porArea }).then((r) => { if (vivo) { setS(r); setErro('') } }).catch((e) => vivo && setErro(e.message))
    return () => { vivo = false }
  }, [porArea, meta, noFim, folgaPct])

  const menos = (pedidos: number, carros: number) => `${pedidos - carros} (−${n(Math.round((1000 * (pedidos - carros)) / pedidos) / 10)}%)`
  // ponytail: única conta de negócio feita na tela: semanas de folga × SUVs por semana que a pessoa digita × preço de venda.
  // Levar o valor digitado à rota furaria o cache de 350 combinações da simulação (ticket 10)
  const util = (folga: number) => Math.max(folga, 0)  // folga negativa não absorve nada
  const absorve = (folga: number) => mi(util(folga) * custoSemana)
  const linhas: [React.ReactNode, React.ReactNode, React.ReactNode][] = s ? [
    ['Testes registrados pelas 5 áreas', comp.testes, s.testes],
    ['Processo atual: soma dos pedidos por área', comp.como_hoje.carros, s.pedidos],
    ['Carros no plano compartilhado', comp.proposto.carros_plano, s.carros_plano],
    g.memoria.semanas === s.memoria.semanas
      ? [`Piso: mínimo de carros para terminar na semana ${s.memoria.semanas}`, g.memoria.piso, s.memoria.piso]
      : ['Piso: mínimo de carros para terminar na semana N', `${g.memoria.piso} (N = ${g.memoria.semanas})`, `${s.memoria.piso} (N = ${s.memoria.semanas})`],
    ['Reserva para reteste', comp.proposto.carros_reserva, s.carros_reserva],
    ['Frota total (plano + reserva)', comp.proposto.carros, s.carros],
    ['Carros a menos que o processo atual', menos(comp.como_hoje.carros, comp.proposto.carros), menos(s.pedidos, s.carros)],
    [<>Custo da frota, a {mi(g.custos.carro)} por carro<Selo id="MK-11" /></>, mi(g.custo_frota), mi(s.custo_frota)],
    ['Semana em que o plano termina', g.fim_plano, s.semana_fim],
    ['Folga do projeto, até o lançamento', sem(g.folga_projeto), sem(s.folga_projeto)],
    ['Faturamento que a folga protege de atraso', absorve(g.folga_projeto), absorve(s.folga_projeto)],
    ['Testes sem folga até o fim do plano', `${g.criticos} de ${g.testes_no_plano}`, `${s.criticos} de ${s.testes - s.nao_cabe}`],
    ['Testes sem alocação', comp.proposto.nao_cabe, s.nao_cabe],
  ] : []
  const campo = 'border border-linha rounded-sm px-2 py-1 bg-pista'
  // preço de cada meta em carros, com o destrutivo o quanto antes (a curva do backend só cobre essa regra)
  const maisCarros = (m: number) => {
    const c = g.curva_meta.find((x) => x.meta === m)
    return c && !noFim && porArea === 125 ? `, ${c.carros} carros no plano` : ''
  }
  const carrosAMais = s ? s.carros - comp.proposto.carros : 0
  const custoAMais = s ? s.custo_frota - g.custo_frota : 0
  const folgaAMais = s ? util(s.folga_projeto) - util(g.folga_projeto) : 0
  const atrasado = g.folga_projeto < 0
  return (
    <section className="bg-pista border border-linha rounded-md p-5">
      <h2 className="font-cond text-2xl font-semibold">Simule antes de decidir</h2>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 bg-asfalto rounded-sm px-3 py-2 text-sm max-w-4xl">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COR_SINAL[g.sinal] }} aria-hidden />
        <span className="sr-only">Sinal {g.sinal}.</span>
        {atrasado
          ? <span>Plano em vigor: <b>acaba na semana {g.fim_plano}, {sem(-g.folga_projeto)} depois do lançamento</b> (semana {g.marco}). Não há folga: qualquer novo atraso sem troca de carro piora a data.</span>
          : <><span>Plano em vigor: <b>folga do projeto de {sem(g.folga_projeto)}</b> (acaba na semana {g.fim_plano}, lançamento na {g.marco}).</span>
            <span><b>{g.criticos} de {g.testes_no_plano} testes ({Math.round((100 * g.criticos) / g.testes_no_plano)}%)</b> não têm folga até o fim do plano:
              se um deles atrasa e não há troca de carro, o fim do plano atrasa.</span></>}
      </p>
      <p className="text-sm mt-2 max-w-[85ch]">Mude as entradas e veja o plano que o motor montaria. As regras do motor são as mesmas; só os dados de entrada mudam.
        Nada aqui altera o plano em vigor até o gerente da coordenação adotar.</p>
      <div className="mt-3 grid md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
        <label className="block font-medium">Testes que cada área registra: {porArea} ({porArea * 5} no total)
          <input type="range" min={25} max={125} step={25} value={porArea} onChange={(e) => setPorArea(Number(e.target.value))} className="block w-full accent-[var(--color-tinta)]" />
          <span className="font-normal text-grafite">Os {porArea} primeiros testes de cada área, na lista do mock.</span>
        </label>
        <label className="block font-medium">Meta de fim do plano
          <select className={`${campo} block mt-1 max-w-full`} value={meta} onChange={(e) => setMeta(Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((d) => <option key={d} value={g.marco - d}>semana {g.marco - d}{d ? `: ${d} semana${d > 1 ? 's' : ''} de folga` : ': sem folga'}{maisCarros(g.marco - d)}</option>)}
          </select>
          <span className="font-normal text-grafite">O lançamento continua na semana {g.marco}.</span>
        </label>
        <label className="block font-medium">Quando roda o teste destrutivo
          <select className={`${campo} block mt-1 max-w-full`} value={noFim ? '1' : ''} onChange={(e) => setNoFim(e.target.value === '1')}>
            <option value="">O quanto antes: resultado cedo</option>
            <option value="1">No fim do carro: resultado só no fim</option>
          </select>
          <span className="font-normal text-grafite">Nos dois casos ele é o último teste do carro (RN-04).</span>
        </label>
        <label className="block font-medium">Quanto uma semana de atraso no lançamento adia de faturamento
          <span className="flex flex-wrap items-center gap-1 mt-1 font-normal"><input type="number" min={0} max={20000} step={100} value={suvsSemana}
            onChange={(e) => setSuvsSemana(Math.max(0, Number(e.target.value) || 0))} className={`${campo} w-24`} aria-label="SUVs vendidos por semana" />
            SUVs por semana<Selo id="MK-10" /> × R$ 150 mil = <b>{mi(custoSemana)}</b></span>
          <span className="font-normal text-grafite">R$ 150 mil é o preço de venda do SUV (discovery). O volume de {n(g.custos.suvs_semana)} por semana é suposição: troque pelo número real.</span>
        </label>
      </div>
      {erro && <p className="mt-2 text-seg text-sm" role="alert">{erro}</p>}
      {s && <table className="mt-4 text-sm w-full max-w-3xl">
        <thead><tr className="text-left text-grafite"><th className="font-medium py-1">Número</th><th className="font-medium">Plano em vigor</th><th className="font-medium">Simulação</th></tr></thead>
        <tbody>{linhas.map(([rotulo, hoje, sim], i) => (
          <tr key={i} className="border-t border-linha"><th scope="row" className="py-1 font-normal text-left">{rotulo}</th><td>{hoje}</td>
            <td className={String(hoje) === String(sim) ? '' : 'font-semibold bg-faixa/30'}>{sim}</td></tr>
        ))}</tbody>
      </table>}
      {s && porArea === 125 && !atrasado && (carrosAMais !== 0 || folgaAMais !== 0) && <p className="text-sm mt-2 max-w-[85ch]"><b>A troca, em dinheiro:</b>{' '}
        {[carrosAMais > 0 && `${carrosAMais} carro${carrosAMais === 1 ? '' : 's'} a mais custam ${mi(custoAMais)}`,
          carrosAMais < 0 && `${-carrosAMais} carro${carrosAMais === -1 ? '' : 's'} a menos poupam ${mi(-custoAMais)}`,
          folgaAMais > 0 && `${sem(folgaAMais)} de folga a mais protegem até ${mi(folgaAMais * custoSemana)} de faturamento`,
          folgaAMais < 0 && `${sem(-folgaAMais)} de folga a menos deixam de proteger ${mi(-folgaAMais * custoSemana)} de faturamento`].filter(Boolean).join('; ')}.
        {folgaAMais > 0 && ' É faturamento que deixa de entrar na data, não lucro; e a folga só vale se o atraso acontecer.'}</p>}
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

// Carros em uso × parados por semana: um gráfico por cenário, na mesma escala (ticket 11)
const parados = (us: UsoSemana[]) => us.reduce((s, u) => s + u.parados, 0)

function Grafico({ us, titulo, max }: { us: UsoSemana[]; titulo: string; max: number }) {
  return (
    <div className="mt-4 grid md:grid-cols-[1fr_11rem] gap-4 items-end">
      <div>
        <h3 className="font-cond font-semibold text-lg">{titulo}</h3>
        <div className="mt-1 grid gap-1 items-end" style={{ gridTemplateColumns: `repeat(${us.length}, minmax(0, 1fr))` }}>
          {us.map((u) => (
            <div key={u.semana} className="flex flex-col items-center">
              <div className="flex flex-col-reverse w-full h-28" title={`${titulo}, semana ${u.semana}: ${u.em_uso} em uso, ${u.parados} parados, ${u.fora} destruídos`}>
                <div style={{ height: `${(100 * u.em_uso) / max}%` }} className="bg-tinta" />
                <div style={{ height: `${(100 * u.parados) / max}%` }} className="bg-faixa" />
                <div style={{ height: `${(100 * u.fora) / max}%` }} className="destruido" />
              </div>
              <span className="text-xs font-cond mt-1">S{u.semana}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="md:border-l border-linha md:pl-4 pb-5">
        <span className="font-cond text-4xl font-bold block leading-none">{n(parados(us))}</span>
        <span className="text-sm text-grafite">carros-semana parados nas {us.length} semanas</span>
      </p>
    </div>
  )
}

export function UsoFrota({ g, comp }: { g: Gestao; comp: Comparativo }) {
  const max = Math.max(...g.uso.como_hoje.map(total), ...g.uso.plano.map(total))
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
      <p className="text-sm mt-1">Os dois gráficos usam a mesma escala: a altura da barra é o número de carros na semana.</p>
      <Grafico max={max} us={g.uso.como_hoje} titulo={`Processo atual: pedidos por área (${comp.como_hoje.carros} carros)`} />
      <Grafico max={max} us={g.uso.plano} titulo={`Plano compartilhado (${comp.proposto.carros} carros)`} />
    </section>
  )
}

const total = (u: UsoSemana) => u.em_uso + u.parados + u.fora
