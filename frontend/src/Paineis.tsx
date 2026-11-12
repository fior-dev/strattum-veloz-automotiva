import { useState } from 'react'
import { COR_AREA, replan, type Alocacao, type Plano, type Proposta } from './api'

const botao = 'px-3 py-1.5 rounded-sm border border-tinta/30 hover:bg-asfalto cursor-pointer disabled:opacity-40'
const primario = 'px-3 py-1.5 rounded-sm bg-tinta text-pista hover:brightness-125 cursor-pointer'

const NOME_STATUS: Record<string, string> = {
  planejado: 'Planejado', em_andamento: 'Em andamento', atrasado: 'Atrasado', falhou: 'Falhou', concluido: 'Concluído',
}

// O que a engenharia informa sobre um teste e sobre o carro dele (RF-05, RF-08)
export function PainelTeste({ plano, aloc, somenteLeitura, aoProposta, aoMudar, aoFechar }: {
  plano: Plano; aloc: Alocacao; somenteLeitura: boolean
  aoProposta: (p: Proposta) => void; aoMudar: () => void; aoFechar: () => void
}) {
  const t = plano.testes[aloc.teste_id]
  const [semanas, setSemanas] = useState(1)
  const [avaria, setAvaria] = useState({ tipo: 'lataria', gravidade: 'leve', semana: aloc.fim })
  const [erro, setErro] = useState('')

  const enviar = (p: Promise<{ proposta: Proposta | null }>) =>
    p.then((r) => (r.proposta ? aoProposta(r.proposta) : aoMudar())).catch((e) => setErro(e.message))

  return (
    <aside className="bg-pista border border-linha rounded-md p-4 text-sm space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-cond text-xl font-semibold">
            <span className="inline-block w-3 h-3 rounded-sm mr-1.5" style={{ background: COR_AREA[t.area] }} />
            {t.id} · {t.nome}
          </p>
          <p className="text-grafite">{t.area} · {aloc.prototipo_id} · semanas {aloc.inicio} a {aloc.fim}
            {t.destrutivo && ' · destrutivo'}{aloc.reteste && ' · reteste'}</p>
          <p>Status: <b>{NOME_STATUS[plano.status[t.id]]}</b></p>
        </div>
        <button className={botao} onClick={aoFechar} aria-label="Fechar">Fechar</button>
      </div>

      {somenteLeitura ? <p className="text-grafite">Esta é uma versão antiga do plano. Volte à versão atual para registrar mudanças.</p> : <>
        <fieldset className="space-y-2">
          <legend className="font-medium">O que aconteceu com o teste</legend>
          <div className="flex flex-wrap gap-2">
            <button className={botao} onClick={() => enviar(replan.status(t.id, 'em_andamento'))}>Começou</button>
            <button className={botao} onClick={() => enviar(replan.status(t.id, 'concluido'))}>Terminou</button>
            <button className={botao} onClick={() => enviar(replan.status(t.id, 'falhou'))}>Falhou, vai repetir</button>
          </div>
          <div className="flex items-center gap-2">
            <button className={botao} onClick={() => enviar(replan.status(t.id, 'atrasado', semanas))}>Atrasou</button>
            <input type="number" min={1} max={10} value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}
              className="w-16 border border-linha rounded-sm px-2 py-1" aria-label="Semanas de atraso" />
            <span>semana(s)</span>
          </div>
        </fieldset>

        <fieldset className="space-y-2 border-t border-linha pt-3">
          <legend className="font-medium">Avaria no {aloc.prototipo_id}</legend>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="border border-linha rounded-sm px-2 py-1" value={avaria.tipo} aria-label="Tipo de avaria"
              onChange={(e) => setAvaria({ ...avaria, tipo: e.target.value })}>
              {['vidro', 'lataria', 'pneu', 'outro'].map((x) => <option key={x}>{x}</option>)}
            </select>
            <select className="border border-linha rounded-sm px-2 py-1" value={avaria.gravidade} aria-label="Gravidade"
              onChange={(e) => setAvaria({ ...avaria, gravidade: e.target.value })}>
              <option value="leve">leve</option>
              <option value="compromete_reuso">compromete reuso</option>
            </select>
            <label>semana <input type="number" min={1} max={plano.horizonte} value={avaria.semana}
              onChange={(e) => setAvaria({ ...avaria, semana: Number(e.target.value) })}
              className="w-16 border border-linha rounded-sm px-2 py-1" /></label>
            <button className={botao} onClick={() => enviar(replan.avaria({ prototipo_id: aloc.prototipo_id, area: t.area, ...avaria }))}>
              Registrar avaria
            </button>
          </div>
          <p className="text-xs text-grafite">A engenharia classifica a gravidade. Leve fica só registrada; compromete reuso tira o carro da frota a partir da semana informada (RN-09).</p>
        </fieldset>
      </>}
      {erro && <p className="text-seg">{erro}</p>}
    </aside>
  )
}

