// Tipos e chamadas da API. A SPA não calcula nada: só mostra o que o backend devolve.

export type Teste = { id: string; area: string; nome: string; duracao: number; destrutivo: boolean }
export type Alocacao = { prototipo_id: string; teste_id: string; inicio: number; fim: number; reteste: boolean }
export type Avaria = { prototipo_id: string; tipo: string; gravidade: string; semana: number; area: string }
export type Plano = {
  versao: number
  estado: string
  alocacoes: Alocacao[]
  nao_cabe: { teste_id: string; motivo: string }[]
  reserva: string[]
  status: Record<string, string>
  avarias: Avaria[]
  prototipos: string[]
  semana_fim: number
  horizonte: number
  areas: string[]
  testes: Record<string, Teste>
  versoes: number[]
}
export type Comparativo = {
  como_hoje: { carros: number; semana_fim: number; por_area: { area: string; carros: number; semanas: number }[] }
  proposto: { carros_plano: number; carros_reserva: number; carros: number; semana_fim: number; nao_cabe: number }
  testes: number
  destrutivos: number
  reducao_pct: number
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api${caminho}`, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!r.ok) {
    const corpo = await r.json().catch(() => ({}))
    throw new Error(typeof corpo.detail === 'string' ? corpo.detail : `A API respondeu ${r.status}`)
  }
  return r.json()
}

export const api = {
  plano: (versao?: number) => pedir<Plano>(versao ? `/plano?versao=${versao}` : '/plano'),
  comparativo: () => pedir<Comparativo>('/comparativo'),
  folga: (folga: number) => pedir<Comparativo>('/folga', { method: 'PUT', body: JSON.stringify({ folga }) }),
}

export const COR_AREA: Record<string, string> = {
  'Elétrica/Eletrônica': 'var(--color-ele)',
  'Mecânica/Powertrain': 'var(--color-mec)',
  'Aerodinâmica': 'var(--color-aer)',
  'Dinâmica veicular': 'var(--color-din)',
  'Segurança passiva': 'var(--color-seg)',
}
