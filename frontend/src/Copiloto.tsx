import { useEffect, useState } from 'react'
import { copiloto, type RespostaCopiloto } from './api'

// Fatia 5: a coordenação escreve o imprevisto; o LLM traduz em evento; o motor calcula; o gerente aceita (ADR 0003)
export function Copiloto({ aoProposta }: { aoProposta: () => void }) {
  const [texto, setTexto] = useState('')
  const [modo, setModo] = useState('')
  const [resposta, setResposta] = useState<RespostaCopiloto>()
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  useEffect(() => { copiloto.modo().then((r) => setModo(r.modo)).catch(() => setModo('indisponível')) }, [])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setOcupado(true); setErro('')
    copiloto.perguntar(texto)
      .then((r) => { setResposta(r); if (!r.pergunta) aoProposta() })
      .catch((e) => setErro(e.message))
      .finally(() => setOcupado(false))
  }

  return (
    <aside className="bg-pista border border-linha rounded-md p-4 text-sm space-y-2">
      <p className="font-cond text-xl font-semibold">Copiloto de replanejamento</p>
      <form onSubmit={enviar} className="space-y-2">
        <label htmlFor="copiloto" className="block">Conte o imprevisto como contaria por e-mail.</label>
        <textarea id="copiloto" rows={2} value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="O teste de vedação na chuva AER-99 atrasou 2 semanas"
          className="w-full border border-linha rounded-sm px-2 py-1 bg-white" />
        <button disabled={ocupado || texto.trim().length < 3}
          className="px-3 py-1.5 rounded-sm bg-tinta text-pista cursor-pointer disabled:opacity-40">
          {ocupado ? 'Interpretando…' : 'Interpretar'}
        </button>
      </form>
      {resposta?.pergunta && <p className="bg-asfalto rounded-sm p-2">{resposta.pergunta}</p>}
      {resposta?.explicacao && <p className="bg-asfalto rounded-sm p-2">{resposta.explicacao}</p>}
      {erro && <p className="text-seg">{erro}</p>}
      <p className="text-xs text-grafite">
        Modelo: {modo === 'offline' ? 'nenhum (modo offline: entende só "ID atrasou N semanas" e "ID falhou")' : modo}.
        O modelo só traduz e explica; quem calcula é o motor, e nada muda até o gerente aceitar.
      </p>
    </aside>
  )
}
