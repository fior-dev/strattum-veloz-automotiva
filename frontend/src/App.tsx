import { useEffect, useState } from 'react'
import { api, type Alocacao, type Comparativo, type Gestao, type Plano, type Proposta } from './api'
import { Marco, UsoFrota } from './Gestao'
import { Copiloto } from './Copiloto'
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

const TUDO = 6
const PASSOS = ['Como é hoje', 'O plano compartilhado', 'A conta da frota', 'O que segura o lançamento', 'O imprevisto']

// Apresentação guiada: a tela se monta em 5 passos, cada um com a explicação do que apareceu
function Guia({ passo, ir, comp, g }: { passo: number; ir: (p: number) => void; comp: Comparativo; g: Gestao }) {
  const botao = 'px-3 py-1.5 rounded-sm border border-pista/50 hover:bg-pista/15 cursor-pointer disabled:opacity-40'
  if (passo === TUDO) return (
    <p className="mt-4 text-sm"><button className="px-3 py-1.5 rounded-sm border border-tinta/30 bg-pista hover:brightness-95 cursor-pointer" onClick={() => ir(1)}>Ver o passo a passo</button></p>
  )
  const p = comp.proposto
  const texto = [
    <>Cada engenharia manda uma planilha com <b>"N carros por S semanas"</b>, sem dizer que testes vai rodar. A coordenação soma os
      5 pedidos: <b>{comp.como_hoje.carros} carros</b>. Dentro de cada pedido há uma gordura de 10 a 20% contra reprovação, de tamanho
      desconhecido. Um carro que uma área libera na semana 10 fica parado: ninguém mais o vê.</>,
    <>O sistema troca a pergunta: em vez de "quantos carros?", cada área informa <b>os testes</b> (duração, e se destrói o carro).
      Com os {comp.testes} testes das 5 áreas num calendário só, o motor monta o plano com 4 regras: os testes mais longos entram
      primeiro; cada teste vai para o carro já em uso que fica livre mais cedo; só abre carro novo se nenhum serve; o teste
      destrutivo é sempre o último do carro. Resultado: <b>{p.carros_plano} carros</b>. Cada linha é um carro, cada barra é um teste, a cor é a área.</>,
    <>A gordura escondida vira uma folga à vista: <b>{p.carros_reserva} carros de reserva</b>, para repetir teste destrutivo que
      falha. {p.carros_plano} + {p.carros_reserva} = <b>{p.carros}</b>, contra {comp.como_hoje.carros} dos pedidos:
      {' '}<b>{comp.como_hoje.carros - p.carros} carros a menos</b>. Mexa no controle da folga para ver quanto custa cada ponto.
      O gráfico de baixo mostra o motivo: nos pedidos por área, os carros passam a maior parte do tempo parados.</>,
    <>O preço da frota menor é o prazo. O plano enche cada carro até a semana {g.fim_plano}, então <b>{g.criticos} de {g.testes_no_plano} testes</b>{' '}
      estão no caminho crítico: se um deles atrasa e não há troca de carro, o lançamento atrasa. A tabela mostra quanto custa
      comprar prazo. Escolher a meta é decisão da coordenação, não do sistema.</>,
    <>Agora um imprevisto. Escreva no copiloto <b>"o teste AER-99 atrasou 2 semanas"</b>, ou abra o teste e clique em Atrasou.
      O sistema mostra quem é afetado, propõe a troca de carro e diz se o lançamento se move. Nada muda até o gerente da
      coordenação aceitar; o aceite cria a versão 2 do plano e a versão 1 fica para consulta.</>,
  ][passo - 1]
  return (
    <section className="mt-4 bg-tinta text-pista rounded-md p-5" aria-live="polite">
      <p className="font-cond text-lg">Passo {passo} de 5</p>
      <h2 className="font-cond text-3xl font-bold">{PASSOS[passo - 1]}</h2>
      <p className="mt-2 max-w-[75ch]">{texto}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <button className={botao} disabled={passo === 1} onClick={() => ir(passo - 1)}>Anterior</button>
        <button className="px-3 py-1.5 rounded-sm bg-faixa text-tinta font-semibold cursor-pointer" onClick={() => ir(passo + 1)}>
          {passo === 5 ? 'Ver a tela inteira' : `Próximo: ${PASSOS[passo]}`}
        </button>
        {passo < 5 && <button className={botao} onClick={() => ir(TUDO)}>Pular: ver a tela inteira</button>}
      </div>
    </section>
  )
}

