// pdf.mjs - gera o PDF do Manual do Usuario a partir dos MESMOS textos e prints da pagina do painel
// (src/manual/*.md + public/manual/img/*.png). Usa o Chromium do Playwright (so no Serv QA) para imprimir um HTML A4:
// capa, sumario com a pagina de cada capitulo e rodape com "Pagina X de Y". As funcoes puras (HTML, datas, contagem)
// ficam testadas em tests/pdf.test.mjs; so gerarPdf() precisa do navegador.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { mdParaHtml } from '../../src/manual/markdown.js'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const dataPorExtenso = (d) => `${MESES[d.getMonth()]} de ${d.getFullYear()}`

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Conta as paginas de um PDF do Chromium (cada pagina e um objeto "/Type /Page"; "/Type /Pages" e a arvore, nao conta). */
export function contarPaginas(pdf) {
  const texto = Buffer.isBuffer(pdf) ? pdf.toString('latin1') : String(pdf)
  return (texto.match(/\/Type\s*\/Page(?![A-Za-z])/g) || []).length
}

/** Pagina em que cada capitulo comeca, dado quantas paginas cada um ocupa e a pagina do primeiro. */
export function calcularInicios(contagens, primeira) {
  let atual = primeira
  return contagens.map((n) => {
    if (!(n >= 1)) throw new Error('cada capitulo ocupa pelo menos 1 pagina')
    const inicio = atual
    atual += n
    return inicio
  })
}

/** Le capitulos.json e o texto publicado de cada capitulo (a mesma fonte da pagina do painel). */
export function lerCapitulos(srcManual) {
  const lista = JSON.parse(readFileSync(join(srcManual, 'capitulos.json'), 'utf8'))
  return lista.map(({ id, titulo }) => ({ id, titulo, md: readFileSync(join(srcManual, `${id}.md`), 'utf8').replace(/\r\n/g, '\n') }))
}

const LOGO = '<svg viewBox="0 0 48 48" width="64" height="64" aria-hidden="true"><rect width="48" height="48" rx="11" fill="#2f7bff"/><path d="M19 14.5v19l16-9.5z" fill="#fff"/></svg>'

const CSS = `
@page { size: A4; margin: 17mm 16mm 20mm 16mm;
  @bottom-left { content: "LiveByBit · Manual do Usuário"; font: 8.5pt Helvetica, Arial, sans-serif; color: #64748b; }
  @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8.5pt Helvetica, Arial, sans-serif; color: #64748b; } }
@page :first { margin: 0; @bottom-left { content: none; } @bottom-right { content: none; } }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html { font: 10pt/1.5 Helvetica, Arial, "Liberation Sans", "DejaVu Sans", sans-serif; color: #1e293b; }
body { margin: 0; }
.capa { width: 210mm; height: 296.6mm; padding: 38mm 24mm 24mm; color: #fff; display: flex; flex-direction: column;
  background: linear-gradient(160deg, #0b1220 0%, #12264f 55%, #1d4ed8 130%); break-after: page; }
.capa .marca { display: flex; align-items: center; gap: 12pt; font-size: 22pt; font-weight: 700; letter-spacing: .3pt; }
.capa h1 { margin: 64mm 0 0; font-size: 40pt; line-height: 1.1; font-weight: 700; }
.capa .sub { margin-top: 14pt; max-width: 120mm; font-size: 14pt; color: #cbd5e1; line-height: 1.4; }
.capa .versao { margin-top: 26pt; font-size: 12pt; color: #93c5fd; font-weight: 700; letter-spacing: .5pt; }
.capa .rodape { margin-top: auto; font-size: 10pt; color: #94a3b8; line-height: 1.6; }
.pagina-zero { width: 210mm; height: 296.6mm; break-after: page; }
.sumario { break-after: page; }
.sumario h2 { margin: 0 0 14pt; font-size: 22pt; color: #0f172a; }
.toc { list-style: none; margin: 0; padding: 0; }
.toc li { margin: 0; }
.toc a { display: flex; align-items: baseline; gap: 8pt; padding: 5.5pt 0; color: #0f172a; text-decoration: none; border-bottom: .5pt solid #e2e8f0; }
.toc .n { width: 18pt; color: #2563eb; font-weight: 700; }
.toc .t { flex: 0 1 auto; }
.toc .pontos { flex: 1; border-bottom: 1pt dotted #94a3b8; transform: translateY(-3pt); }
.toc .pag { min-width: 16pt; text-align: right; color: #475569; font-variant-numeric: tabular-nums; }
.sobre { margin-top: 22pt; padding: 10pt 12pt; border-left: 3pt solid #2563eb; background: #eff6ff; color: #1e3a8a; font-size: 9.5pt; line-height: 1.5; }
.capitulo { break-before: page; }
.capitulo header { margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1.5pt solid #2563eb; }
.capitulo .rotulo { font-size: 9pt; font-weight: 700; letter-spacing: 1.2pt; text-transform: uppercase; color: #2563eb; }
.capitulo h1 { margin: 3pt 0 0; font-size: 24pt; line-height: 1.15; color: #0f172a; }
h2 { margin: 18pt 0 6pt; font-size: 14pt; color: #0f172a; break-after: avoid; }
h3 { margin: 12pt 0 4pt; font-size: 11.5pt; color: #0f172a; break-after: avoid; }
p { margin: 0 0 7pt; orphans: 3; widows: 3; }
ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
li { margin: 0 0 3pt; }
strong { color: #0f172a; }
code { font: 9pt "DejaVu Sans Mono", Menlo, Consolas, monospace; background: #f1f5f9; padding: 0 3pt; border-radius: 2pt; }
a { color: #2563eb; text-decoration: none; }
figure { margin: 10pt 0 12pt; break-inside: avoid; text-align: center; }
figure img { display: block; width: auto; max-width: 100%; height: auto; max-height: 80mm; margin: 0 auto; border: .75pt solid #cbd5e1; border-radius: 5pt; }
figcaption { margin-top: 4pt; font-size: 8.5pt; font-style: italic; color: #64748b; }
`

