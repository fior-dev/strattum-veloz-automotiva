// node --test painel/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseAdr, parseTicket, montar, render, idsDoTeste, minutos } from './gerar.mjs';

const ADR = `# ADR 0002 · Heurística gulosa, solver no roadmap

status: aprovado pelo José · 12/11/2026 · Substituído por: —

## Contexto
A demo precisa dar o mesmo resultado.

## Decisão
Gulosa determinística.

## Alternativas descartadas
- **Solver CP-SAT.** Ótimo, mas não se explica.

## Consequências
- Perda: o número não é ótimo.
`;

test('ADR: número, status, data, quem decidiu e seções', () => {
  const a = parseAdr(ADR, 'docs/adr/0002-heuristica.md');
  assert.equal(a.numero, '0002');
  assert.equal(a.titulo, 'Heurística gulosa, solver no roadmap');
  assert.equal(a.estado, 'aprovado');
  assert.equal(a.data, '12/11/2026');
  assert.equal(a.decidido, 'José');
  assert.equal(a.substituidoPor, null);
  assert.match(a.alternativas, /CP-SAT/);
  assert.match(a.consequencias, /não é ótimo/);
});

test('ADR proposto e substituído', () => {
  assert.equal(parseAdr('# ADR 0001 · X\n\nstatus: proposto, aguardando revisão do José · 12/11/2026\n').decidido, 'Proposto pelo agente, aguardando o José');
  const s = parseAdr('# ADR 0003 · Y\n\nstatus: substituído · Substituído por: 0008 · Decidido por: José\n');
  assert.equal(s.estado, 'substituido');
  assert.equal(s.substituidoPor, '0008');
  assert.equal(s.decidido, 'José');
});

test('ADR sem seções usa o corpo como decisão', () => {
  const a = parseAdr('# ADR 0005 · Fora\n\nstatus: proposto\n\n| Fora | Por quê |\n|---|---|\n| Login | Não muda a demo |\n');
  assert.match(a.decisao, /Login/);
});

test('ticket: campos da linha, RN/RF citados e testes', () => {
  const t = parseTicket(`# 04 · Replanejar

Dor: D4, D5 · Depende de: 03 · Estimativa: 2h · Estado: feito · Real: 2h30 · Commits: ab12cd3, ef45678
Testes: test_extra

## Aceite
- [x] RN-05 com troca.
- [ ] RF-06: aceitar cria a versão N+1. Ver test_fronteira.py.
`, 'docs/tickets/04-replanejar.md');
  assert.equal(t.numero, '04');
  assert.deepEqual(t.dores, ['D4', 'D5']);
  assert.equal(t.depende, '03');
  assert.equal(t.estimativa, 120);
  assert.equal(t.real, 150);
  assert.equal(t.estado, 'feito');
  assert.deepEqual(t.commits, ['ab12cd3', 'ef45678']);
  assert.deepEqual(t.regras, ['RN-05']);
  assert.deepEqual(t.requisitos, ['RF-06']);
  assert.ok(t.testes.includes('test_extra') && t.testes.includes('test_fronteira'));
  assert.deepEqual(t.aceite, { total: 2, feitos: 1 });
});

test('ticket sem campos não quebra', () => {
  const t = parseTicket('# 06a · Acabamento\n\nDepende de: 04 · Estimativa: 1h\n', 'docs/tickets/06a-acabamento.md');
  assert.equal(t.numero, '06a');
  assert.equal(t.estado, null);
  assert.deepEqual(t.dores, []);
  assert.equal(t.real, null);
});

test('durações e ids de teste', () => {
  assert.equal(minutos('1h30'), 90);
  assert.equal(minutos('45 min'), 45);
  assert.equal(minutos('—'), null);
  assert.deepEqual(idsDoTeste('test_rn05_com_troca'), ['RN-05']);
  assert.deepEqual(idsDoTeste('test_folga_muda_a_reserva'), []);
});

test('etapa aprovada mostra a data da aprovação, não a do último commit', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-'));
  try {
    fs.writeFileSync(path.join(dir, 'SPEC.md'), '# Spec\n\nstatus: aprovado pelo José · 12/11/2026 · Decidido por: José\n');
    const git = [{ hash: 'abc1234', data: new Date('2026-11-13T09:51:00-03:00'), assunto: 'revisão', arquivos: ['SPEC.md'] }];
    const d = montar(dir, { agora: new Date('2026-11-13T11:00:00-03:00'), git, github: null });
    assert.equal(d.etapas.find(e => e.id === 'spec').aprovadoEm, '12/11');
    assert.match(render(d), /aprovado em 12\/11/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('repo vazio: tudo aparece como não iniciado, sem erro', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-'));
  try {
    const d = montar(dir, { agora: new Date('2026-11-12T01:00:00-03:00'), git: [], github: null });
    assert.equal(d.adrs.length, 0);
    assert.equal(d.tickets.length, 0);
    assert.ok(d.etapas.every(e => e.estado === 'não iniciado'));
    const html = render(d);
    assert.match(html, /Nenhum ADR ainda/);
    assert.match(html, /PREMISSAS\.md ainda não existe/);
    assert.match(html, /AI-LOG\.md ainda não existe/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('estado do ticket cai para a tabela do README e o HTML escapa texto', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-'));
  try {
    fs.mkdirSync(path.join(dir, 'docs/tickets'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'README.md'), '## Estado das fatias\n\n| Fatia | Estado |\n|---|---|\n| 01 Esqueleto | pronta |\n| 04 Replanejar | pronta |\n| 04b Avarias | — |\n');
    fs.writeFileSync(path.join(dir, 'docs/tickets/01-esqueleto.md'), '# 01 · Esqueleto <script>\n\nDor: D2 · Estimativa: 1h\n');
    fs.writeFileSync(path.join(dir, 'docs/tickets/04b-avarias.md'), '# 04b · Avarias\n\nDor: D6 · Estimativa: 1h\n\n- [ ] RN-09 leve\n');
    fs.mkdirSync(path.join(dir, 'backend/tests'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'backend/tests/test_x.py'), 'def test_cenario():\n    # avaria leve (RN-09)\n    pass\n\ndef test_outro():\n    pass\n');
    const d = montar(dir, { agora: new Date('2026-11-12T01:00:00-03:00'), git: [], github: null });
    assert.equal(d.tickets.find(t => t.numero === '01').estado, 'feito');
    assert.equal(d.tickets.find(t => t.numero === '04b').estado, 'a fazer'); // não herda o 04
    assert.deepEqual(d.tickets.find(t => t.numero === '04b').testesLigados.map(t => t.nome), ['test_cenario']); // RN-09 citada no corpo
    assert.ok(!render(d).includes('Esqueleto <script>'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
