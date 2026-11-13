# ADR 0006 · Dados em JSON no protótipo, Postgres (Supabase) como alvo; nuvem-alvo AWS

status: aprovado pelo José · 12/11/2026 · Decidido por: José

## Contexto
A demo não pode falhar por rede ou banco. O dado é mockado. O plano tem versões (RF-06).

## Decisão
- Fatias 1 a 4: `JsonPlanoRepository` lê `backend/data/mock.json` e guarda as versões do plano em memória. Reiniciar o backend volta ao mock, o que deixa a demo reproduzível.
- Fatia 5b: `SupabasePlanoRepository`, escolhido por `DATA_BACKEND` no `container.py`. Fala com o PostgREST só com a stdlib (urllib), sem dependência nova. O plano é gravado inteiro como documento `jsonb` por versão, porque o motor lê e grava o plano inteiro. RLS ligado e nenhuma política: só a chave secreta, no `backend/.env`, acessa. Projeto numa organização Free do José, porque a outra organização dele é Pro e cobraria o projeto (decidido pelo José, 12/11).
- O mock é gerado por `backend/scripts/gerar_mock.py`, com semente fixa (MK-07). O script calibra só as entradas; o número do plano compartilhado sai do motor (PREMISSAS.md, MK-03).
- Nuvem-alvo: AWS. Backend em contêiner (ECS Fargate), SPA estática (S3 + CloudFront), Postgres gerenciado (Supabase ou RDS), segredos no Secrets Manager. Nada disso roda no protótipo: a entrevista pediu "nada em produção" `[T]`, o prazo era de um dia e cada serviço tem custo e configuração. O que roda é o primeiro degrau: um contêiner único (ticket 08, abaixo). A mesma imagem sobe no Fargate sem mudar código.

## Alternativas descartadas
- **SQLite local.** Um passo a mais sem ganho sobre o JSON na demo, e não é o banco-alvo.
- **Supabase desde a fatia 1.** Risco de rede na demo e tempo de setup antes de existir valor.

## Consequências
- Com o JSON, o plano aceito some ao reiniciar: a demo é reproduzível. Com o Supabase, ele fica: `scripts/seed_supabase.py` volta ao mock.
- Plano como documento: não dá para consultar uma alocação solta em SQL. Aceitável enquanto só o motor lê; vira tabela de alocações quando o BI precisar (ROADMAP v3).

## Publicação para a avaliação (ticket 08)

status: a publicação por túnel foi decidida pelo José em 13/11/2026; o restante desta seção é proposta do FDE, de 12/11/2026

RNF-01 pedia "sem backend". O protótipo tem FastAPI (ADR 0001), então a saída é publicar um contêiner único (tela e API na mesma porta) numa URL do José. A Strattum testa sem instalar nada.
- Uma instância, um worker: a proposta pendente fica na memória. Por isso não serve serverless para a API.
- `DATA_BACKEND=json` no host. `DATA_BACKEND` é a variável que escolhe onde o backend guarda o plano: `json` (arquivo do mock, versões na memória) ou `supabase` (Postgres). O adapter do Supabase existe, foi carregado e passa nos mesmos testes do JSON. Para a URL pública da avaliação a recomendação é `json`, por dois motivos: sem login, qualquer pessoa com a URL grava no plano, e com `json` basta reiniciar o contêiner para voltar à versão 1; e a chave secreta do Supabase não sai da máquina do José. Quem quiser mostrar o plano persistindo no banco roda local com `DATA_BACKEND=supabase`.
- Descartado: Vercel com a API como função. Cada chamada pode cair numa instância diferente e perder a proposta; resolver isso pediria gravar a proposta pendente no banco, mudança de `application/` sem ganho para a demo.
- Perde-se: login e limite de chamadas. Fica no ROADMAP (v2, login e perfis).
- **Como ficou em 13/11 (decisão do José).** Para a avaliação, nenhuma hospedagem: o backend roda na máquina do José (um processo, servindo a tela pelo `TELA_DIR`) e um Cloudflare Tunnel publica a URL. O Cloudflare Access pede login por código enviado ao e-mail antes de qualquer rota. Isso troca o risco "qualquer um com a URL grava no plano" por "só os e-mails liberados", sem custo e sem a chave do LLM ir para um host. Perde-se: a demo depende da máquina ligada. O contêiner continua sendo o caminho do piloto.