function corpoDoCapitulo(md, baseImg) {
  const semTitulo = md.replace(/^# .*\n+/, '')
  return mdParaHtml(semTitulo, baseImg)
    .replace(/<p><img src="([^"]+)" alt="([^"]*)"[^>]*\/><\/p>/g,
      '<figure><img src="$1" alt="$2"><figcaption>$2</figcaption></figure>')
    .replace(/ loading="lazy"/g, '').replace(/ onerror="[^"]*"/g, '')
}

/**
 * @param capitulos [{id, titulo, md}]  @param inicios pagina inicial de cada capitulo (mesma ordem)
 * @param baseImg prefixo dos prints (ex.: file:///.../public/manual/img/)  @param corpoApenas sem capa e sumario (medicao de paginas)
 */
export function montarHtml({ capitulos, versao, data, inicios, baseImg, corpoApenas = false }) {
  if (inicios.length !== capitulos.length) throw new Error('inicios precisa ter um valor por capitulo')
  const capa = `<section class="capa">
  <div class="marca">${LOGO}<span>LiveByBit</span></div>
  <h1>Manual do Usuário</h1>
  <p class="sub">Guia passo a passo do painel de retransmissão de câmeras: como cadastrar, configurar e acompanhar as suas câmeras.</p>
  <p class="versao">Versão ${esc(versao)} · ${esc(data)}</p>
  <p class="rodape">painel.livebybit.com<br>Suporte: suporte@livebybit.com<br>Contato: contato@livebybit.com</p>
</section>`
  const toc = capitulos.map((c, i) => `<li><a href="#cap-${esc(c.id)}"><span class="n">${i + 1}</span><span class="t">${esc(c.titulo)}</span><span class="pontos"></span><span class="pag">${inicios[i]}</span></a></li>`).join('\n')
  const sumario = `<section class="sumario">
  <h2>Sumário</h2>
  <ol class="toc">
${toc}
  </ol>
  <p class="sobre"><strong>Sobre as imagens.</strong> Os números em vermelho indicam onde olhar ou clicar, na ordem do passo a passo. Os dados que aparecem nas telas (como a loja "Padaria Exemplo", as câmeras e os e-mails) são fictícios, criados só para este manual. Este manual também está no painel, no menu <strong>Manual do Usuário</strong>.</p>
</section>`
  const corpo = capitulos.map((c, i) => `<section class="capitulo" id="cap-${esc(c.id)}">
<header><div class="rotulo">Capítulo ${i + 1}</div><h1>${esc(c.titulo)}</h1></header>
${corpoDoCapitulo(c.md, baseImg)}
</section>`).join('\n')
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Manual do Usuário LiveByBit — versão ${esc(versao)}</title>
<style>${CSS}</style></head>
<body>
${corpoApenas ? '' : `${capa}\n${sumario}\n`}${corpo}
</body></html>`
}

/** Imprime o PDF (precisa do Playwright + Chromium: so no Serv QA). Devolve { arquivo, paginas, inicios }. */
export async function gerarPdf({ capitulos, versao, data, baseImg, pasta, nomePdf }) {
  const { chromium } = await import('playwright')
  mkdirSync(pasta, { recursive: true })
  const browser = await chromium.launch({ args: ['--lang=pt-BR'] })
  try {
    const imprimir = async (html, arquivoHtml) => {
      writeFileSync(arquivoHtml, html)
      const page = await browser.newPage()
      try {
        await page.goto(`file://${arquivoHtml.replace(/\\/g, '/')}`.replace('file:////', 'file:///'))
        await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 })
        return await page.pdf({ preferCSSPageSize: true, printBackground: true })
      } finally { await page.close() }
    }
    // 1o passo: quantas paginas cada capitulo ocupa (cada um comeca numa pagina nova, entao medir sozinho e igual a medir junto)
    const contagens = []
    for (const c of capitulos) {
      const pdf = await imprimir(montarHtml({ capitulos: [c], versao, data, inicios: [1], baseImg, corpoApenas: true }), join(pasta, `medida-${c.id}.html`))
      contagens.push(contarPaginas(pdf) - 1)   // menos a pagina em branco que faz o papel da capa
    }
    // capa (1 pagina) + sumario (1 pagina) vem antes do primeiro capitulo
    const inicios = calcularInicios(contagens, 3)
    const pdf = await imprimir(montarHtml({ capitulos, versao, data, inicios, baseImg }), join(pasta, 'manual.html'))
    const paginas = contarPaginas(pdf)
    const esperado = 2 + contagens.reduce((a, b) => a + b, 0)
    if (paginas !== esperado) throw new Error(`o PDF tem ${paginas} paginas, esperado ${esperado}: a capa ou o sumario passou de 1 pagina, ou algum capitulo mudou de tamanho`)
    const arquivo = join(pasta, nomePdf)
    writeFileSync(arquivo, pdf)
    return { arquivo, paginas, inicios }
  } finally { await browser.close() }
}
