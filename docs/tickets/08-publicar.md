# 08 · Publicar para a Strattum testar

Dor: — · Depende de: 06b · Estimativa: 1h · Estado: feito · Real: 15 min · Commits: 5065c91

Pedido do José em 12/11: publicar num subdomínio dele para a Strattum testar sem instalar nada. Responde ao conflito RNF-01 "sem backend" × FastAPI (ADR 0001): o protótipo segue com backend, mas a avaliação não precisa rodar nada local.

## O quê
- Um contêiner serve a tela e a API na mesma porta (`Dockerfile` na raiz). Sem `TELA_DIR`, nada muda no modo local.
- Chaves só em tempo de execução; `.dockerignore` tira `.env`, `.mcp.json` e `.claude/` da imagem.
- Uma instância e um worker: a proposta pendente vive na memória do processo. Serverless (Vercel para a API) não serve: o aceite cairia noutra instância e responderia "Não há proposta pendente".
- Publicado com `DATA_BACKEND=json`: o Supabase não é usado na demo publicada, e reiniciar o backend volta a demo ao início.

## Aceite
- [x] `docker build` passa e a imagem não tem nenhum `.env` (conferido com `find` dentro da imagem, 12/11).
- [x] Contêiner local: a tela abre em `/`, `/docs` responde, atraso do AER-99 gera a proposta DIN-02 P006 → P162 e o aceite cria a v2 (12/11; desde o ticket 09 a troca é do ELE-01).
- [x] Memória: 54 MB sem LLM, 286 MB com o copiloto ligado.
- [x] Hospedagem e domínio escolhidos pelo José (13/11): sem hospedagem. O backend roda na máquina dele, servindo a tela pelo `TELA_DIR`, e um Cloudflare Tunnel publica a URL atrás do Cloudflare Access (login por código enviado ao e-mail). O contêiner fica pronto para o piloto.
- [x] Teste da URL publicada (13/11): o José abriu a tela pela URL, depois do login.
