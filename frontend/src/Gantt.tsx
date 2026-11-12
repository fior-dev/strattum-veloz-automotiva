import { COR_AREA, type Alocacao, type Plano } from './api'

// RF-04: uma linha por protótipo, uma coluna por semana. Cada barra mostra a área (cor) e o ID do teste.
export function Gantt({ plano, aoClicar, destaque, folgas = {}, marco = 20 }: {
  plano: Plano; aoClicar?: (a: Alocacao) => void; destaque?: Set<string>; folgas?: Record<string, number>; marco?: number
}) {
  const n = Math.max(plano.horizonte, plano.semana_fim) // o gerente pode aceitar um plano que passa do marco (RN-06)
  const semanas = Array.from({ length: n }, (_, i) => i + 1)
  const porCarro = new Map<string, Alocacao[]>()
  for (const a of plano.alocacoes) porCarro.set(a.prototipo_id, [...(porCarro.get(a.prototipo_id) ?? []), a])
  const linhas = [...plano.prototipos, ...plano.reserva]
  const colunas = `5.5rem repeat(${n}, minmax(2.6rem, 1fr))`

  return (
    <div className="overflow-auto max-h-[70vh] border border-linha rounded-md bg-pista">
      <div className="grid sticky top-0 z-10 bg-tinta text-pista text-xs font-cond" style={{ gridTemplateColumns: colunas }}>
        <div className="px-2 py-1.5 sticky left-0 bg-tinta">Protótipo</div>
        {semanas.map((s) => <div key={s} className={`py-1.5 text-center ${s === marco ? 'border-r-4 border-seg' : ''} ${s > marco ? 'bg-seg' : ''}`}><span className={s === marco ? 'font-bold text-faixa' : ''} title={s === marco ? 'Lançamento' : s > marco ? 'Depois do lançamento' : undefined}>S{s}</span></div>)}
      </div>
      {linhas.map((pid) => {
        const alocs = porCarro.get(pid) ?? []
        const destrutivo = alocs.find((a) => plano.testes[a.teste_id]?.destrutivo)
        const reserva = plano.reserva.includes(pid)
        const avarias = plano.avarias.filter((v) => v.prototipo_id === pid)
        return (
          <div key={pid} className="grid border-t border-linha h-7 text-xs" style={{ gridTemplateColumns: colunas }}>
            <div className="px-2 flex items-center gap-1 sticky left-0 bg-pista z-[1] font-cond font-semibold" style={{ gridColumn: 1, gridRow: 1 }}>
              {pid}
              {reserva && <span className="font-normal text-grafite">reserva</span>}
              {avarias.map((v, i) => (
                <span key={i} title={`Avaria ${v.tipo}, ${v.gravidade === 'leve' ? 'leve' : 'compromete reuso'}, semana ${v.semana}`}
                  className={v.gravidade === 'leve' ? 'text-faixa' : 'text-seg'}>⚠</span>
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
              return (
                <button key={`${a.teste_id}-${a.inicio}`} onClick={() => aoClicar?.(a)}
                  title={`${a.teste_id} · ${t.nome}\n${t.area}\nSemanas ${a.inicio} a ${a.fim}${t.destrutivo ? '\nDestrutivo: o carro sai da frota' : ''}${a.reteste ? '\nReteste' : ''}\nStatus: ${status}`}
                  className={`m-0.5 rounded-sm px-1 text-left text-white truncate font-cond font-medium cursor-pointer hover:brightness-110 ${a.reteste ? 'border-2 border-dashed border-white/80' : ''} ${status === 'atrasado' || status === 'falhou' ? 'ring-2 ring-faixa' : ''} ${destaque?.has(a.teste_id) ? 'outline-3 outline-tinta outline-offset-1' : ''} ${folga === 0 ? 'shadow-[inset_0_3px_0_var(--color-faixa)]' : ''}`}
                  style={{ gridColumn: `${Math.min(a.inicio, n) + 1} / ${Math.min(a.fim, n) + 2}`, gridRow: 1, background: COR_AREA[t.area] }}>
                  {t.destrutivo ? '✕ ' : ''}{a.teste_id}
                </button>
              )
            })}
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
      <li className="flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm bg-grafite shadow-[inset_0_3px_0_var(--color-faixa)]" />caminho crítico</li>
      <li className="flex items-center gap-1.5"><span className="w-1 h-3 bg-seg" />lançamento</li>
    </ul>
  )
}
