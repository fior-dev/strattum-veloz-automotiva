import { useEffect, useState } from 'react'
import { api, type Alocacao, type Comparativo, type Plano, type Proposta } from './api'
import { Gantt, Legenda } from './Gantt'
import { PainelProposta, PainelTeste } from './Paineis'

// RF-07: todo número que vem do mock leva o selo com o ID da premissa (PREMISSAS.md)
export function Selo({ id }: { id: string }) {
  return (
    <span title={`Dado suposto. Ver ${id} em PREMISSAS.md`}
      className="inline-block align-middle ml-1 px-1.5 rounded-sm bg-faixa text-tinta text-[0.7rem] font-cond font-semibold">
      mock {id}
    </span>
  )
}

function Numero({ titulo, carros, semana, selo, detalhe }: { titulo: string; carros: number; semana: number; selo: string; detalhe: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-grafite font-medium">{titulo}<Selo id={selo} /></h2>
      <p className="font-cond text-6xl font-bold leading-none mt-1">{carros}<span className="text-2xl font-semibold"> carros</span></p>
      <p className="mt-1">testes terminam na semana <b>{semana}</b></p>
      <div className="text-sm text-grafite mt-1">{detalhe}</div>
    </div>
  )
}

export default function App() {
  const [plano, setPlano] = useState<Plano>()
  const [comp, setComp] = useState<Comparativo>()
  const [folga, setFolga] = useState(10)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState<number>() // undefined = a atual
  const [aberto, setAberto] = useState<Alocacao>()
  const [proposta, setProposta] = useState<Proposta>()
  const [busca, setBusca] = useState('')

  const carregar = (v?: number) =>
    Promise.all([api.plano(v), api.comparativo(), api.proposta()])
      .then(([p, c, pr]) => { setPlano(p); setComp(c); setProposta(pr.proposta ?? undefined); setErro('') })
      .catch((e) => setErro(e.message))
  useEffect(() => { carregar() }, [])

  const verVersao = (v?: number) => { setVersao(v); setAberto(undefined); carregar(v) }
  const abrirTeste = (id: string) => {
    const doTeste = plano?.alocacoes.filter((a) => a.teste_id === id.trim().toUpperCase()) ?? []
    if (doTeste.length) setAberto(doTeste[doTeste.length - 1])
  }
  const atual = versao === undefined
  const destaque = new Set([...(proposta?.sugestoes.map((s) => s.teste_id) ?? []), ...(proposta?.impactados.map((i) => i.teste_id) ?? [])])

  const mudarFolga = (pct: number) => {
    setFolga(pct)
    api.folga(pct / 100).then(() => carregar()).catch((e) => setErro(e.message))
  }

  if (erro) return (
    <main className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold">Não consegui falar com o backend</h1>
      <p className="mt-2">{erro}. Confira se a API está no ar em http://127.0.0.1:8000/docs (comando no README) e recarregue a página.</p>
    </main>
  )
  if (!plano || !comp) return <main className="p-8">Carregando o plano…</main>

  return (
    <main className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-cond text-3xl font-bold">Frota de protótipos do SUV</h1>
        <p className="text-grafite">Veloz Automotiva · plano versão {plano.versao} ({plano.estado}) · {comp.testes} testes das 5 engenharias<Selo id="MK-01" /></p>
      </header>

      <section className="mt-6 grid md:grid-cols-[1fr_1fr_1.2fr] gap-6 bg-pista border border-linha rounded-md p-5">
        <Numero titulo="Como hoje: soma dos pedidos" carros={comp.como_hoje.carros} semana={comp.como_hoje.semana_fim} selo="MK-03"
          detalhe={comp.como_hoje.por_area.map((p) => `${p.area.split('/')[0]} ${p.carros}`).join(' · ')} />
        <Numero titulo="Plano compartilhado" carros={comp.proposto.carros} semana={comp.proposto.semana_fim} selo="MK-06"
          detalhe={<>{comp.proposto.carros_plano} no plano + {comp.proposto.carros_reserva} de folga de reteste
            {comp.proposto.nao_cabe > 0 && <> · <b className="text-seg">{comp.proposto.nao_cabe} testes não cabem</b></>}</>} />
        <div className="md:border-l border-linha md:pl-6">
          <p className="font-cond text-4xl font-bold">{comp.reducao_pct > 0 ? '−' : '+'}{Math.abs(comp.reducao_pct)}% de frota</p>
          <p className="text-sm mt-1">A frota cai porque um carro que uma área libera passa a servir a outra, e a gordura de cada pedido vira uma folga única e à vista.
            O preço é terminar mais perto da semana 20, que ainda é o limite.</p>
          <label className="block mt-3 text-sm font-medium" htmlFor="folga">
            Folga de reteste: {folga}% dos {comp.destrutivos} testes destrutivos = {comp.proposto.carros_reserva} carros<Selo id="MK-06" />
          </label>
          <input id="folga" type="range" min={0} max={30} step={5} value={folga} onChange={(e) => mudarFolga(Number(e.target.value))}
            disabled={!atual} className="w-full accent-[var(--color-tinta)]" />
          <p className="text-xs text-grafite">Só o teste destrutivo que falha precisa de carro novo. O não destrutivo repete no mesmo carro (RN-08).</p>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 className="font-cond text-2xl font-semibold">Quem usa cada carro, semana a semana</h2>
          <Legenda areas={plano.areas} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
          <form onSubmit={(e) => { e.preventDefault(); abrirTeste(busca) }} className="flex gap-1">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="ID do teste, ex.: AER-99" list="ids"
              className="border border-linha rounded-sm px-2 py-1 bg-pista w-48" aria-label="Abrir teste pelo ID" />
            <datalist id="ids">{Object.keys(plano.testes).map((id) => <option key={id} value={id} />)}</datalist>
            <button className="px-3 py-1 rounded-sm bg-tinta text-pista cursor-pointer">Abrir teste</button>
          </form>
          <span className="text-grafite">ou clique numa barra.</span>
          <label className="ml-auto">Versão do plano{' '}
            <select className="border border-linha rounded-sm px-2 py-1 bg-pista" value={versao ?? ''}
              onChange={(e) => verVersao(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">atual (v{plano.versoes[plano.versoes.length - 1]})</option>
              {plano.versoes.slice(0, -1).map((v) => <option key={v} value={v}>v{v}, consulta</option>)}
            </select>
          </label>
        </div>
        <div className="grid lg:grid-cols-[1fr_24rem] gap-4 items-start">
          <Gantt plano={plano} aoClicar={setAberto} destaque={destaque} />
          <div className="space-y-4 lg:sticky lg:top-4">
            {proposta && <PainelProposta proposta={proposta} plano={plano}
              aoDecidir={() => { setProposta(undefined); setAberto(undefined); carregar() }} />}
            {aberto && <PainelTeste plano={plano} aloc={aberto} somenteLeitura={!atual} key={`${aberto.teste_id}-${aberto.inicio}`}
              aoProposta={(p) => { setProposta(p); setAberto(undefined) }} aoMudar={() => { setAberto(undefined); carregar() }}
              aoFechar={() => setAberto(undefined)} />}
            {!proposta && !aberto && <p className="text-sm text-grafite bg-pista border border-linha rounded-md p-4">
              Abra um teste para registrar que começou, terminou, atrasou ou falhou, ou para registrar uma avaria no carro.
              Se outro teste for afetado, o sistema propõe a troca e o gerente da coordenação decide.</p>}
            {plano.nao_cabe.length > 0 && <div className="bg-pista border border-seg rounded-md p-4 text-sm">
              <p className="font-medium text-seg">Testes sem carro no plano</p>
              <ul className="list-disc pl-5">{plano.nao_cabe.map((n) => <li key={n.teste_id}><b>{n.teste_id}</b>: {n.motivo}</li>)}</ul>
            </div>}
          </div>
        </div>
      </section>
    </main>
  )
}
