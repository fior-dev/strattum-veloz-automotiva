# Roteiro de teste e de apresentação

status: proposto, aguardando revisão do José · 12/11/2026

Serve para duas coisas: testar o protótipo antes da demo e saber explicar cada número e cada decisão. Cada passo diz **o que fazer**, **o que deve aparecer** e **o que dizer**. Todos os números abaixo foram conferidos no motor em 12/11, com o mock da semente 42.

## Antes de começar

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

Rodar na raiz do repo. Abre duas janelas (backend e tela). A tela fica em http://localhost:5173 e o Swagger em http://127.0.0.1:8000/docs.

- Para voltar ao início a qualquer momento: na janela do backend, aperte Ctrl+C, rode de novo `uv run uvicorn presentation.api:app --reload --port 8000` e dê F5 na tela. O plano volta à versão 1 (com `DATA_BACKEND=json`, o padrão). Não rode o `dev.ps1` de novo: ele abriria uma segunda tela.
- O copiloto com LLM pode falhar nesta máquina por causa do Kaspersky (certificado) ou do limite do modelo gratuito. Se falhar, use o passo 5 pelo botão "Atrasou": o resultado é o mesmo.

## A história em uma frase

Hoje cada área pede carros para si, com gordura escondida. O protótipo pede os testes em vez dos carros, monta um plano só para as 5 áreas e mostra, a cada imprevisto, quem é afetado e se o lançamento se move. Quem decide é sempre a coordenação.

## Parte 1 · Os 5 passos da tela

A tela abre no passo 1 e se monta aos poucos. O botão amarelo avança; "Pular" mostra tudo.

### Passo 1 · Como é hoje

- **Fazer:** só ler a tabela.
- **Deve aparecer:** 5 linhas, uma por área, e a soma.

| Área | Carros pedidos | Semanas |
|---|---|---|
| Elétrica/Eletrônica | 39 | 13 |
| Mecânica/Powertrain | 52 | 14 |
| Aerodinâmica | 37 | 14 |
| Hidráulica | 35 | 14 |
| Segurança passiva | 82 | 10 |
| **Soma** | **245** | |

- **Dizer:** "Esta é a planilha de hoje: N carros por S semanas, sem dizer que testes vão rodar. A coordenação corta no olho. Os 245 são do mock, calibrados para ficar perto dos 250 que a Maira citou."
- **De onde vêm os 245:** o mock tem 125 testes por área. Para cada área, o motor planejou os testes dela sozinha, na janela que ela quer (10 a 14 semanas), e somou uma gordura de 10 a 20%. Ex.: a Segurança passiva precisa de 72 carros em 10 semanas, mais 13,6% de gordura = 82. Detalhe em `PREMISSAS.md` (MK-01, MK-03, MK-05).

### Passo 2 · O plano compartilhado

- **Fazer:** avançar. Passar o mouse numa barra do Gantt.
- **Deve aparecer:** o Gantt com 168 linhas (161 carros com teste e 7 de reserva, vazios, no fim), 20 colunas. Cada barra é um teste, a cor é a área, ✕ é teste destrutivo e a hachura depois dele é o carro destruído.
- **Dizer:** "O sistema troca a pergunta. Em vez de 'quantos carros?', cada área informa os testes. Com os 625 testes num calendário só, o motor monta o plano com 4 regras."
- **As 4 regras** (ADR 0002):
  1. Os testes mais longos entram primeiro; os destrutivos, por último.
  2. Cada teste vai para o carro já em uso que fica livre mais cedo.
  3. Só abre um carro novo se nenhum serve.
  4. O teste destrutivo é sempre o último do carro.
- **Por que 161:** é o que sobra quando um carro que a Aerodinâmica libera na semana 12 passa a servir a Elétrica na 13. Veja o P006: AER-98 (semanas 1 a 6), AER-99 (7 a 12), ELE-01 (13 a 18), AER-125 (19 e 20).

### Passo 3 · A conta da frota

