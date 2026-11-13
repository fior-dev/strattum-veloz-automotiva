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
    .catch(() => { throw new Error('A API não respondeu') })
  if (!r.ok) {
    const corpo = await r.json().catch(() => ({}))
    throw new Error(typeof corpo.detail === 'string' ? corpo.detail : `A API respondeu ${r.status}`)
  }
  return r.json()
}

export const api = {
  plano: (versao?: number) => pedir<Plano>(versao ? `/plano?versao=${versao}` : '/plano'),
  comparativo: () => pedir<Comparativo>('/comparativo'),
  gestao: (versao?: number) => pedir<Gestao>(versao ? `/gestao?versao=${versao}` : '/gestao'),
  proposta: () => pedir<{ proposta: Proposta | null }>('/proposta'),
  folga: (folga: number) => pedir<Comparativo>('/folga', { method: 'PUT', body: JSON.stringify({ folga }) }),
  simular: (q: Cenario & { por_area: number }) =>
    pedir<Simulacao>(`/simular?${new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)]))}`),
  regerar: (c: Cenario) => pedir<{ versao: number }>('/plano/regerar', { method: 'POST', body: JSON.stringify(c) }),
}

export const COR_AREA: Record<string, string> = {
  'Elétrica/Eletrônica': 'var(--color-ele)',
  'Mecânica/Powertrain': 'var(--color-mec)',
  'Aerodinâmica': 'var(--color-aer)',
  'Hidráulica': 'var(--color-hid)',
  'Segurança passiva': 'var(--color-seg)',
}

export type Proposta = {
  evento: string
  sugestoes: { teste_id: string; de: string; para: string; inicio: number; fim: number; reteste: boolean }[]
  impactados: { teste_id: string; area: string; motivo: string }[]
  versao_nova: number
  carros: string[]  // carros que a proposta toca, com o do evento
  marco: { fim_antes: number; fim_depois: number; semanas_consumidas: number; folga_projeto_antes: number;
    folga_projeto_depois: number; estava_no_caminho_critico: boolean | null } | null
}
// Memória de cálculo: carros × semanas = em_teste + destruido + vazio (ticket 10)
export type Memoria = { testes: number; destrutivos: number; semanas: number; carros: number; em_teste: number; destruido: number; vazio: number; piso: number }
export type Cenario = { meta: number; destrutivo_no_fim: boolean; folga: number }
export type Simulacao = Cenario & {
  por_area: number; testes: number; destrutivos: number; pedidos: number; carros_plano: number; carros_reserva: number
  carros: number; semana_fim: number; folga_projeto: number; criticos: number; nao_cabe: number; memoria: Memoria; custo_frota: number
}
export type UsoSemana = { semana: number; em_uso: number; parados: number; fora: number }
export type Gestao = {
  marco: number; fim_plano: number; folga_projeto: number; sinal: 'verde' | 'amarelo' | 'vermelho'
  criticos: number; testes_no_plano: number; folgas: Record<string, number>; memoria: Memoria
  uso: { plano: UsoSemana[]; como_hoje: UsoSemana[] }
  curva_meta: { meta: number; carros: number; folga_projeto: number; nao_cabe: number }[]
  custos: { carro: number; preco_suv: number; suvs_semana: number }  // valores em milhões de reais (MK-10, MK-11)
  custo_frota: number; carros_com_folga: string[]  // vazio quando o plano já passa do marco
}
type ComProposta = { proposta: Proposta | null }

export const replan = {
  status: (teste_id: string, status: string, semanas = 1) =>
    pedir<ComProposta>('/status', { method: 'POST', body: JSON.stringify({ teste_id, status, semanas }) }),
  avaria: (a: Avaria) =>
    pedir<ComProposta>('/avarias', { method: 'POST', body: JSON.stringify(a) }),
  aceitar: (evento: string, estourar = false) =>
    pedir<{ versao: number }>(`/proposta/aceitar?${new URLSearchParams({ evento, estourar: String(estourar) })}`, { method: 'POST' }),
  recusar: () => pedir<ComProposta>('/proposta/recusar', { method: 'POST' }),
}

export type RespostaCopiloto = { evento: unknown; pergunta: string | null; explicacao: string | null; modo: string }
export const copiloto = {
  modo: () => pedir<{ modo: string }>('/copiloto'),
  perguntar: (texto: string) => pedir<RespostaCopiloto>('/copiloto', { method: 'POST', body: JSON.stringify({ texto }) }),
}
