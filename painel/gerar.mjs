#!/usr/bin/env node
// Painel de gestão do projeto: lê os .md do repo e o git log e grava painel/index.html, autossuficiente.
// Formato esperado: painel/README.md. Uso: node painel/gerar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, '..');
const FUSO = 'America/Sao_Paulo';

// ---------- leitura tolerante ----------
export function ler(raiz, rel) {
  try { return fs.readFileSync(path.join(raiz, rel), 'utf8'); } catch { return null; }
}
function listar(raiz, rel, filtro) {
  const base = path.join(raiz, rel), out = [];
  const anda = d => {
    let itens; try { itens = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of itens) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) anda(p); else if (filtro(e.name)) out.push(path.relative(raiz, p).split(path.sep).join('/'));
    }
  };
  anda(base);
  return out.sort();
}

// ---------- markdown mínimo ----------
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}
const celulas = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
const ehSeparador = l => /^\s*\|?\s*:?-{2,}/.test(l);

export function tabela(txt) {
  if (!txt) return null;
  const ls = txt.split(/\r?\n/);
  const i = ls.findIndex(l => /^\s*\|/.test(l));
  if (i < 0) return null;
  const g = [];
  for (let j = i; j < ls.length && /^\s*\|/.test(ls[j]); j++) if (!ehSeparador(ls[j])) g.push(celulas(ls[j]));
  return { cab: g[0] || [], linhas: g.slice(1) };
}
function tabelaHtml(linhas) {
  const g = linhas.filter(l => !ehSeparador(l)).map(celulas);
  if (!g.length) return '';
  return `<div class="rolagem"><table><thead><tr>${g[0].map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
    g.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function blocos(txt) {
  if (!txt) return '';
  const ls = txt.split(/\r?\n/), out = [];
  const LISTA = /^\s*([-*]|\d+\.)\s+/;
  let i = 0;
  while (i < ls.length) {
    const l = ls[i];
    if (!l.trim()) { i++; continue; }
    if (/^```/.test(l)) { i++; while (i < ls.length && !/^```/.test(ls[i])) i++; i++; out.push('<p class="nota">Diagrama no arquivo de origem.</p>'); continue; }
    if (/^\s*\|/.test(l)) { const g = []; while (i < ls.length && /^\s*\|/.test(ls[i])) g.push(ls[i++]); out.push(tabelaHtml(g)); continue; }
    if (/^#{2,}\s/.test(l)) { out.push(`<h4>${inline(l.replace(/^#+\s*/, ''))}</h4>`); i++; continue; }
    if (LISTA.test(l)) {
      const ord = /^\s*\d+\./.test(l), it = [];
      while (i < ls.length && LISTA.test(ls[i])) it.push(ls[i++].replace(LISTA, '').replace(/^\[[ x]\]\s*/, ''));
      out.push(`<${ord ? 'ol' : 'ul'}>${it.map(x => `<li>${inline(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`);
      continue;
    }
    const p = [];
    while (i < ls.length && ls[i].trim() && !/^\s*(\||#|```)/.test(ls[i]) && !LISTA.test(ls[i])) p.push(ls[i++].trim());
    if (p.length) out.push(`<p>${inline(p.join(' '))}</p>`); else i++;
  }
  return out.join('');
}
export function secoes(md) {
  const out = {};
  if (!md) return out;
  const partes = md.split(/^##\s+(.+)$/m);
  for (let i = 1; i < partes.length; i += 2) out[partes[i].trim()] = partes[i + 1].trim();
  return out;
}
const secao = (s, prefixo) => { const k = Object.keys(s).find(k => semAcento(k).startsWith(semAcento(prefixo))); return k ? s[k] : ''; };

// Campos `Chave: valor` separados por ` · `, nas linhas antes do primeiro `##`.
export function campos(md) {
  const out = {};
  if (!md) return out;
  for (const l of md.split(/^##\s/m)[0].split(/\r?\n/)) {
    if (/^\s*(#|-|\*|\||>)/.test(l) || !l.trim()) continue;
    for (const seg of l.split(/\s+·\s+/)) {
      const m = seg.match(/^\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ ]{0,24}):\s*(.*)$/);
      if (m) out[semAcento(m[1])] = m[2].trim();
      else { const d = seg.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/); if (d && !out.data) out.data = d[0]; }
    }
  }
  return out;
}
const titulo = md => (md?.match(/^#\s+(.+)$/m)?.[1] || '').trim();
const vazio = v => !v || v === '—' || v === '-';

// ---------- datas ----------
export function minutos(s) {
  if (vazio(s)) return null;
  const t = s.toLowerCase().replace(',', '.');
  const h = t.match(/(\d+(?:\.\d+)?)\s*h(?:\s*(\d+))?/), m = t.match(/(\d+)\s*min/);
  if (h) return Math.round(Number(h[1]) * 60 + Number(h[2] || 0));
  if (m) return Number(m[1]);
  return null;
}
const fmtDur = m => m == null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
const fmt = (d, o) => new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, ...o }).format(d);
const fmtDia = d => fmt(d, { day: '2-digit', month: '2-digit' });
const fmtHora = d => fmt(d, { hour: '2-digit', minute: '2-digit' });
const fmtDiaHora = d => `${fmtDia(d)}, ${fmtHora(d)}`;
const brt = s => new Date(`${s}:00-03:00`);
// "12/11 00h30" | "12/11" → Date (ano da geração)
function dataLog(s, ano) {
  const m = String(s).match(/(\d{1,2})\/(\d{1,2})(?:\/\d{4})?(?:\s+(\d{1,2})h(\d{2})?)?/);
  if (!m) return null;
  const z = n => String(n).padStart(2, '0');
  return brt(`${ano}-${z(m[2])}-${z(m[1])}T${z(m[3] ?? 12)}:${z(m[4] ?? 0)}`);
}

// ---------- git ----------
export function gitLog(raiz) {
  try {
    const txt = execFileSync('git', ['-C', raiz, 'log', '--format=%x1e%h%x1f%aI%x1f%s', '--name-only'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return txt.split('\x1e').filter(Boolean).map(b => {
      const [cab, ...arq] = b.split('\n');
      const [hash, data, assunto] = cab.split('\x1f');
      return { hash, data: new Date(data), assunto, arquivos: arq.map(a => a.trim()).filter(Boolean) };
    });
  } catch { return []; }
}
function baseGithub(raiz) {
  try {
    const u = execFileSync('git', ['-C', raiz, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const m = u.match(/github\.com[:/](.+?)(?:\.git)?$/);
    return m ? `https://github.com/${m[1]}` : null;
  } catch { return null; }
}

// ---------- parsers de domínio ----------
export function parseAdr(md, arquivo = '') {
  const c = campos(md), s = secoes(md);
  const t = titulo(md);
  const m = t.match(/^ADR\s+(\d+)\s*[·:–-]\s*(.+)$/i);
  const numero = m?.[1] || (path.basename(arquivo).match(/^(\d+)/)?.[1] ?? '');
  const st = semAcento(c.status || '');
  const estado = st.startsWith('substitu') ? 'substituido' : /^(aprovad|decidid)/.test(st) ? 'aprovado' : st.startsWith('propost') ? 'proposto' : 'desconhecido';
  const decidido = !vazio(c['decidido por']) ? c['decidido por']
    : estado === 'aprovado' ? (c.status.match(/pel[oa]\s+([A-Za-zÀ-ÿ]+)/)?.[1] || '—')
    : estado === 'proposto' ? 'Proposto pelo agente, aguardando o José' : '—';
  const temSecoes = Object.keys(s).length > 0;
  const corpo = md ? md.replace(/^#\s.+$/m, '').split(/\r?\n/).filter(l => !/^status:/i.test(l)).join('\n') : '';
  return {
    numero, titulo: m?.[2] || t, arquivo, estado, statusTexto: c.status || '', data: c.data || '—', decidido,
    substituidoPor: vazio(c['substituido por']) ? null : c['substituido por'],
    contexto: secao(s, 'Contexto'), decisao: temSecoes ? secao(s, 'Decis') : corpo.trim(),
    alternativas: secao(s, 'Alternativas'), consequencias: secao(s, 'Consequ'),
  };
}

const ESTADOS_TICKET = ['a fazer', 'em andamento', 'feito', 'cortado'];
function normEstado(v) {
  const s = semAcento(v || '');
  if (!s || s === '—') return null;
  if (/^(feit|pront|conclu)/.test(s)) return 'feito';
  if (/andamento/.test(s)) return 'em andamento';
  if (/^(cortad|roadmap)/.test(s)) return 'cortado';
  if (/fazer/.test(s)) return 'a fazer';
  return null;
}
export function parseTicket(md, arquivo = '') {
  const c = campos(md);
  const t = titulo(md);
  const m = t.match(/^(\w+)\s*·\s*(.+)$/);
  const ids = re => [...new Set((md || '').match(re) || [])].sort();
  const caixas = (md || '').match(/^\s*- \[( |x)\]/gm) || [];
  return {
    numero: m?.[1] || (path.basename(arquivo).match(/^(\w+?)-/)?.[1] ?? ''),
    titulo: m?.[2] || t, arquivo,
    dores: (c.dor || '').match(/D\d+/g) || [],
    depende: vazio(c['depende de']) ? null : c['depende de'],
    estimativa: minutos(c.estimativa), real: minutos(c.real),
    estado: normEstado(c.estado), estadoDeclarado: !!normEstado(c.estado),
    commits: (c.commits || '').match(/\b[0-9a-f]{7,40}\b/g) || [],
    // Testes citados: campo Testes, mais todo `test_*` que o ticket menciona (função ou arquivo).
    testes: [...new Set([...(vazio(c.testes) ? [] : c.testes.split(',').map(x => x.trim())), ...((md || '').match(/\btest_\w+\b/g) || [])])].filter(Boolean),
    regras: ids(/\bRN-\d{2}\b/g), requisitos: ids(/\bRF-\d{2}\b/g),
    aceite: { total: caixas.length, feitos: caixas.filter(x => x.includes('[x]')).length },
  };
}

// Testes no código e as RN/RF que o nome cita.
export function idsDoTeste(nome) {
  const out = new Set();
  for (const m of nome.matchAll(/(?:^|[_\s-])(rn|rf)[-_]?(\d{2})(?=$|[_\s-])/gi)) out.add(`${m[1].toUpperCase()}-${m[2]}`);
  return [...out];
}
function testesNoCodigo(raiz) {
  const out = [];
  for (const f of listar(raiz, 'backend/tests', n => /^test_.*\.py$/.test(n))) {
    for (const m of (ler(raiz, f) || '').matchAll(/^\s*(?:async\s+)?def\s+(test_\w+)/gm)) out.push({ nome: m[1], arquivo: f });
  }
  for (const f of listar(raiz, 'frontend/src', n => /\.test\.[jt]sx?$/.test(n))) {
    for (const m of (ler(raiz, f) || '').matchAll(/\b(?:it|test)\(\s*['"`]([^'"`]+)/g)) out.push({ nome: m[1], arquivo: f });
  }
  return out.map(t => ({ ...t, ids: idsDoTeste(t.nome) }));
}

// "1-3", "1 a 3", "1, 2" → números
function fatiasDoAssunto(s) {
  const out = new Set();
  const m = s.match(/\bfatias?\s+((?:\d+[a-d]?(?:\s*(?:-|–|,|\se\s|\sa\s)\s*)?)+)/i);
  if (m) for (const r of m[1].matchAll(/(\d+)([a-d])?(?:\s*(?:-|–|\sa\s)\s*(\d+))?/g)) {
    if (r[2]) { out.add(r[1].padStart(2, '0') + r[2]); continue; }
    for (let n = +r[1]; n <= +(r[3] || r[1]); n++) out.add(String(n).padStart(2, '0'));
  }
  for (const r of s.matchAll(/\btickets?\s+(\d+)([a-d])?\b/gi)) out.add(r[1].padStart(2, '0') + (r[2] || ''));
  return out;
}
function estadoDoReadme(readme) {
  const out = {};
  const s = secao(secoes(readme), 'Estado das fatias');
  const t = tabela(s);
  for (const r of t?.linhas || []) { const k = r[0]?.match(/^(\w+)/)?.[1]; if (k) out[k] = normEstado(r[1]) || 'a fazer'; }
  return out;
}

// ---------- montagem ----------
export const ETAPAS = [
  { id: 'discovery', nome: 'Discovery', caminhos: ['docs/01-discovery.md'], artefato: 'docs/01-discovery.md' },
  { id: 'grill', nome: 'Grill por escrito', caminhos: ['CONTEXT.md', 'PREMISSAS.md', 'docs/adr/'], artefato: 'CONTEXT.md', exige: ['CONTEXT.md', 'PREMISSAS.md'] },
  { id: 'spec', nome: 'Spec', caminhos: ['SPEC.md'], artefato: 'SPEC.md' },
  { id: 'tickets', nome: 'Tickets', caminhos: ['docs/tickets/'], artefato: 'docs/tickets/README.md' },
  { id: 'impl', nome: 'Implementação com TDD', caminhos: ['backend/', 'frontend/'], artefato: 'backend/tests/' },
  { id: 'review', nome: 'Code review', caminhos: [], artefato: 'AI-LOG.md' },
  { id: 'demo', nome: 'Demo e teste', caminhos: [], artefato: 'AI-LOG.md' },
  { id: 'entrega', nome: 'Entrega', caminhos: ['ROADMAP.md'], artefato: 'ROADMAP.md' },
];
export const MARCOS = [
  { quando: '2026-11-11T11:30', nome: 'Entrevista de discovery', curto: 'entrevista' },
  { quando: '2026-11-12T12:00', nome: 'Fatias 1 a 3 visíveis', curto: 'manhã', tickets: ['01', '02', '03'], nota: 'O prazo diz "de manhã", sem hora. O painel usa 12h.' },
  { quando: '2026-11-12T13:00', nome: 'Linha de corte: fatias 1 a 4 prontas', curto: '13h corte', tickets: ['01', '02', '03', '04'], nota: 'Sem as quatro, 5, 5b e 6a viram roadmap.' },
  { quando: '2026-11-12T15:00', nome: 'Docs finais (6b) começam', curto: '15h docs', comeca: ['06b'] },
  { quando: '2026-11-12T17:00', nome: 'Protótipo pronto; o José começa a testar', curto: '17h pronto', todos: true },
  { quando: '2026-11-12T19:00', nome: 'Fim do teste do José', curto: '19h teste' },
  { quando: '2026-11-13T10:00', nome: 'Apresentação para a Strattum', curto: 'sex 10h' },
].map(m => ({ ...m, data: brt(m.quando) }));

export function montar(raiz = RAIZ, { agora = new Date(), git = gitLog(raiz), github = baseGithub(raiz) } = {}) {
  const ano = Number(fmt(agora, { year: 'numeric' }));
  const existe = rel => fs.existsSync(path.join(raiz, rel));
  const link = rel => github ? `${github}/blob/main/${rel.split('/').map(encodeURIComponent).join('/')}` : `../${rel}`;
  const linkCommit = h => github ? `${github}/commit/${h}` : null;
  const porHash = h => git.find(c => c.hash.startsWith(h) || h.startsWith(c.hash));
  const tocam = cams => git.filter(c => c.arquivos.some(a => cams.some(p => p.endsWith('/') ? a.startsWith(p) : a === p)));

  // Discovery
  const disc = ler(raiz, 'docs/01-discovery.md');
  const ds = secoes(disc);
  const versao = disc?.match(/Vers[aã]o\s+([\d.]+)/i)?.[1] || null;
  const regras = (tabela(secao(ds, '9.'))?.linhas || []).filter(r => /^RN-\d+/.test(r[0])).map(([id, texto, fonte]) => ({
    id, texto, fonte: fonte || '',
    marca: /ca(iu|íram|iram)/i.test(texto) ? 'Premissa caiu' : /RN-09/.test(id) ? 'Nova' : /aprovad|José em/i.test(fonte || '') ? 'Aprovada pelo José' : null,
  }));
  const requisitos = [...new Set((secao(ds, '11.').match(/\bRF-\d{2}\b/g) || []))].sort();
  const resolvidas = (tabela(secao(ds, '17.'))?.linhas || []).filter(r => /^\d+$/.test(r[0])).map(([n, pergunta, afeta, situacao]) => ({ n, pergunta, afeta, situacao }));
  const riscosDisc = (tabela(secao(ds, '16.'))?.linhas || []).map(([risco, mitigacao]) => ({ risco, mitigacao, fonte: 'Discovery §16' }));

  // Dores
  const ctx = ler(raiz, 'CONTEXT.md');
  const dores = (tabela(secao(secoes(ctx), 'Dores'))?.linhas || []).filter(r => /^D\d+/.test(r[0])).map(([id, dor, fonte, fatia]) => {
    const m = dor.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    return { id, nome: m ? m[1].replace(/\.$/, '') : dor, detalhe: m ? m[2] : '', fonte, fatia };
  });

  // ADRs
  const adrs = listar(raiz, 'docs/adr', n => /\.md$/.test(n)).map(f => ({ ...parseAdr(ler(raiz, f), f), link: link(f) }));

  // Tickets
  const readmeEstado = estadoDoReadme(ler(raiz, 'README.md'));
  const testes = testesNoCodigo(raiz);
  const tickets = listar(raiz, 'docs/tickets', n => /\.md$/i.test(n) && !/^readme/i.test(n)).map(f => {
    const t = parseTicket(ler(raiz, f), f);
    if (!t.estado) {
      const k = Object.keys(readmeEstado).find(k => k === t.numero || (t.numero.startsWith(k) && /^\d+$/.test(k) && t.numero.length > k.length));
      t.estado = (k && readmeEstado[k]) || (t.aceite.total && t.aceite.feitos === t.aceite.total ? 'feito' : t.aceite.feitos ? 'em andamento' : 'a fazer');
    }
    let cs = t.commits.map(h => porHash(h) || { hash: h, data: null, assunto: '' });
    if (!cs.length && t.estado === 'feito') cs = git.filter(c => fatiasDoAssunto(c.assunto).has(t.numero));
    const datas = cs.map(c => c.data).filter(Boolean);
    const ligados = testes.filter(x => t.testes.includes(x.nome) || t.testes.includes(path.basename(x.arquivo).replace(/\.\w+$/, '')) || x.ids.some(id => t.regras.includes(id) || t.requisitos.includes(id)));
    return {
      ...t, link: link(f),
      commits: cs.map(c => ({ hash: c.hash, assunto: c.assunto, data: c.data, link: linkCommit(c.hash) })),
      fechadoEm: t.estado === 'feito' && datas.length ? new Date(Math.max(...datas)) : null,
      testesLigados: ligados,
    };
  });
  const ticket = n => tickets.find(t => t.numero === n);

  // Rastreabilidade
  const matriz = dores.map(d => {
    const ts = tickets.filter(t => t.dores.includes(d.id));
    const rn = [...new Set(ts.flatMap(t => t.regras))].sort(), rf = [...new Set(ts.flatMap(t => t.requisitos))].sort();
    const tt = [...new Map(ts.flatMap(t => t.testesLigados).map(x => [x.nome, x])).values()];
    return { ...d, regras: rn, requisitos: rf, tickets: ts.map(t => ({ numero: t.numero, estado: t.estado, link: t.link })), testes: tt };
  });
  const idsTestados = new Set(testes.flatMap(t => t.ids));
  const semTeste = [...regras.map(r => r.id), ...requisitos].filter(id => !idsTestados.has(id));

  // Premissas
  const prem = ler(raiz, 'PREMISSAS.md');
  const premissas = (tabela(prem)?.linhas || []).map(([id, item, valor, justificativa, fonte = '']) => {
    const f = fonte.toLowerCase();
    const grupo = /\[e\]|e-mail/.test(f) ? 'E-mail da cliente' : /\bia\b/.test(f) ? 'Gerado por IA' : /josé|jose/.test(f) ? 'Aprovado pelo José'
      : /suposi/.test(f) ? 'Suposição do FDE' : /discovery|\[t\]/.test(f) ? 'Fato do discovery' : 'Sem fonte';
    return { id, item, valor, justificativa, fonte, grupo, desvio: /desvio/i.test(justificativa || '') };
  });

  // AI-LOG
  const ailog = ler(raiz, 'AI-LOG.md');
  const tl = tabela(ailog);
  const col = n => tl ? tl.cab.findIndex(h => semAcento(h).startsWith(semAcento(n))) : -1;
  const ia = (tl?.linhas || []).map(r => {
    const g = n => (col(n) >= 0 ? r[col(n)] : '') || '';
    const ferr = g('Ferramenta'), fm = ferr.match(/^(.*?)\s*\((.+)\)\s*(.*)$/);
    const jose = g('José');
    return {
      data: g('Data'), quando: dataLog(g('Data'), ano), etapa: g('Etapa'),
      ferramenta: fm ? (fm[1] + (fm[3] ? ' ' + fm[3] : '')).trim() : ferr, modelo: fm ? fm[2] : '',
      entrada: g('Entrada'), saida: g('Saída'),
      jose: jose || (/josé|corrig|desvio|advisor|apontou|decid/i.test(g('Saída') + ' ' + g('Entrada')) ? 'destaque' : ''),
      joseTexto: jose,
    };
  });

  // Etapas
  const feitos = tickets.filter(t => t.estado === 'feito');
  const ativos = tickets.filter(t => t.estado !== 'cortado');
  const reviews = ia.filter(l => /code review/i.test(l.etapa));
  const demos = ia.filter(l => /demo|teste do josé|roteiro/i.test(l.etapa));
  const etapas = ETAPAS.map(e => {
    let estado = 'não iniciado';
    let marcas = tocam(e.caminhos).map(c => ({ data: c.data, rotulo: `${c.hash} ${c.assunto}` }));
    if (e.id === 'impl') estado = ativos.length && feitos.length === ativos.length ? 'feito' : feitos.length || tickets.some(t => t.estado === 'em andamento') ? 'em andamento' : 'não iniciado';
    else if (e.id === 'review' || e.id === 'demo') {
      const ls = e.id === 'review' ? reviews : demos;
      marcas = ls.filter(l => l.quando).map(l => ({ data: l.quando, rotulo: `${l.data} ${l.etapa}` }));
      estado = ls.length ? 'em andamento' : 'não iniciado';
    } else if (e.id === 'entrega') estado = existe('ROADMAP.md') && ticket('06b')?.estado === 'feito' ? 'feito' : existe('ROADMAP.md') ? 'em andamento' : 'não iniciado';
    else estado = (e.exige || e.caminhos).every(existe) ? 'feito' : (e.exige || e.caminhos).some(existe) ? 'em andamento' : 'não iniciado';
    marcas.sort((a, b) => a.data - b.data);
    return { ...e, estado, marcas, ultima: marcas.at(-1)?.data || null, link: existe(e.artefato.replace(/\/$/, '')) ? link(e.artefato.replace(/\/$/, '')) : null };
  });
  const entregue = etapas.find(e => e.id === 'entrega').estado === 'feito';
  for (const e of etapas) if ((e.id === 'review' || e.id === 'demo') && entregue && e.estado === 'em andamento') e.estado = 'feito';
  etapas.find(e => e.id === 'review').detalhe = reviews.length ? `${reviews.length} registro(s) no AI-LOG` : 'Sem registro de code review no AI-LOG';

  // Marcos
  const marcos = MARCOS.map(m => {
    const passou = agora >= m.data;
    let ok = null, falta = [];
    if (m.tickets || m.todos) {
      const req = m.todos ? ativos : m.tickets.map(ticket).filter(Boolean);
      falta = req.filter(t => !(t.estado === 'feito' && (!t.fechadoEm || t.fechadoEm <= m.data))).map(t => t.numero);
      ok = !falta.length;
    } else if (m.comeca) {
      falta = m.comeca.filter(n => !['em andamento', 'feito'].includes(ticket(n)?.estado));
      ok = !falta.length;
    }
    const estado = ok === true && (passou || m.tickets || m.todos) ? 'cumprido' : passou ? (ok === false ? 'vencido' : 'passou') : 'pela frente';
    return { ...m, passou, estado, falta, restaHoras: (m.data - agora) / 36e5 };
  });

  // Esperando e riscos
  const tr = secoes(ler(raiz, 'docs/tickets/README.md'));
  const bullets = s => (s || '').split(/\r?\n/).filter(l => /^\s*[-*]\s/.test(l)).map(l => l.replace(/^\s*[-*]\s+/, ''));
  const propostos = ['CONTEXT.md', 'PREMISSAS.md', 'SPEC.md', 'docs/tickets/README.md', ...adrs.map(a => a.arquivo)]
    .filter(f => /^propost/.test(semAcento(campos(ler(raiz, f)).status || '')))
    .map(f => ({ texto: `Revisar e aprovar ${f.startsWith('docs/adr/') ? `o ADR ${adrs.find(a => a.arquivo === f).numero}, ${adrs.find(a => a.arquivo === f).titulo}` : f}`, link: link(f) }));
  const esperando = [...propostos, ...bullets(secao(tr, 'Esperando')).map(texto => ({ texto }))];
  const riscos = [
    ...tickets.filter(t => t.real && t.estimativa && t.real > 2 * t.estimativa).map(t => ({ risco: `Ticket ${t.numero} levou ${fmtDur(t.real)}, mais que o dobro dos ${fmtDur(t.estimativa)} estimados`, mitigacao: 'Regra do projeto: cortar escopo e mandar o resto para o roadmap', fonte: 'Calculado' })),
    ...marcos.filter(m => m.estado === 'vencido').map(m => ({ risco: `Marco das ${fmtHora(m.data)} vencido sem ${m.falta.map(n => `o ${n}`).join(', ')}`, mitigacao: m.nota || 'Rever o escopo restante', fonte: 'Calculado' })),
    ...bullets(secao(tr, 'Riscos')).map(r => ({ risco: r, mitigacao: '', fonte: 'docs/tickets/README.md' })),
    ...riscosDisc,
  ];

  return {
    agora, versao, existe: { discovery: !!disc, context: !!ctx, premissas: !!prem, ailog: !!ailog, roadmap: existe('ROADMAP.md') },
    links: { discovery: link('docs/01-discovery.md'), premissas: link('PREMISSAS.md'), ailog: link('AI-LOG.md'), context: link('CONTEXT.md'), spec: link('SPEC.md'), repo: github },
    adrs, regras, resolvidas, dores, tickets, testes, matriz, semTeste, premissas, ia, etapas, marcos, esperando, riscos,
  };
}

// ---------- render ----------
const chip = (txt, cls) => `<span class="chip ${cls}">${esc(txt)}</span>`;
const CLS = { 'feito': 'ok', 'em andamento': 'vai', 'a fazer': 'nada', 'cortado': 'corte', 'não iniciado': 'nada', aprovado: 'ok', proposto: 'atencao', substituido: 'corte', desconhecido: 'nada', cumprido: 'ok', vencido: 'erro', passou: 'nada', 'pela frente': 'vai' };
const ROT_ADR = { aprovado: 'Aprovado', proposto: 'Proposto', substituido: 'Substituído', desconhecido: 'Sem status' };
const aLink = (href, txt) => href ? `<a href="${esc(href)}">${esc(txt)}</a>` : esc(txt);
const vazioSecao = msg => `<p class="vazio">${esc(msg)}</p>`;
const MARCA = `<svg class="marca" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="var(--tinta)"/><path d="M16 1a15 15 0 0 1 15 15H16zM16 31A15 15 0 0 1 1 16h15z" fill="var(--alvo)"/><circle cx="16" cy="16" r="15" fill="none" stroke="var(--tinta)" stroke-width="2"/></svg>`;

// Escala do tempo: madrugada (02h às 08h) comprimida, para os marcos da tarde não se sobreporem.
function escala(ini, fim) {
  const peso = t => { const h = Number(fmt(t, { hour: '2-digit', hourCycle: 'h23' })); return h >= 2 && h < 8 ? 0.15 : 1; };
  const passo = 15 * 6e4, acum = [];
  let s = 0;
  for (let t = ini.getTime(); t <= fim.getTime(); t += passo) { acum.push(s); s += peso(new Date(t)); }
  return d => {
    const k = Math.max(0, Math.min(acum.length - 1, (d.getTime() - ini.getTime()) / passo));
    const i = Math.floor(k), f = k - i;
    return ((acum[i] + (acum[Math.min(i + 1, acum.length - 1)] - acum[i]) * f) / s) * 100;
  };
}

function gantt(d) {
  const ini = brt('2026-11-11T10:00'), fim = brt('2026-11-13T12:00');
  const x = escala(ini, fim);
  const horas = [];
  for (let t = ini.getTime(); t <= fim.getTime(); t += 3 * 36e5) {
    const dt = new Date(t), h = Number(fmt(dt, { hour: '2-digit', hourCycle: 'h23' }));
    if (h >= 2 && h < 8) continue;
    horas.push(`<span class="hora${h === 0 ? ' dia' : ''}" style="left:${x(dt).toFixed(2)}%">${h === 0 ? fmt(dt, { weekday: 'short' }).replace('.', '') + ' ' + fmtDia(dt) : h + 'h'}</span>`);
  }
  const noites = ['2026-11-12', '2026-11-13'].map(dia => `<span class="noite" style="left:${x(brt(dia + 'T02:00')).toFixed(2)}%;width:${(x(brt(dia + 'T08:00')) - x(brt(dia + 'T02:00'))).toFixed(2)}%" title="Madrugada, escala reduzida"></span>`).join('');
  const marcos = d.marcos.map((m, i) => `<span class="marco m-${m.estado.replace(' ', '-')}" style="left:${x(m.data).toFixed(2)}%"><span class="marco-rot ${i % 2 ? 'baixo' : ''}">${esc(m.curto)}</span></span>`).join('');
  const agora = d.agora >= ini && d.agora <= fim ? `<span class="agora" style="left:${x(d.agora).toFixed(2)}%"><span class="agora-rot">${MARCA}<span>agora, ${esc(fmtHora(d.agora))}</span></span></span>` : '';
  const linhas = d.etapas.map((e, i) => {
    const ms = e.marcas.filter(m => m.data >= ini && m.data <= fim);
    const barra = ms.length ? (() => {
      const a = x(ms[0].data), b = e.estado === 'em andamento' && d.agora <= fim ? Math.max(x(d.agora), x(ms.at(-1).data)) : x(ms.at(-1).data);
      return `<span class="barra b-${CLS[e.estado]}" style="left:${a.toFixed(2)}%;width:${Math.max(b - a, 0.6).toFixed(2)}%"></span>`;
    })() : '';
    const ticks = ms.map(m => `<span class="tick" style="left:${x(m.data).toFixed(2)}%" title="${esc(fmtDiaHora(m.data) + ': ' + m.rotulo)}"></span>`).join('');
    return `<div class="g-linha"><div class="g-rot"><span class="g-num">${i + 1}</span><span class="g-nome">${esc(e.nome)}</span>${chip(e.estado, CLS[e.estado])}</div><div class="g-trilha">${barra}${ticks}</div></div>`;
  }).join('');
  return `<div class="gantt-rolagem" tabindex="0" aria-label="Linha de produção no tempo"><div class="gantt">
    <div class="g-eixo"><div class="g-rot"></div><div class="g-trilha">${horas.join('')}</div></div>
    <div class="g-corpo">${linhas}<div class="g-sobre">${noites}${marcos}${agora}</div></div>
  </div></div>
  <p class="legenda">Cada traço é um commit ou um registro do AI-LOG que tocou a etapa. As linhas verticais são os marcos do prazo. A madrugada aparece comprimida.</p>`;
}

function etapasLista(d) {
  return `<ol class="etapas">${d.etapas.map(e => `<li class="etapa e-${CLS[e.estado]}">
    <span class="etapa-nome">${esc(e.nome)}</span>
    <span class="etapa-meta">${chip(e.estado, CLS[e.estado])}<span>${e.ultima ? esc(fmtDiaHora(e.ultima)) : '—'}</span></span>
    <span class="etapa-art">${e.link ? aLink(e.link, e.artefato) : `<span class="mudo">${esc(e.artefato)} ainda não existe</span>`}${e.detalhe ? `<span class="mudo">${esc(e.detalhe)}</span>` : ''}</span>
  </li>`).join('')}</ol>`;
}

function decisoes(d) {
  const adrs = d.adrs.length ? d.adrs.map(a => `<details class="adr a-${a.estado}">
    <summary>
      <span class="adr-num">${esc(a.numero)}</span>
      <span class="adr-tit">${esc(a.titulo)}${a.substituidoPor ? `<span class="mudo"> Substituído pelo ${esc(a.substituidoPor)}</span>` : ''}</span>
      <span class="adr-meta">${chip(ROT_ADR[a.estado], CLS[a.estado])}<span>${esc(a.data)}</span><span>${esc(a.decidido)}</span></span>
    </summary>
    <div class="adr-corpo">
      ${a.contexto ? `<section><h4>Contexto</h4>${blocos(a.contexto)}</section>` : ''}
      <section><h4>Escolha</h4>${blocos(a.decisao) || vazioSecao('Sem a seção Decisão.')}</section>
      ${a.alternativas ? `<section><h4>Alternativas descartadas</h4>${blocos(a.alternativas)}</section>` : ''}
      ${a.consequencias ? `<section><h4>Trade-off</h4>${blocos(a.consequencias)}</section>` : ''}
      <p class="adr-fonte">${aLink(a.link, a.arquivo)}</p>
    </div>
  </details>`).join('') : vazioSecao('Nenhum ADR ainda. A pasta docs/adr/ não existe ou está vazia.');
  const regras = d.regras.length ? `<ul class="regras">${d.regras.map(r => `<li${r.marca ? ` class="r-marca"` : ''}>
      <span class="r-id">${esc(r.id)}</span>
      <span class="r-txt">${r.marca ? `<span class="r-flag">${esc(r.marca)}</span>` : ''}${inline(r.texto)}</span>
      <span class="r-fonte">${inline(r.fonte)}</span></li>`).join('')}</ul>` : vazioSecao('O discovery ainda não tem a tabela de regras (§9).');
  const resolv = d.resolvidas.length ? `<ul class="resolvidas">${d.resolvidas.map(r => `<li><strong>${inline(r.pergunta)}</strong><span>${inline(r.situacao)}</span></li>`).join('')}</ul>` : '';
  return `<div class="decisoes">
    <div><h3>Registros de decisão (ADR)</h3><p class="sub">Escolhas difíceis de reverter, com as alternativas que ficaram de fora.</p>${adrs}</div>
    <div><h3>Decisões do discovery ${d.versao ? `<span class="mudo">v${esc(d.versao)}</span>` : ''}</h3><p class="sub">Regras de negócio com a fonte de cada uma. ${aLink(d.links.discovery, 'Abrir o discovery')}</p>${regras}
    ${resolv ? `<h3 class="mt">Perguntas que a cliente e o José responderam</h3>${resolv}` : ''}</div>
  </div>`;
}

function quadro(d) {
  if (!d.tickets.length) return vazioSecao('Ainda não há tickets em docs/tickets/.');
  const COL = { 'a fazer': 'A fazer', 'em andamento': 'Em andamento', 'feito': 'Feito', 'cortado': 'Cortado para o roadmap' };
  const card = t => {
    const max = Math.max(t.estimativa || 0, t.real || 0, 1);
    const tempo = t.estimativa || t.real ? `<div class="tempo" title="Estimado contra real">
      <span class="t-lin"><span class="t-rot">estimado</span><span class="t-bar"><i style="width:${((t.estimativa || 0) / max * 100).toFixed(0)}%"></i></span><span>${fmtDur(t.estimativa)}</span></span>
      <span class="t-lin real${t.real > 2 * (t.estimativa || Infinity) ? ' estouro' : ''}"><span class="t-rot">real</span><span class="t-bar"><i style="width:${((t.real || 0) / max * 100).toFixed(0)}%"></i></span><span>${fmtDur(t.real)}</span></span></div>` : '';
    return `<article class="card">
      <header><span class="c-num">${esc(t.numero)}</span>${aLink(t.link, t.titulo)}</header>
      <div class="c-dores">${t.dores.map(x => chip(x, 'dor')).join('') || '<span class="mudo">sem dor</span>'}${t.depende ? `<span class="mudo">depois do ${esc(t.depende)}</span>` : ''}</div>
      ${tempo}
      <div class="c-rodape">
        <span>${t.commits.length ? t.commits.map(c => c.link ? `<a class="hash" href="${esc(c.link)}" title="${esc(c.assunto)}">${esc(c.hash)}</a>` : `<code>${esc(c.hash)}</code>`).join(' ') : '<span class="mudo">sem commit</span>'}</span>
        ${t.testesLigados.length ? `<details><summary>${t.testesLigados.length} teste${t.testesLigados.length > 1 ? 's' : ''} no código</summary><ul>${t.testesLigados.map(x => `<li><code>${esc(x.nome)}</code></li>`).join('')}</ul></details>` : '<span class="mudo">sem teste ligado</span>'}
      </div>
      ${t.estadoDeclarado ? '' : '<p class="c-aviso">Estado inferido: o ticket ainda não tem o campo Estado.</p>'}
    </article>`;
  };
  return `<div class="quadro">${ESTADOS_TICKET.map(e => {
    const ts = d.tickets.filter(t => t.estado === e);
    return `<section class="coluna col-${CLS[e]}"><h3>${COL[e]} <span class="cont">${ts.length}</span></h3>${ts.map(card).join('') || '<p class="vazio">Nenhum.</p>'}</section>`;
  }).join('')}</div>`;
}

function rastreio(d) {
  if (!d.matriz.length) return vazioSecao('As dores ainda não estão no CONTEXT.md.');
  const ids = xs => xs.length ? xs.map(x => `<span class="id">${esc(x)}</span>`).join(' ') : '<span class="mudo">—</span>';
  return `<div class="rolagem"><table class="matriz"><thead><tr><th>Dor</th><th>Regra</th><th>Requisito</th><th>Ticket</th><th>Teste no código</th></tr></thead><tbody>
    ${d.matriz.map(m => `<tr><td><span class="id forte">${esc(m.id)}</span> ${esc(m.nome)}</td><td>${ids(m.regras)}</td><td>${ids(m.requisitos)}</td>
      <td>${m.tickets.length ? m.tickets.map(t => `<a class="tk tk-${CLS[t.estado]}" href="${esc(t.link)}" title="${esc(t.estado)}">${esc(t.numero)}</a>`).join(' ') : `<span class="mudo">${/roadmap/i.test(m.fatia) ? 'roadmap' : '—'}</span>`}</td>
      <td>${m.testes.length ? `<details><summary>${m.testes.length}</summary><ul>${m.testes.map(x => `<li><code>${esc(x.nome)}</code></li>`).join('')}</ul></details>` : '<span class="mudo">0</span>'}</td></tr>`).join('')}
  </tbody></table></div>
  ${d.semTeste.length ? `<p class="lacuna"><strong>Sem teste automatizado:</strong> ${ids(d.semTeste)}. Regra de tela, como a aprovação da RN-07, é conferida na demo.</p>` : '<p class="lacuna ok">Toda regra e todo requisito têm ao menos um teste no código.</p>'}
  <p class="legenda">O painel lê o nome das funções de teste (${d.testes.length} no código) e liga <code>test_rn05_*</code> à RN-05. Ele não roda os testes: verde aqui quer dizer que o teste existe.</p>`;
}

function prazo(d) {
  const rot = { cumprido: 'Cumprido', vencido: 'Vencido', passou: 'Passou', 'pela frente': 'Pela frente' };
  return `<ol class="marcos">${d.marcos.map(m => `<li class="mk mk-${CLS[m.estado]}">
    <time>${esc(fmt(m.data, { weekday: 'short' }).replace('.', ''))} ${esc(fmtDia(m.data))}<strong>${esc(fmtHora(m.data))}</strong></time>
    <div><span class="mk-nome">${esc(m.nome)}</span>
      <span class="mk-det">${chip(rot[m.estado], CLS[m.estado])}${m.estado === 'pela frente' ? `<span>faltam ${m.restaHoras < 1 ? Math.round(m.restaHoras * 60) + ' min' : Math.floor(m.restaHoras) + 'h'}</span>` : ''}${m.falta.length && m.estado !== 'cumprido' ? `<span>Falta: ${m.falta.map(esc).join(', ')}</span>` : ''}</span>
      ${m.nota ? `<span class="mudo">${esc(m.nota)}</span>` : ''}</div>
  </li>`).join('')}</ol>`;
}

function premissas(d) {
  if (!d.premissas.length) return vazioSecao(d.existe.premissas ? 'PREMISSAS.md não tem a tabela esperada.' : 'PREMISSAS.md ainda não existe.');
  const ordem = ['Fato do discovery', 'E-mail da cliente', 'Aprovado pelo José', 'Suposição do FDE', 'Gerado por IA', 'Sem fonte'];
  const grupos = ordem.map(g => [g, d.premissas.filter(p => p.grupo === g)]).filter(([, ps]) => ps.length);
  return `<div class="fontes">${grupos.map(([g, ps]) => `<a href="#g-${esc(semAcento(g).replace(/\W+/g, '-'))}" class="fonte"><strong>${ps.length}</strong>${esc(g)}</a>`).join('')}</div>
  ${grupos.map(([g, ps]) => `<h3 id="g-${esc(semAcento(g).replace(/\W+/g, '-'))}">${esc(g)}</h3><div class="rolagem"><table class="prem"><thead><tr><th>ID</th><th>Item</th><th>Valor</th><th>Justificativa</th></tr></thead><tbody>
    ${ps.map(p => `<tr${p.desvio ? ' class="desvio"' : ''}><td><span class="id">${esc(p.id)}</span></td><td>${inline(p.item)}</td><td>${inline(p.valor)}</td><td>${p.desvio ? '<span class="r-flag">Desvio do discovery</span>' : ''}${inline(p.justificativa)}</td></tr>`).join('')}
  </tbody></table></div>`).join('')}
  <p class="legenda">${aLink(d.links.premissas, 'PREMISSAS.md')}: todo número que não veio da cliente tem um ID, que aparece na tela do protótipo.</p>`;
}

function usoIa(d) {
  if (!d.ia.length) return vazioSecao(d.existe.ailog ? 'AI-LOG.md não tem a tabela esperada.' : 'AI-LOG.md ainda não existe.');
  return `<ol class="ia">${d.ia.map(l => `<li class="${l.jose ? 'ia-jose' : ''}">
    <span class="ia-quando">${esc(l.data)}</span>
    <div class="ia-corpo">
      <p class="ia-tit"><strong>${esc(l.etapa)}</strong><span>${esc(l.ferramenta)}</span>${l.modelo ? `<span class="mudo">${esc(l.modelo)}</span>` : ''}</p>
      <p class="ia-io"><span class="mudo">De</span> ${inline(l.entrada)}</p>
      <p class="ia-io"><span class="mudo">Saiu</span> ${inline(l.saida)}</p>
      ${l.joseTexto ? `<p class="ia-nota">${inline(l.joseTexto)}</p>` : l.jose ? '<p class="ia-nota">Aqui houve correção ou decisão humana.</p>' : ''}
    </div></li>`).join('')}</ol>
  <p class="legenda">Fonte: ${aLink(d.links.ailog, 'AI-LOG.md')}. A faixa amarela marca onde o José corrigiu, decidiu ou um revisor apontou algo.</p>`;
}

function riscos(d) {
  return `<div class="duas">
    <div><h3>Esperando pelo José <span class="cont">${d.esperando.length}</span></h3>${d.esperando.length ? `<ul class="espera">${d.esperando.map(e => `<li>${e.link ? aLink(e.link, e.texto) : inline(e.texto)}</li>`).join('')}</ul>` : vazioSecao('Nada esperando.')}</div>
    <div><h3>Riscos <span class="cont">${d.riscos.length}</span></h3>${d.riscos.length ? `<ul class="riscos">${d.riscos.map(r => `<li><strong>${inline(r.risco)}</strong>${r.mitigacao ? `<span>${inline(r.mitigacao)}</span>` : ''}<span class="mudo">${esc(r.fonte)}</span></li>`).join('')}</ul>` : vazioSecao('Nenhum risco registrado.')}</div>
  </div>`;
}

export function render(d) {
  const feitos = d.tickets.filter(t => t.estado === 'feito').length;
  const ativos = d.tickets.filter(t => t.estado !== 'cortado').length;
  const prox = d.marcos.find(m => !m.passou);
  const aprovados = d.adrs.filter(a => a.estado === 'aprovado').length;
  const SEC = [['linha', 'Linha de produção'], ['decisoes', 'Decisões'], ['tickets', 'Tickets'], ['rastreio', 'Rastreabilidade'], ['prazo', 'Prazo'], ['premissas', 'Premissas'], ['ia', 'Uso de IA'], ['riscos', 'Riscos']];
  const sec = (id, tit, sub, corpo) => `<section id="${id}" class="secao"><header class="s-cab"><h2>${tit}</h2>${sub ? `<p>${sub}</p>` : ''}</header>${corpo}</section>`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rastro do projeto Veloz</title>
<meta name="description" content="Painel de gestão do case de FDE da Strattum: decisões, SDLC, tickets e rastreabilidade do protótipo da Veloz Automotiva.">
<script>try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<style>${CSS}</style>
</head>
<body>
<header class="topo">
  <div class="topo-in">
    <a class="logo" href="#linha">${MARCA}<span>Veloz Automotiva<small>Case de FDE, Strattum</small></span></a>
    <span class="topo-estado">Estado em ${esc(fmtDiaHora(d.agora))}</span>
    <button class="tema" type="button" aria-label="Alternar tema claro e escuro" title="Tema claro ou escuro"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg></button>
  </div>
  <nav class="nav" aria-label="Seções">${SEC.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>
</header>
<main>
  <section class="abertura">
    <h1>O rastro do protótipo, da entrevista à entrega</h1>
    <p class="lead">A Veloz Automotiva quer testar um SUV com menos que os 250 protótipos de R$ 1 milhão do plano atual, sem atrasar o lançamento. Esta página mostra como a solução foi decidida e construída: cada decisão, ticket e teste ligado à dor que resolve. Ela é gerada do repositório; nada aqui é escrito à mão.</p>
    <dl class="fatos">
      <div><dt>Decisões registradas</dt><dd>${d.adrs.length}</dd><span>${aprovados} aprovada${aprovados === 1 ? '' : 's'} pelo José</span></div>
      <div><dt>Tickets feitos</dt><dd>${feitos}<small> de ${ativos}</small></dd><span>${d.tickets.filter(t => t.estado === 'cortado').length} cortado(s) para o roadmap</span></div>
      <div><dt>Testes no código</dt><dd>${d.testes.length}</dd><span>${d.semTeste.length} regra(s) ou requisito(s) sem teste</span></div>
      <div><dt>Próximo marco</dt><dd class="dd-txt">${prox ? esc(fmtHora(prox.data)) : '—'}</dd><span>${prox ? esc(prox.nome) : 'Todos os marcos passaram'}</span></div>
    </dl>
  </section>
  ${sec('linha', 'Linha de produção', 'As oito etapas do ciclo, no tempo, contra os marcos do prazo.', gantt(d) + etapasLista(d))}
  ${sec('decisoes', 'Decisões', 'O que foi decidido, por quem, e o que se perdeu com cada escolha.', decisoes(d))}
  ${sec('tickets', 'Tickets', 'Fatias verticais do protótipo. Cada uma aponta a dor que resolve e compara o tempo estimado com o real.', quadro(d))}
  ${sec('rastreio', 'Rastreabilidade', 'Da dor do cliente até o teste que prova a regra.', rastreio(d))}
  ${sec('prazo', 'Prazo', 'Marcos de quinta, 12/11, até a apresentação de sexta.', prazo(d))}
  ${sec('premissas', 'Premissas', 'De onde vem cada número: fato do discovery, e-mail da cliente, suposição ou IA.', premissas(d))}
  ${sec('ia', 'Uso de IA', 'Cada etapa feita com IA, com a ferramenta, o modelo e onde houve decisão humana.', usoIa(d))}
  ${sec('riscos', 'Riscos e pendências', '', riscos(d))}
</main>
<footer class="rodape"><p>Gerado por <code>painel/gerar.mjs</code> em ${esc(fmtDiaHora(d.agora))}, horário de Brasília. Dado do protótipo é mockado e marcado com o ID da premissa.${d.links.repo ? ` ${aLink(d.links.repo, 'Repositório')}` : ''}</p></footer>
<script>
document.querySelector('.tema').addEventListener('click',function(){var r=document.documentElement,e=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),n=e==='dark'?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('tema',n)}catch(x){}});
</script>
</body>
</html>`;
}

const CSS = `
:root{--papel:#F2F3F1;--sup:#FFFFFF;--sup-2:#E8EAE7;--tinta:#1B2026;--tinta-2:#525C67;--linha:#D6DADB;--alvo:#F2C12E;--alvo-txt:#6E5200;--alvo-fundo:#FBF1CF;
--ok:#2B7A4B;--ok-f:#DDEFE3;--vai:#2858B8;--vai-f:#DEE6F7;--erro:#B83A2E;--erro-f:#F7DEDA;--nada:#6B7480;--nada-f:#E9EBEC;--atencao:#8A6200;--atencao-f:#FBEFC8;
--tit:"Bahnschrift","DIN Alternate","DIN Next","Barlow","Roboto Condensed","Arial Narrow",system-ui,sans-serif;--txt:"Segoe UI",-apple-system,BlinkMacSystemFont,"Helvetica Neue",system-ui,sans-serif;--mono:ui-monospace,"Cascadia Mono",Consolas,Menlo,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--papel:#14171B;--sup:#1C2026;--sup-2:#262B32;--tinta:#E6E8EA;--tinta-2:#9AA3AD;--linha:#2F353D;--alvo-txt:#F2C12E;--alvo-fundo:#3A3214;
--ok:#5FC28A;--ok-f:#1C3226;--vai:#7FA6F0;--vai-f:#1F2A42;--erro:#EE8577;--erro-f:#3D2220;--nada:#98A1AB;--nada-f:#262B32;--atencao:#F2C12E;--atencao-f:#3A3214;color-scheme:dark}}
:root[data-theme="dark"]{--papel:#14171B;--sup:#1C2026;--sup-2:#262B32;--tinta:#E6E8EA;--tinta-2:#9AA3AD;--linha:#2F353D;--alvo-txt:#F2C12E;--alvo-fundo:#3A3214;
--ok:#5FC28A;--ok-f:#1C3226;--vai:#7FA6F0;--vai-f:#1F2A42;--erro:#EE8577;--erro-f:#3D2220;--nada:#98A1AB;--nada-f:#262B32;--atencao:#F2C12E;--atencao-f:#3A3214;color-scheme:dark}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:108px;-webkit-text-size-adjust:100%}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--papel);color:var(--tinta);font:15px/1.55 var(--txt);overflow-x:hidden}
a{color:inherit;text-decoration-color:color-mix(in srgb,currentColor 35%,transparent);text-underline-offset:3px}
a:hover{text-decoration-color:var(--alvo)}
:focus-visible{outline:3px solid var(--alvo);outline-offset:2px;border-radius:3px}
code{font:12.5px var(--mono);background:var(--sup-2);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
h1,h2,h3,h4{font-family:var(--tit);font-weight:600;line-height:1.15;margin:0}
.mudo{color:var(--tinta-2)}
.marca{width:26px;height:26px;flex:none}
.topo{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--papel) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--linha)}
.topo-in{max-width:1180px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:16px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font:600 16px/1.1 var(--tit)}
.logo small{display:block;font:400 12px var(--txt);color:var(--tinta-2)}
.topo-estado{margin-left:auto;font-size:13px;color:var(--tinta-2)}
.tema{background:none;border:1px solid var(--linha);color:var(--tinta);border-radius:999px;width:34px;height:34px;display:grid;place-items:center;cursor:pointer}
.tema svg{width:18px;height:18px}
.nav{max-width:1180px;margin:0 auto;padding:0 12px;display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav a{padding:8px 8px 10px;font-size:13.5px;text-decoration:none;color:var(--tinta-2);white-space:nowrap;border-bottom:2px solid transparent}
.nav a:hover{color:var(--tinta);border-bottom-color:var(--alvo)}
main{max-width:1180px;margin:0 auto;padding:0 20px}
.abertura{padding:56px 0 36px;max-width:900px}
.abertura h1{font-size:clamp(34px,5.4vw,58px);font-weight:600;letter-spacing:-.01em;font-stretch:88%;max-width:16ch}
.lead{font-size:17px;max-width:64ch;color:var(--tinta-2);margin:18px 0 32px}
.fatos{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin:0;border-top:3px solid var(--tinta)}
.fatos>div{padding:14px 16px 4px 0;border-right:1px solid var(--linha);margin-right:16px}
.fatos>div:last-child{border:0}
.fatos dt{font-size:13px;color:var(--tinta-2)}
.fatos dd{margin:2px 0 0;font:600 40px/1.1 var(--tit);font-variant-numeric:tabular-nums}
.fatos dd small{font-size:20px;color:var(--tinta-2);font-weight:400}
.fatos .dd-txt{font-size:40px}
.fatos span{font-size:12.5px;color:var(--tinta-2);display:block}
.secao{padding:48px 0 8px;border-top:1px solid var(--linha)}
.s-cab{margin-bottom:22px;max-width:70ch}
.s-cab h2{font-size:30px}
.s-cab p{margin:6px 0 0;color:var(--tinta-2)}
h3{font-size:19px;margin:0 0 4px}
h3.mt,.prem+h3,.rolagem+h3{margin-top:28px}
.sub{margin:0 0 14px;color:var(--tinta-2);font-size:14px}
.cont{font:500 13px var(--txt);color:var(--tinta-2);margin-left:4px}
.chip{display:inline-block;font:500 12px/1 var(--txt);padding:4px 8px 5px;border-radius:999px;white-space:nowrap;background:var(--nada-f);color:var(--nada)}
.chip.ok{background:var(--ok-f);color:var(--ok)}.chip.vai{background:var(--vai-f);color:var(--vai)}.chip.erro{background:var(--erro-f);color:var(--erro)}
.chip.atencao{background:var(--atencao-f);color:var(--atencao)}.chip.corte{background:transparent;border:1px dashed var(--nada);color:var(--nada)}
.chip.dor{background:var(--tinta);color:var(--papel);font-family:var(--tit);font-weight:600}
.vazio{padding:18px;border:1px dashed var(--linha);border-radius:8px;color:var(--tinta-2);margin:0}
.legenda{font-size:13px;color:var(--tinta-2);max-width:80ch}
.nota{font-size:13px;color:var(--tinta-2);font-style:italic}
.rolagem{overflow-x:auto;-webkit-overflow-scrolling:touch}
table{border-collapse:collapse;width:100%;font-size:14px}
th{font:600 13px var(--txt);text-align:left;color:var(--tinta-2);padding:8px 10px;border-bottom:2px solid var(--tinta)}
td{padding:9px 10px;border-bottom:1px solid var(--linha);vertical-align:top}
.id{font:600 13px var(--tit);white-space:nowrap;letter-spacing:.01em}
.id.forte{background:var(--tinta);color:var(--papel);padding:1px 6px;border-radius:3px}
/* gantt */
.gantt-rolagem{overflow-x:auto;background:var(--sup);border:1px solid var(--linha);border-radius:10px;padding:8px 0 10px}
.gantt{min-width:920px;position:relative}
.g-linha,.g-eixo{display:grid;grid-template-columns:250px 1fr;align-items:center}
.g-rot{position:sticky;left:0;z-index:2;background:var(--sup);display:flex;align-items:center;gap:8px;padding:0 12px 0 16px;height:44px;border-right:1px solid var(--linha)}
.g-eixo .g-rot{height:52px}
.g-num{font:600 13px var(--tit);color:var(--tinta-2);width:14px}
.g-nome{font:500 14.5px var(--tit);flex:1}
.g-rot .chip{font-size:11px;padding:3px 7px 4px}
.g-trilha{position:relative;height:44px;margin:0 18px 0 10px}
.g-eixo .g-trilha{height:52px}
.g-linha+.g-linha .g-trilha{border-top:1px dashed var(--linha)}
.hora{position:absolute;bottom:6px;transform:translateX(-50%);font-size:11.5px;color:var(--tinta-2);white-space:nowrap}
.hora.dia{font:600 12px var(--tit);color:var(--tinta)}
.g-corpo{position:relative}
.g-sobre{position:absolute;top:0;bottom:0;left:260px;right:18px;pointer-events:none}
.noite{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(135deg,transparent 0 4px,var(--sup-2) 4px 5px)}
.marco{position:absolute;top:-52px;bottom:0;border-left:1px solid var(--tinta-2)}
.marco.m-cumprido{border-left-color:var(--ok)}.marco.m-vencido{border-left:2px solid var(--erro)}
.marco-rot{position:absolute;top:2px;left:4px;font:500 11.5px var(--tit);white-space:nowrap;color:var(--tinta)}
.marco-rot.baixo{top:17px}
.agora{position:absolute;top:-52px;bottom:0;border-left:2px solid var(--alvo);z-index:1}
.agora-rot{position:absolute;bottom:-26px;left:-12px;display:flex;align-items:center;gap:5px;font:600 12px var(--tit);white-space:nowrap}
.agora-rot .marca{width:22px;height:22px}
.barra{position:absolute;top:14px;height:16px;border-radius:3px;background:var(--nada-f)}
.barra.b-ok{background:var(--ok-f);box-shadow:inset 0 0 0 1px var(--ok)}.barra.b-vai{background:var(--vai-f);box-shadow:inset 0 0 0 1px var(--vai)}
.tick{position:absolute;top:11px;width:3px;height:22px;margin-left:-1.5px;background:var(--tinta);border-radius:1px}
.gantt-rolagem+.legenda{margin:12px 0 26px}
/* etapas */
.etapas{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;counter-reset:e;border-top:1px solid var(--linha)}
.etapa{counter-increment:e;padding:14px 16px 16px 0;border-bottom:1px solid var(--linha);display:flex;flex-direction:column;gap:6px;font-size:13.5px;position:relative}
.etapa::before{content:counter(e);font:600 28px/1 var(--tit);color:var(--linha)}
.etapa.e-ok::before{color:var(--ok)}.etapa.e-vai::before{color:var(--vai)}
.etapa-nome{font:600 16px var(--tit)}
.etapa-meta{display:flex;gap:8px;align-items:center;color:var(--tinta-2);font-size:12.5px}
.etapa-art{display:flex;flex-direction:column;gap:2px;overflow-wrap:anywhere}
/* decisoes */
.decisoes{display:grid;grid-template-columns:1.25fr 1fr;gap:40px;align-items:start}
.adr{background:var(--sup);border:1px solid var(--linha);border-radius:10px;margin-bottom:10px}
.adr.a-aprovado{border-left:4px solid var(--ok)}.adr.a-proposto{border-left:4px solid var(--alvo)}.adr.a-substituido{opacity:.7}
.adr summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;padding:14px 16px}
.adr summary::-webkit-details-marker{display:none}
.adr-num{font:600 26px/1 var(--tit);color:var(--tinta-2);grid-row:span 2;font-variant-numeric:tabular-nums}
.adr-tit{font:600 16px/1.3 var(--tit)}
.a-substituido .adr-tit{text-decoration:line-through}
.adr-meta{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-size:12.5px;color:var(--tinta-2)}
.adr[open] summary{border-bottom:1px solid var(--linha)}
.adr-corpo{padding:4px 16px 14px;display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:14px}
.adr-corpo section:has(table),.adr-corpo .adr-fonte{grid-column:1/-1}
.adr-corpo h4{font-size:13.5px;margin:12px 0 2px;color:var(--alvo-txt)}
.adr-corpo p,.adr-corpo ul,.adr-corpo ol{margin:4px 0}
.adr-corpo ul,.adr-corpo ol{padding-left:18px}
.adr-corpo table{font-size:13px}
.adr-fonte{font-size:12.5px;margin-top:10px!important}
.regras,.resolvidas,.espera,.riscos{list-style:none;margin:0;padding:0}
.regras li{display:grid;grid-template-columns:58px 1fr;gap:2px 10px;padding:10px 0;border-bottom:1px solid var(--linha);font-size:14px}
.r-id{font:600 14px var(--tit);grid-row:span 2}
.r-fonte{font-size:12.5px;color:var(--tinta-2)}
.r-marca{background:linear-gradient(90deg,var(--alvo-fundo),transparent 70%)}
.r-flag{display:inline-block;font:600 12px var(--tit);color:var(--alvo-txt);margin-right:8px}
.resolvidas li{padding:9px 0;border-bottom:1px solid var(--linha);font-size:14px;display:flex;flex-direction:column}
.resolvidas span{color:var(--tinta-2);font-size:13.5px}
/* quadro */
.quadro{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;align-items:start}
.coluna{background:var(--sup-2);border-radius:10px;padding:12px;min-height:120px}
.coluna h3{font-size:15px;margin:2px 4px 10px;display:flex;align-items:center;gap:6px}
.coluna h3::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--nada)}
.col-ok h3::before{background:var(--ok)}.col-vai h3::before{background:var(--vai)}.col-corte h3::before{background:transparent;border:1px dashed var(--nada)}
.coluna .vazio{padding:10px;font-size:13px}
.card{background:var(--sup);border:1px solid var(--linha);border-radius:8px;padding:12px;margin-bottom:10px;font-size:13.5px;display:flex;flex-direction:column;gap:9px}
.card header{display:flex;gap:9px;align-items:baseline;font:600 14.5px/1.3 var(--tit)}
.card header a{text-decoration:none}.card header a:hover{text-decoration:underline}
.c-num{font:600 18px/1 var(--tit);color:var(--tinta-2)}
.c-dores{display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:12.5px}
.tempo{display:flex;flex-direction:column;gap:3px;font-size:12px;font-variant-numeric:tabular-nums}
.t-lin{display:grid;grid-template-columns:58px 1fr 44px;gap:8px;align-items:center;color:var(--tinta-2)}
.t-lin>span:last-child{text-align:right;color:var(--tinta)}
.t-bar{height:6px;background:var(--sup-2);border-radius:3px;overflow:hidden}
.t-bar i{display:block;height:100%;background:var(--tinta-2)}
.real .t-bar i{background:var(--vai)}.estouro .t-bar i{background:var(--erro)}
.c-rodape{display:flex;flex-direction:column;gap:6px;font-size:12.5px;border-top:1px solid var(--linha);padding-top:8px}
.hash{font:12px var(--mono)}
.card details summary,.matriz details summary{cursor:pointer;color:var(--tinta-2)}
.card details ul,.matriz details ul{margin:6px 0 0;padding-left:16px}
.c-aviso{margin:0;font-size:11.5px;color:var(--tinta-2);font-style:italic}
/* matriz */
.matriz td:first-child{min-width:240px;font-weight:500}
.tk{display:inline-block;font:600 13px var(--tit);padding:1px 6px;border-radius:3px;text-decoration:none;background:var(--nada-f);margin:1px 0}
.tk-ok{background:var(--ok-f);color:var(--ok)}.tk-vai{background:var(--vai-f);color:var(--vai)}.tk-corte{text-decoration:line-through}
.lacuna{background:var(--alvo-fundo);border-left:4px solid var(--alvo);padding:10px 14px;border-radius:0 6px 6px 0;font-size:14px;margin:16px 0 8px}
.lacuna.ok{background:var(--ok-f);border-left-color:var(--ok)}
/* marcos */
.marcos{list-style:none;margin:0;padding:0;border-left:2px solid var(--linha);margin-left:8px}
.mk{display:grid;grid-template-columns:120px 1fr;gap:16px;padding:12px 0 12px 20px;position:relative}
.mk::before{content:"";position:absolute;left:-7px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--papel);border:2px solid var(--nada)}
.mk-ok::before{background:var(--ok);border-color:var(--ok)}.mk-erro::before{background:var(--erro);border-color:var(--erro)}.mk-vai::before{border-color:var(--vai)}
.mk time{font-size:13px;color:var(--tinta-2);display:flex;flex-direction:column}
.mk time strong{font:600 26px/1.1 var(--tit);color:var(--tinta);font-variant-numeric:tabular-nums}
.mk>div{display:flex;flex-direction:column;gap:5px}
.mk-nome{font:600 17px var(--tit)}
.mk-det{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:13px;color:var(--tinta-2)}
.mk .mudo{font-size:13px}
/* premissas */
.fontes{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px}
.fonte{display:flex;align-items:baseline;gap:8px;padding:10px 14px;background:var(--sup);border:1px solid var(--linha);border-radius:8px;text-decoration:none;font-size:14px}
.fonte strong{font:600 24px/1 var(--tit)}
.prem td:nth-child(2){min-width:160px}.prem td:nth-child(4){min-width:280px;color:var(--tinta-2)}
.desvio td{background:var(--alvo-fundo)}
/* ia */
.ia{list-style:none;margin:0;padding:0}
.ia li{display:grid;grid-template-columns:110px 1fr;gap:16px;padding:14px 0 14px 14px;border-bottom:1px solid var(--linha);border-left:4px solid transparent}
.ia li.ia-jose{border-left-color:var(--alvo)}
.ia-quando{font:600 15px var(--tit);font-variant-numeric:tabular-nums}
.ia-corpo p{margin:0 0 4px;font-size:14px;max-width:90ch}
.ia-tit{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}
.ia-tit strong{font:600 16px var(--tit)}
.ia-io .mudo{display:inline-block;width:34px;font-size:12.5px}
.ia-nota{color:var(--alvo-txt);font-weight:500}
/* riscos */
.duas{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.espera li,.riscos li{padding:10px 0;border-bottom:1px solid var(--linha);font-size:14px;display:flex;flex-direction:column;gap:2px}
.espera li{padding-left:22px;position:relative}
.espera li::before{content:"";position:absolute;left:0;top:15px;width:11px;height:11px;border:2px solid var(--alvo);border-radius:50%}
.riscos span{color:var(--tinta-2);font-size:13.5px}.riscos .mudo{font-size:12px}
.rodape{max-width:1180px;margin:48px auto 0;padding:24px 20px 40px;border-top:1px solid var(--linha);font-size:13px;color:var(--tinta-2)}
@media (max-width:980px){.decisoes,.duas{grid-template-columns:1fr}.quadro{grid-template-columns:1fr 1fr}.etapas{grid-template-columns:1fr 1fr}}
@media (max-width:640px){
  main,.topo-in{padding-left:16px;padding-right:16px}.nav{padding:0 8px}
  .topo-estado{display:none}.tema{margin-left:auto}
  .abertura{padding:36px 0 24px}.lead{font-size:16px}
  .fatos{grid-template-columns:1fr 1fr}.fatos>div{border-right:0;border-bottom:1px solid var(--linha);margin-right:12px}
  .fatos dd,.fatos .dd-txt{font-size:32px}
  .quadro,.etapas{grid-template-columns:1fr}
  .adr-corpo{grid-template-columns:1fr}
  .g-linha,.g-eixo{grid-template-columns:150px 1fr}.g-sobre{left:160px}.g-rot .chip{display:none}.g-rot{padding-left:10px}
  .mk{grid-template-columns:84px 1fr;gap:10px}.mk time strong{font-size:22px}
  .ia li{grid-template-columns:1fr;gap:4px}
  .secao{padding-top:36px}.s-cab h2{font-size:26px}
}
`;

export function gerar(raiz = RAIZ, opcoes) {
  const html = render(montar(raiz, opcoes));
  fs.mkdirSync(path.join(raiz, 'painel'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'painel', 'index.html'), html);
  return html;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = gerar();
  console.log(`painel/index.html gravado (${Math.round(html.length / 1024)} KB).`);
}