- **Fazer:** avançar. Mexer o controle da folga de reteste e voltar para 10%.
- **Deve aparecer:** 245 à esquerda, 168 no meio, "77 carros a menos (−31,4%)" à direita. Embaixo, o gráfico de carros em uso e parados.
- **A conta:** 161 carros no plano + 7 de reserva = 168. A reserva é a **folga de reteste**: 10% dos 65 testes destrutivos, arredondado para cima = 7 carros. Só o teste destrutivo que falha precisa de carro novo; o não destrutivo repete no mesmo carro.
- **O controle:** em 25% a reserva vira 17 carros e o total vira 178. Em 0%, 161. O plano não muda, só a reserva.
- **Dizer:** "A gordura que estava escondida em cada pedido virou uma folga única, com tamanho à vista, que a coordenação escolhe."
- **Se perguntarem se a comparação é justa:** a gordura do pedido cobre reprovação e paralelismo. O plano compartilhado já resolve o paralelismo; sobra a reprovação. Pior caso, com a mesma gordura dos pedidos (15,2%, média ponderada pelos carros) nos dois lados: 161 × 1,152 ≈ 186, ainda 24% abaixo de 245.
- **O gráfico:** somando as 20 semanas, os carros ficam parados 1.716 carros-semana nos pedidos por área, contra 140 no plano.

### Passo 4 · O que segura o lançamento

- **Fazer:** avançar. Ler o bloco do marco e a tabela.
- **Deve aparecer:** sinal vermelho, folga do projeto 0 semanas, "553 de 625 testes estão no caminho crítico".

| Meta de fim | Carros no plano | Folga do projeto |
|---|---|---|
| semana 20 | 161 | 0 |
| semana 19 | 166 (+5) | 1 |
| semana 18 | 172 (+11) | 2 |
| semana 17 | 178 (+17) | 3 |

- **Dizer:** "O preço da frota menor é o prazo. O motor enche cada carro até a semana 20, então quase todo teste é crítico: se atrasa e não há troca de carro, o lançamento atrasa. A tabela mostra quanto custa comprar prazo. Essa escolha é da coordenação; o sistema só mostra o preço."
- **Vocabulário:** *caminho crítico* = os testes sem nenhuma semana de sobra. *Folga do projeto* = semana do lançamento (20) menos a semana em que o plano acaba. *Marco* = a data do lançamento.
- **Minha recomendação, se perguntarem:** meta na semana 18. Custa 11 carros e dá 2 semanas de folga; a frota fica em 172 + 7 = 179, ainda 27% abaixo de 245.

### Passo 5 · O imprevisto

Os resultados abaixo valem partindo da versão 1. Depois de aceitar uma proposta, os carros livres mudam e a troca sugerida pode ser outra. Para repetir um item, reinicie o backend.

**5a. Atraso com troca de carro**
- **Fazer:** no campo "ID do teste", digitar `AER-99` e clicar em "Abrir teste". Pôr 2 no campo de semanas e clicar em "Atrasou".
- **Deve aparecer:** a caixa amarela "Proposta de replanejamento": "Mover ELE-01 do P006 para o P162, semanas 13 a 18 — usa um carro da folga de reteste". O texto diz que o AER-99 estava no caminho crítico e que o fim do plano continua na semana 20.
- **Dizer:** "O AER-99 é o teste de vedação na chuva. Atrasou 2 semanas e invadiu as semanas do teste seguinte no mesmo carro. O sistema não empurra o teste seguinte: procura outro carro livre nas mesmas semanas. Achou um na folga de reteste, então o lançamento não se move."
- **Fazer:** clicar em "Recusar". O plano fica na versão 1.

**5b. O perfil**
- **Fazer:** repetir o atraso. No topo, trocar "Você está como" para "Engenharia".
- **Deve aparecer:** os botões Aceitar e Recusar ficam desabilitados, com o aviso de que só o gerente decide.
- **Dizer:** "O protótipo não tem login. O seletor simula os dois perfis: a engenharia registra, o gerente da coordenação decide. Login de verdade, com permissão por área no banco, é o primeiro item do piloto."
- **Fazer:** voltar para "Gerente" e clicar em "Recusar".

**5c. O copiloto**
- **Fazer:** na caixa do copiloto, escrever `o AER-99 atrasou duas semanas por causa da chuva` e clicar em "Interpretar".
- **Deve aparecer:** a mesma proposta do 5a e uma explicação em texto.
- **Dizer:** "O LLM só traduz a frase em um evento e explica o resultado. Quem calcula é o motor, e por isso o número é o mesmo do botão. Sem LLM o sistema continua funcionando."
- **Fazer:** clicar em "Aceitar e criar a versão 2". No seletor "Versão do plano", abrir a v1: ela continua lá, só para consulta.

**5d. Falha de teste destrutivo**
- **Fazer:** abrir `SEG-104` (capotamento, no P097, semanas 8 a 13) e clicar em "Falhou, vai repetir".
- **Deve aparecer:** "Repetir SEG-104 no P162, semanas 14 a 19 (o P097 não pode recebê-lo)". Se o P162 já foi usado no 5c, aparece outro carro da reserva.
- **Dizer:** "O carro foi destruído no teste. A repetição precisa de outro carro: é para isso que serve a folga de reteste." Recusar.

