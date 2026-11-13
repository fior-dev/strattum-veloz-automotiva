# 09 · Ajustes da revisão dos documentos pelo José

Dor: — · Depende de: 06b · Estimativa: 1h · Estado: feito · Pedido do José em 12/11, depois de ler CONTEXT, PREMISSAS, SPEC, ROADMAP, mapa e ADRs.

## O quê
- Nomes: "como hoje" virou "pedidos por área (processo atual)"; "não cabe" virou "testes sem alocação". Os campos da API (`como_hoje`, `nao_cabe`) não mudaram.
- A área "Dinâmica veicular" virou "Hidráulica" (testes `HID-xx`). O mock foi regerado: os números não mudaram (245 → 168). A troca do cenário da demo agora move o ELE-01, não mais o DIN-02, porque o desempate é pelo ID.
- Tela: apresentação guiada em 5 passos; seletor de perfil simulado (gerente ou engenharia), que só trava os botões da proposta; lista de avarias da versão; tabela dos pedidos por área (a planilha de hoje).
- Documentos: explicações pedidas em PREMISSAS, SPEC, ROADMAP (com a RICE), mapa e ADRs 0001, 0002, 0003, 0006 e 0007. Diagrama do SPEC com texto escuro nas caixas claras.
- `docs/roteiro-de-teste.md`: o que clicar, o que deve aparecer e o que dizer (roteiro de ensaio do José; saiu do repositório em 13/11).
- Banco: migration `area_hidraulica` aceita o nome novo da área; o seed passou a apagar testes e pedidos antigos antes de carregar.

## Aceite
- [x] `uv run pytest`: 59 passam, incluídos os 2 de contrato do Supabase.
- [x] `npm run build` passa.
- [x] Os números do roteiro foram conferidos no motor (revisão independente, 12/11).
- [x] Revisão independente (Fable 5.2, esforço high) sobre o diff: 1 achado grave (o passo a passo travava no passo 5 depois do primeiro aceite) e 9 menores; os 10 corrigidos.
- [ ] Tela no navegador: não vista por quem escreveu. O José testa.
