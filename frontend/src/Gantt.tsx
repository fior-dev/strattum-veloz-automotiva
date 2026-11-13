import { useEffect, useRef } from 'react'
import { COR_AREA, type Alocacao, type Plano, type Proposta } from './api'

// RF-04: uma linha por protótipo, uma coluna por semana. Cada barra mostra a área (cor) e o ID do teste.
// soCarros: filtro de linhas (ticket 11). aberto: o teste aberto no painel ganha destaque e o Gantt rola até ele.
// previa: enquanto a proposta espera o gerente, o teste aparece tracejado no carro de destino e esmaecido na origem.
export function Gantt({ plano, aoClicar, destaque, folgas = {}, marco = 20, soCarros, aberto, previa = [] }: {
  plano: Plano; aoClicar?: (a: Alocacao) => void; destaque?: Set<string>; folgas?: Record<string, number>; marco?: number
  soCarros?: Set<string>; aberto?: string; previa?: Proposta['sugestoes']
}) {
  // o gerente pode aceitar um plano que passa do marco (RN-06); o atraso vai até 20 semanas, então no máximo o dobro
  const n = Math.min(Math.max(plano.horizonte, plano.semana_fim), plano.horizonte * 2)
  const semanas = Array.from({ length: n }, (_, i) => i + 1)
  const porCarro = new Map<string, Alocacao[]>()
  for (const a of plano.alocacoes) porCarro.set(a.prototipo_id, [...(porCarro.get(a.prototipo_id) ?? []), a])
  const linhas = [...plano.prototipos, ...plano.reserva].filter((pid) => !soCarros || soCarros.has(pid))
  const colunas = `5.5rem repeat(${n}, minmax(1.9rem, 1fr))`
  const saindo = new Set(previa.filter((s) => !s.reteste).map((s) => `${s.teste_id}@${s.de}`))
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => { caixa.current?.querySelector('[data-aberto]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [aberto, soCarros?.size])  // o Set é novo a cada render: depender dele rolaria a tela a cada tecla

  return (
    <div ref={caixa} className="overflow-auto max-h-[70vh] border border-linha rounded-md bg-pista">
      <div className="grid sticky top-0 z-10 bg-tinta text-pista text-xs font-cond" style={{ gridTemplateColumns: colunas }}>
        <div className="px-2 py-1.5 sticky left-0 bg-tinta">Protótipo</div>
        {semanas.map((s) => <div key={s} className={`py-1.5 text-center ${s === marco ? 'border-r-4 border-seg' : ''} ${s > marco ? 'bg-seg' : ''}`}><span className={s === marco ? 'font-bold text-faixa' : ''} title={s === marco ? 'Lançamento' : s > marco ? 'Depois do lançamento' : undefined}>S{s}</span></div>)}
      </div>
      {linhas.length === 0 && <p className="p-4 text-sm text-grafite">Nenhum carro neste filtro.</p>}
      {linhas.map((pid) => {
        const alocs = porCarro.get(pid) ?? []
        const destrutivo = alocs.find((a) => plano.testes[a.teste_id]?.destrutivo)
        const reserva = plano.reserva.includes(pid)
        const avarias = plano.avarias.filter((v) => v.prototipo_id === pid)
        const doAberto = !!aberto && alocs.some((a) => a.teste_id === aberto)
        return (
          <div key={pid} className="grid border-t border-linha h-7 text-xs" style={{ gridTemplateColumns: colunas }}>
            <div className={`px-2 flex items-center gap-1 sticky left-0 z-[1] font-cond font-semibold ${doAberto ? 'bg-faixa' : 'bg-pista'}`} style={{ gridColumn: 1, gridRow: 1 }}>
              {pid}
              {reserva && <span className="font-normal text-grafite">reserva</span>}
              {avarias.map((v, i) => (
                <span key={i} title={`Avaria ${v.tipo}, ${v.gravidade === 'leve' ? 'leve' : 'compromete reuso'}, semana ${v.semana}`}
                  className={v.gravidade === 'leve' ? 'text-[#8a6500]' : 'text-seg'}>⚠</span>
              ))}
            </div>
            <div aria-hidden className="border-r-4 border-seg pointer-events-none" style={{ gridColumn: marco + 1, gridRow: 1 }} />
            {destrutivo && destrutivo.fim < n && (
              <div className="destruido" title="Destruído pelo teste destrutivo"
                style={{ gridColumn: `${destrutivo.fim + 2} / ${n + 2}`, gridRow: 1 }} />
            )}
            {alocs.map((a) => {
              const t = plano.testes[a.teste_id]
              const status = plano.status[a.teste_id]
              const folga = folgas[a.teste_id]
              const eAberto = a.teste_id === aberto
              return (
                <button key={`${a.teste_id}-${a.inicio}`} onClick={() => aoClicar?.(a)} data-aberto={eAberto || undefined}
                  title={`${a.teste_id} · ${t.nome}\n${t.area}\nSemanas ${a.inicio} a ${a.fim}${folga > 0 ? `\nFolga até o fim do plano: ${folga} semana${folga === 1 ? '' : 's'}` : '\nSem folga até o fim do plano'}${t.destrutivo ? '\nDestrutivo: o carro sai da frota' : ''}${a.reteste ? '\nReteste' : ''}\nStatus: ${status}`}
                  className={`m-0.5 rounded-sm px-1 text-left text-white truncate font-cond font-medium cursor-pointer hover:brightness-110 ${a.reteste ? 'border-2 border-dashed border-white/80' : ''} ${status === 'atrasado' || status === 'falhou' ? 'ring-2 ring-faixa' : ''} ${destaque?.has(a.teste_id) ? 'outline-3 outline-tinta outline-offset-1' : ''} ${eAberto ? 'relative z-[2] outline-4 outline-faixa border-2 border-tinta' : ''} ${folga > 0 ? 'shadow-[inset_0_3px_0_var(--color-faixa)]' : ''} ${saindo.has(`${a.teste_id}@${pid}`) ? 'opacity-40' : ''}`}
                  style={{ gridColumn: `${Math.min(a.inicio, n) + 1} / ${Math.min(a.fim, n) + 2}`, gridRow: 1, background: COR_AREA[t.area] }}>
                  {t.destrutivo ? '✕ ' : ''}{a.teste_id}
                </button>
              )
            })}
            {previa.filter((s) => s.para === pid).map((s) => (
              <div key={`previa-${s.teste_id}-${s.inicio}`} title={`Proposta: ${s.teste_id} ${s.reteste ? `seria repetido no ${pid}` : `viria do ${s.de} para o ${pid}`}, semanas ${s.inicio} a ${s.fim}. Só vale se o gerente aceitar`}
                className="m-0.5 rounded-sm px-1 truncate font-cond font-semibold text-tinta border-2 border-dashed border-tinta bg-faixa/40"
                style={{ gridColumn: `${Math.min(s.inicio, n) + 1} / ${Math.min(s.fim, n) + 2}`, gridRow: 1 }}>
                {s.teste_id} (proposta{s.reteste ? ': reteste' : `: vem do ${s.de}`})
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function Legenda({ areas }: { areas: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {areas.map((a) => (
        <li key={a} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COR_AREA[a] }} />{a}</li>
      ))}
      <li className="flex items-center gap-1.5"><span className="w-5 h-3 destruido border border-linha" />Carro destruído</li>
      <li>✕ teste destrutivo</li>
      <li className="flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm bg-grafite shadow-[inset_0_3px_0_var(--color-faixa)]" />com folga até o fim do plano</li>
      <li className="flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm border-2 border-dashed border-tinta bg-faixa/40" />troca proposta</li>
      <li className="flex items-center gap-1.5"><span className="w-1 h-3 bg-seg" />lançamento</li>
    </ul>
  )
}
