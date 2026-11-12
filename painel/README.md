# Painel de gestão do projeto

`painel/index.html` mostra o rastro do processo: decisões, linha de produção do SDLC, tickets, rastreabilidade, prazo, premissas, uso de IA e riscos.
É um HTML só, sem dependência e sem CDN. Abra o arquivo no navegador.

## Regenerar (Windows PowerShell)

Na raiz do repositório:

```powershell
node painel/gerar.mjs
```

Testes do gerador: `node --test painel/`.

O gerador lê os arquivos do repo e o `git log` (só hash curto, data e assunto). Arquivo que ainda não existe aparece como "ainda não iniciado". O horário do painel é o da geração, congelado no HTML.

## Formato que o gerador espera

Tudo é a convenção que os arquivos já usam: campos `Chave: valor` separados por ` · `, numa linha antes do primeiro `##`. Campo ausente aparece como "—".

### Ticket (`docs/tickets/NN-nome.md`)

```markdown
# 04 · Replanejar: atraso de +N semanas, falha e aceite

Dor: D4, D5 · Depende de: 03 · Estimativa: 2h · Estado: feito · Real: 2h30 · Commits: ab12cd3, ef45678
Testes: test_rn05_com_troca, test_atraso_de_n_semanas
```

| Campo | Valores | Obrigatório |
|---|---|---|
| `Dor` | `D1` a `D7`, separados por vírgula | sim |
| `Depende de` | número do ticket ou `—` | não |
| `Estimativa` / `Real` | `45 min`, `1h`, `1h30`, `2h30` | estimativa sim; real ao fechar |
| `Estado` | `a fazer`, `em andamento`, `feito`, `cortado` (foi para o roadmap) | sim |
| `Commits` | hashes curtos, separados por vírgula. A data do commit vira a hora em que o ticket fechou | ao fechar |
| `Testes` | nomes das funções de teste, separados por vírgula | não: o gerador já liga sozinho todo `test_rnNN_*` e `test_rfNN_*` às regras RN-NN e RF-NN citadas no ticket |

Sem `Estado`, o gerador usa a tabela "Estado das fatias" do `README.md` da raiz (`pronta` = feito) e, se não achar, os checkboxes do aceite.
RN-xx e RF-xx citados em qualquer lugar do ticket entram na matriz de rastreabilidade.

### ADR (`docs/adr/NNNN-nome.md`)

```markdown
# ADR 0007 · Título da decisão

status: aprovado pelo José · 12/11/2026 · Decidido por: José · Substituído por: —

## Contexto
## Decisão
## Alternativas descartadas
## Consequências
```

- `status` começa com `proposto`, `aprovado` ou `substituído`. A data `DD/MM/AAAA` pode vir em qualquer campo da linha.
- `Decidido por`: quem decidiu. Sem o campo, o painel mostra "proposto pelo agente, aguardando o José" para status proposto.
- `Substituído por`: número do ADR novo.
- As quatro seções acima viram contexto, escolha, alternativas e trade-off. Seção que falta aparece vazia, sem erro.

### `AI-LOG.md`

Uma tabela com cabeçalho `| Data | Etapa | Ferramenta | Entrada | Saída |`. Coluna opcional `José`: onde o José corrigiu ou decidiu. Sem ela, o painel destaca as linhas cuja saída fala em José, correção, desvio ou advisor.

### Esperando pelo José e riscos

O gerador junta sozinho todo arquivo com `status: proposto` na primeira linha de campos. Item extra vai em `docs/tickets/README.md`, numa lista sob `## Esperando pelo José` ou `## Riscos`:

```markdown
## Esperando pelo José
- Aprovar os ADRs 0001 a 0006

## Riscos
- Copiloto depende do OpenRouter free: fora do ar, a demo usa a tela sem texto livre
```

Os riscos do §16 do discovery entram sempre. Ticket com `Real` acima do dobro da `Estimativa` e marco vencido sem os tickets prontos viram risco automático.

### Outras fontes, sem formato novo

| Arquivo | O que o painel lê |
|---|---|
| `docs/01-discovery.md` | versão, regras RN (§9), requisitos RF (§11), riscos (§16), perguntas resolvidas (§17) |
| `CONTEXT.md` | tabela de dores D1 a D7 |
| `PREMISSAS.md` | tabela `ID \| Item \| Valor \| Justificativa \| Fonte` |
| `SPEC.md`, `ROADMAP.md`, `docs/tickets/README.md` | existência e data do último commit |
| `backend/tests/**/test_*.py`, `frontend/src/**/*.test.*` | nomes das funções de teste. O painel diz "no código": ele não roda os testes |