// RN-05 e RN-07: o sistema sugere; o gerente da coordenação aceita ou recusa
export function PainelProposta({ proposta, plano, aoDecidir, podeDecidir = true }: { proposta: Proposta; plano: Plano; aoDecidir: () => void; podeDecidir?: boolean }) {
  const [erro, setErro] = useState('')
  const decidir = (p: Promise<unknown>) => p.then(aoDecidir).catch((e) => setErro(e.message))
  const vazio = !proposta.sugestoes.length && !proposta.impactados.length
  // RN-06: bloqueado por padrão quando a proposta empurra o fim além do marco
  const estoura = !!proposta.marco && proposta.marco.fim_depois > Math.max(plano.horizonte, proposta.marco.fim_antes)
  const [estourar, setEstourar] = useState(false)
  return (
    <aside className="bg-pista border-2 border-faixa rounded-md p-4 text-sm space-y-3">
      <p className="font-cond text-xl font-semibold">Proposta de replanejamento</p>
      <p>{proposta.evento}.</p>
      {proposta.marco && <p className="bg-asfalto rounded-sm p-2">
        {proposta.marco.estava_no_caminho_critico === null ? '' : proposta.marco.estava_no_caminho_critico ? 'O teste estava no caminho crítico. ' : 'O teste não estava no caminho crítico. '}
        {proposta.marco.semanas_consumidas > 0
          ? <>Este evento move o fim do plano da semana {proposta.marco.fim_antes} para a <b>{proposta.marco.fim_depois}</b> e consome {proposta.marco.semanas_consumidas} das {Math.max(proposta.marco.folga_projeto_antes, 0)} semanas de folga do projeto.</>
          : <>Com a proposta, o fim do plano continua na semana <b>{proposta.marco.fim_depois}</b>: o lançamento não se move.</>}
      </p>}
      {vazio && <p>Nenhum outro teste é afetado.</p>}
      {proposta.sugestoes.length > 0 && <div>
        <p className="font-medium">Mudanças sugeridas</p>
        <ul className="list-disc pl-5">
          {proposta.sugestoes.map((s, i) => (
            <li key={i}>{s.reteste
              ? <>Repetir <b>{s.teste_id}</b> ({plano.testes[s.teste_id]?.area}) no <b>{s.para}</b>, semanas {s.inicio} a {s.fim} (o {s.de} não pode recebê-lo)</>
              : <>Mover <b>{s.teste_id}</b> ({plano.testes[s.teste_id]?.area}) do {s.de} para o <b>{s.para}</b>, semanas {s.inicio} a {s.fim}</>}
              {plano.reserva.includes(s.para) && ' — usa um carro da folga de reteste'}</li>
          ))}
        </ul>
      </div>}
      {proposta.impactados.length > 0 && <div>
        <p className="font-medium text-seg">Impactados, sem solução automática</p>
        <ul className="list-disc pl-5">
          {proposta.impactados.map((i) => <li key={i.teste_id}><b>{i.teste_id}</b> ({i.area}): {i.motivo}</li>)}
        </ul>
      </div>}
      {estoura && <label className="flex gap-2 items-start bg-asfalto rounded-sm p-2">
        <input type="checkbox" className="mt-1" checked={estourar} onChange={(e) => setEstourar(e.target.checked)} />
        <span>A proposta termina na semana <b>{proposta.marco!.fim_depois}</b>, depois do lançamento na semana {plano.horizonte}. Por padrão o aceite fica bloqueado. Marque para aceitar mesmo assim; o Gantt mostra as semanas a mais.</span>
      </label>}
      <div className="flex gap-2">
        <button className={`${primario} disabled:opacity-40`} disabled={!podeDecidir || (estoura && !estourar)} onClick={() => decidir(replan.aceitar(proposta.evento, estourar))}>Aceitar e criar a versão {proposta.versao_nova}</button>
        <button className={botao} disabled={!podeDecidir} onClick={() => decidir(replan.recusar())}>Recusar</button>
      </div>
      <p className="text-xs text-grafite">{podeDecidir
        ? 'Você está como gerente da coordenação: só esse perfil aceita ou recusa (RN-07). Até lá, o plano não muda.'
        : 'Você está como engenharia: só o gerente da coordenação aceita ou recusa (RN-07). Troque o perfil no topo da tela.'}</p>
      {erro && <p className="text-seg">{erro}</p>}
    </aside>
  )
}
