# Robô do Manual do Usuário

Tira os prints do manual **sozinho**, num painel de demonstração com **dados 100 % fictícios** ("Padaria Exemplo"). Nenhum print mostra dado de cliente.

## Como funciona (resumo)
1. Compila o painel com `VITE_API_URL=https://api-demo.invalid` e serve em `127.0.0.1`.
2. Abre um Chromium (Playwright) com **toda requisição interceptada**: a API é respondida por `dados/rotas.mjs`; só fontes/mapa estáticos passam; o resto é abortado. O robô só roda em `localhost`.
3. Percorre os passos de `capitulos/<capitulo>/roteiro.mjs`, desenha **caixas vermelhas numeradas** e salva `saida/<capitulo>/<capitulo>-NN-<id>.png` (1440×900).
4. Escreve `saida/relatorio.md`: passos OK, **ajustes automáticos** (botão renomeado com um único candidato parecido) e **quebras** (elemento não encontrado, mais de um parecido, ou rota de API sem dado fictício). Quebra ⇒ o robô para o capítulo, guarda o print da tela em `saida/falhas/` e sai com erro.
5. O robô **nunca** edita o texto (`texto.md`) nem o roteiro: quem corrige é uma pessoa, olhando o relatório.

## Rodar (no Serv QA — onde o Playwright está instalado)
```bash
cd /opt/painel && git pull
cd manual && npm run manual -- --cap primeiros-passos   # compila o painel, roda e escreve saida/
```
Trazer os prints para o PC e publicar no painel (no PC, na pasta `manual`):
```bash
npm test                                      # testes (node --test, sem instalar nada)
npm run publicar -- --cap primeiros-passos    # copia saida/ -> public/manual/img e o texto -> src/manual/
```
Depois: commit (nominal), push do PC e deploy normal do painel (`git pull && npm run build` no SERV2).

## Instalar o robô num servidor novo (só QA)
`cd manual && npm install && npx playwright install --with-deps chromium` (≈170 MB de `cdn.playwright.dev` + pacotes `apt`; precisa de autorização do Cristiano).

## Acrescentar um capítulo
1. Criar `capitulos/<id>/roteiro.mjs` (`{id, titulo, passos:[{id, titulo, legenda, contexto:'sem-sessao'|'logado', ir?, acao?, destacar:[alvo,…]}]}`). Alvo: `{papel, nome}` (botão/campo), `{por:'texto'|'css', nome}`; opções: `primeiro`, `alternativas`, `numero:'esquerda'|'direita'|'acima'|'abaixo'`.
2. Se o capítulo usar telas/chamadas novas, acrescentar as respostas fictícias em `dados/rotas.mjs` (rota sem dado **quebra** o robô e diz qual faltou).
3. Escrever `capitulos/<id>/texto.md` com `![passo](img:<id>-NN-<passo>)` e registrar o capítulo em `src/manual/capitulos.json`.
4. Rodar o robô, olhar os prints, `npm run publicar -- --cap <id>`.

## Regras de segurança (testadas em `tests/`)
- Só `localhost`; requisições externas abortadas; sessão de login falsa; nada de credencial real.
- Varredura automática nos dados e nos textos: sem e-mail fora de `@exemplo.com`, sem IP (exceto `203.0.113.x`), sem chave do Supabase, sem as palavras `placa`, `lpr`, `carbigdata`.

## Gerar o PDF do manual (no Serv QA)
```bash
cd /opt/painel && git pull && cd manual && npm run pdf -- --versao 3.0
```
Lê `src/manual/capitulos.json`, os textos `src/manual/<cap>.md` e os prints `public/manual/img/` (a **mesma fonte da página do painel**) e imprime um HTML A4 pelo Chromium do Playwright: capa, sumário com a página de cada capítulo, cada capítulo começando em página nova, legenda em cada print e rodapé "Página X de Y". Saída: `manual/saida/pdf/LiveByBit-Manual-Usuario-v3.pdf`. O gerador mede quantas páginas cada capítulo ocupa para escrever o sumário e **falha** se o total não bater (capa ou sumário passando de 1 página). Para olhar as páginas: `pdftoppm -r 60 -png arquivo.pdf pg/p` (pacote `poppler-utils`, instalado no QA).
Depois de aprovado: copiar o PDF para `public/LiveByBit-Manual-Usuario-v3.pdf`, trocar o link do rodapé em `src/pages/ManualUsuario.jsx` e retirar os PDFs antigos.