// O que a coordenação recebe hoje: uma linha por área, sem a lista de testes (D1, MK-03)
function PedidosPorArea({ comp }: { comp: Comparativo }) {
  return (
    <section className="mt-6 bg-pista border border-linha rounded-md p-5 max-w-2xl">
      <h2 className="font-cond text-2xl font-semibold">A planilha de hoje: o pedido de cada área<Selo id="MK-03" /></h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left text-grafite"><th className="font-medium py-1">Área</th><th className="font-medium">Carros pedidos</th><th className="font-medium">Por quantas semanas</th></tr></thead>
        <tbody>
          {comp.como_hoje.por_area.map((p) => (
            <tr key={p.area} className="border-t border-linha"><td className="py-1">{p.area}</td><td>{p.carros}</td><td>{p.semanas}</td></tr>
          ))}
          <tr className="border-t-2 border-tinta font-semibold"><td className="py-1">Soma</td><td>{comp.como_hoje.carros}</td><td>até a semana {comp.como_hoje.semana_fim}</td></tr>
        </tbody>
      </table>
      <p className="text-xs text-grafite mt-2">Os números são do mock: o motor planejou cada área sozinha, na janela que ela quer, e somou a gordura de 10 a 20% (MK-05).</p>
    </section>
  )
}

export default function App() {
  const [plano, setPlano] = useState<Plano>()
  const [comp, setComp] = useState<Comparativo>()
  const [gestao, setGestao] = useState<Gestao>()
  const [folga, setFolga] = useState(10)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState<number>() // undefined = a atual
  const [aberto, setAberto] = useState<Alocacao>()
  const [proposta, setProposta] = useState<Proposta>()
  const [busca, setBusca] = useState('')
  const [naoAchei, setNaoAchei] = useState('')
  const [passo, setPasso] = useState(1)
  // ponytail: perfil simulado, só na tela; a API não confere quem chama. Login e perfis são v2 (ADR 0005)
  const [perfil, setPerfil] = useState<'gerente' | 'engenharia'>('gerente')

  const carregar = (v?: number) =>
    Promise.all([api.plano(v), api.comparativo(), api.proposta(), api.gestao(v)])
      .then(([p, c, pr, g]) => { setPlano(p); setComp(c); setProposta(pr.proposta ?? undefined); setGestao(g); setErro('') })
      .catch((e) => setErro(e.message))
  useEffect(() => { carregar() }, [])
  // proposta pendente precisa do passo 5 (é lá que ela aparece); o usuário continua livre para voltar
  useEffect(() => { if (proposta) setPasso((s) => Math.max(s, 5)) }, [proposta])

  const verVersao = (v?: number) => { setVersao(v); setAberto(undefined); carregar(v) }
  const abrirTeste = (id: string) => {
    const doTeste = plano?.alocacoes.filter((a) => a.teste_id === id.trim().toUpperCase()) ?? []
    if (doTeste.length) { setAberto(doTeste[doTeste.length - 1]); setNaoAchei('') }
    else setNaoAchei(id.trim() ? `Não achei o teste ${id.trim().toUpperCase()} neste plano.` : 'Digite o ID de um teste.')
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
  if (!plano || !comp || !gestao) return <main className="p-8">Carregando o plano…</main>

  const p = passo
  const menos = comp.como_hoje.carros - comp.proposto.carros

  return (
    <main className="px-4 md:px-8 py-6 max-w-[1500px] mx-auto">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-cond text-3xl font-bold">Frota de protótipos do SUV</h1>
        <p className="text-grafite">Veloz Automotiva · plano versão {plano.versao} ({plano.estado}) · {comp.testes} testes das 5 engenharias<Selo id="MK-01" /></p>
        <label className="text-sm w-full md:w-auto">Você está como{' '}
          <select className="border border-linha rounded-sm px-2 py-1 bg-pista" value={perfil} onChange={(e) => setPerfil(e.target.value as typeof perfil)}>
            <option value="gerente">Gerente da coordenação: aceita e recusa propostas</option>
            <option value="engenharia">Engenharia de uma área: registra status e avaria</option>
          </select>
          <span className="text-grafite"> (simulação: o protótipo não tem login)</span>
        </label>
      </header>

      <Guia passo={p} ir={setPasso} comp={comp} g={gestao} />

      {p === 1 && <PedidosPorArea comp={comp} />}

      {p >= 3 && <section className="mt-6 grid md:grid-cols-[1fr_1fr_1.2fr] gap-6 bg-pista border border-linha rounded-md p-5">
        <Numero titulo="Processo atual: pedidos por área, somados" carros={comp.como_hoje.carros} semana={comp.como_hoje.semana_fim} selo="MK-03"
          detalhe={comp.como_hoje.por_area.map((x) => `${x.area.split('/')[0]} ${x.carros}`).join(' · ')} />
        <Numero titulo="Plano compartilhado" carros={comp.proposto.carros} semana={comp.proposto.semana_fim} selo="MK-06"
          detalhe={<>{comp.proposto.carros_plano} no plano + {comp.proposto.carros_reserva} de folga de reteste
            {comp.proposto.nao_cabe > 0 && <> · <b className="text-seg">{comp.proposto.nao_cabe} testes sem alocação</b></>}</>} />
        <div className="md:border-l border-linha md:pl-6">
          <p className="font-cond text-4xl font-bold">{Math.abs(menos)} carros a {menos >= 0 ? 'menos' : 'mais'} ({menos >= 0 ? '−' : '+'}{Math.abs(comp.reducao_pct).toLocaleString('pt-BR')}%)</p>
          <p className="text-sm mt-1">A frota cai porque um carro que uma área libera passa a servir a outra, e a gordura de cada pedido vira uma folga única e à vista.
            O preço é terminar mais perto da semana 20, que ainda é o limite.</p>
          <label className="block mt-3 text-sm font-medium" htmlFor="folga">
            Folga de reteste: {folga}% dos {comp.destrutivos} testes destrutivos = {comp.proposto.carros_reserva} carros<Selo id="MK-06" />
          </label>
          <input id="folga" type="range" min={0} max={30} step={5} value={folga} onChange={(e) => mudarFolga(Number(e.target.value))}
            disabled={!atual || !!proposta} title={proposta ? 'Aceite ou recuse a proposta antes de mudar a folga' : undefined} className="w-full accent-[var(--color-tinta)]" />
          <p className="text-xs text-grafite">Carros de reserva, fora do plano, para repetir um teste destrutivo que falha. O não destrutivo repete no mesmo carro (RN-08).</p>
        </div>
      </section>}

      {p >= 4 && <div className="mt-6"><Marco g={gestao} /></div>}

      {p >= 2 && <section className="mt-6">
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
          <span className={naoAchei ? 'text-seg font-medium' : 'text-grafite'} role="status">{naoAchei || 'ou clique numa barra.'}</span>
          <label className="ml-auto">Versão do plano{' '}
            <select className="border border-linha rounded-sm px-2 py-1 bg-pista" value={versao ?? ''}
              onChange={(e) => verVersao(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">atual (v{plano.versoes[plano.versoes.length - 1]})</option>
              {plano.versoes.slice(0, -1).map((v) => <option key={v} value={v}>v{v}, consulta</option>)}
            </select>
          </label>
        </div>
        <div className="grid lg:grid-cols-[1fr_24rem] gap-4 items-start">
          <Gantt plano={plano} aoClicar={setAberto} destaque={destaque} folgas={gestao.folgas} marco={gestao.marco} />
          <div className="space-y-4 lg:sticky lg:top-4">
            {atual && p >= 5 && <Copiloto aoProposta={() => carregar()} />}
            {proposta && <PainelProposta proposta={proposta} plano={plano} podeDecidir={perfil === 'gerente'}
              aoDecidir={() => { setProposta(undefined); setAberto(undefined); carregar() }} />}
            {aberto && <PainelTeste plano={plano} aloc={aberto} somenteLeitura={!atual} key={`${aberto.teste_id}-${aberto.inicio}`}
              aoProposta={(pr) => { setProposta(pr); setAberto(undefined) }} aoMudar={() => { setAberto(undefined); carregar() }}
              aoFechar={() => setAberto(undefined)} />}
            {!proposta && !aberto && <p className="text-sm text-grafite bg-pista border border-linha rounded-md p-4">
              Abra um teste para registrar que começou, terminou, atrasou ou falhou, ou para registrar uma avaria no carro.
              Se outro teste for afetado, o sistema propõe a troca e o gerente da coordenação decide.</p>}
            {plano.avarias.length > 0 && <div className="bg-pista border border-linha rounded-md p-4 text-sm">
              <p className="font-medium">Avarias registradas nesta versão ({plano.avarias.length})</p>
              <ul className="list-disc pl-5">{plano.avarias.map((v, i) => (
                <li key={i}><b>{v.prototipo_id}</b>: {v.tipo}, {v.gravidade === 'leve' ? 'leve' : <span className="text-seg">compromete reuso</span>}, semana {v.semana} · {v.area}</li>
              ))}</ul>
            </div>}
            {plano.nao_cabe.length > 0 && <div className="bg-pista border border-seg rounded-md p-4 text-sm">
              <p className="font-medium text-seg">Testes ou retestes sem alocação: não couberam até a semana 20</p>
              <ul className="list-disc pl-5">{plano.nao_cabe.map((n, i) => <li key={i}><b>{n.teste_id}</b>: {n.motivo}</li>)}</ul>
            </div>}
          </div>
        </div>
      </section>}

      {p >= 3 && <div className="mt-6"><UsoFrota g={gestao} /></div>}
    </main>
  )
}