**5e. Avaria**
- **Fazer:** abrir qualquer teste do P006. Em "Avaria", escolher pneu, leve, e registrar (o painel do teste fecha). Abrir o teste de novo, escolher vidro, "compromete reuso", semana 5, e registrar. No fim, clicar em "Recusar".
- **Deve aparecer:** a leve entra na lista "Avarias registradas nesta versão" e vira um ⚠ na linha do carro, sem proposta. A que compromete reuso gera proposta que tira do P006 os testes que começam depois da semana 5.
- **Dizer:** "A engenharia classifica a gravidade. Leve só fica registrada. A que compromete reuso tira o carro da frota e o sistema realoca o que estava prometido a ele."
- **Limite a dizer:** a lista mostra as avarias da versão aberta. Não há tela de histórico por carro entre lançamentos; isso depende do banco (v2).

**5f. Passar do marco**
- **Fazer:** abrir `AER-11` (P001, semanas 19 e 20), pôr 2 semanas e clicar em "Atrasou".
- **Deve aparecer:** a proposta diz que o fim vai da semana 20 para a 22. O botão Aceitar fica bloqueado até marcar a caixa "aceitar mesmo assim". Marcando e aceitando, o Gantt ganha as semanas 21 e 22 com cabeçalho vermelho.
- **Dizer:** "Por padrão o sistema não deixa passar do lançamento. O gerente pode liberar, de propósito e à vista."

## Parte 2 · Perguntas que a banca pode fazer

**Como o plano é criado?** A tela não calcula nada. Ao abrir, ela pede o plano à API. Na primeira vez, o backend lê os 625 testes e os 250 carros do mock e roda o motor (`planejar`), que devolve a versão 1. O pedido atravessa 4 camadas: rota → caso de uso → motor → dados (ADR 0001).

**Por que Clean Architecture num protótipo?** Porque três peças vão trocar: o banco, a fonte de contexto (Strattum) e o LLM. A prova de que funciona: o Supabase entrou com um arquivo novo e um desvio no `container.py`, sem tocar no motor nem nos testes de regra. Há um teste que falha se o domínio importar qualquer coisa de fora.

**Tem injeção de dependência?** Tem, pelo construtor. O que não tem é biblioteca de DI: com 3 ports, o `container.py` monta tudo à mão em 60 linhas.

**Por que não um solver?** A Maira disse que importa mais o processo do que o número. A heurística se explica em 4 frases e dá sempre o mesmo resultado. O solver entra na v2 atrás da mesma função `planejar`, com a heurística como piso de comparação.

**Quão longe do ótimo?** Não sei, e digo isso. O piso teórico é 107 carros (2.139 semanas de teste ÷ 20). O plano dá 161. O ótimo está entre os dois; só o solver diz onde.

**Por que o LLM não monta o plano?** Um LLM que calcula erra sem avisar e dá um resultado diferente a cada vez. Aqui ele traduz e explica; o motor calcula; a coordenação decide. Trocar de modelo muda a qualidade da tradução, nunca o número.

**Onde a Strattum entra?** Atrás da port `ContextProvider`. Hoje o glossário e as regras vêm de um arquivo local; na arquitetura-alvo vêm da plataforma de contexto. Não simulei a API da Strattum para não inventar fato (ADR 0004).

**O que é mock?** Tudo que tem o selo amarelo "mock MK-xx". A lista está em `PREMISSAS.md`. Da cliente vieram: 250 carros, 20 semanas, 5 áreas, custo de R$ 1 milhão ou mais por carro, carros idênticos.

**E segurança?** Sem login: quem tem a URL chama qualquer rota. As chaves ficam só no `backend/.env`, fora do git e fora da imagem do contêiner. No Supabase, a segurança por linha está ligada sem nenhuma política: a chave pública não lê nem grava nada.

**O que eu faria diferente com mais uma semana?** Login com permissão por área, o piso ao lado do plano, e o levantamento das dependências entre testes com as áreas, que é o que falta para mostrar o gargalo real (ADR 0007).

## Parte 3 · O que não mostrar, ou mostrar com cuidado

- **88% de testes críticos.** Não é defeito, é o achado. Apresentar junto com a tabela de metas.
- **Copiloto com modelo gratuito.** Pode demorar ou falhar. Ter o botão "Atrasou" como plano B.
- **Marcação do caminho crítico no Gantt.** É discreta (faixa amarela no topo da barra) porque quase tudo é crítico. Não gastar tempo nela.
