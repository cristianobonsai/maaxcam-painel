// Gerador do PDF do manual: as partes que nao precisam de navegador (HTML, sumario, contagem de paginas).
import test from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dataPorExtenso, contarPaginas, calcularInicios, montarHtml, lerCapitulos } from '../robo/pdf.mjs'

const SRC_MANUAL = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'manual')

const CAPS = [
  { id: 'um', titulo: 'Primeiro <b>capítulo</b>', md: '# Primeiro <b>capítulo</b>\n\nTexto com **negrito**.\n\n## 1. Passo\n\n![Tela do passo](img:um-01-passo)\n\n1. Clique.\n' },
  { id: 'dois', titulo: 'Segundo', md: '# Segundo\n\nOutro texto.\n\n![Outra tela](img:dois-01-x)\n' },
]
const base = { capitulos: CAPS, versao: '3.0', data: 'outubro de 2026', inicios: [3, 5], baseImg: 'file:///x/img/' }

test('dataPorExtenso escreve mes e ano em portugues', () => {
  assert.equal(dataPorExtenso(new Date(2026, 9, 13)), 'outubro de 2026')
  assert.equal(dataPorExtenso(new Date(2027, 0, 2)), 'janeiro de 2027')
  assert.equal(dataPorExtenso(new Date(2026, 2, 31)), 'março de 2026')
})

test('contarPaginas conta /Type /Page e nao confunde com /Type /Pages', () => {
  const pdf = '%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 3 >>\nendobj\n'
    + '2 0 obj\n<< /Type /Page /Parent 1 0 R >>\nendobj\n3 0 obj\n<</Type/Page/Parent 1 0 R>>\nendobj\n4 0 obj\n<< /Type /Page\n/Parent 1 0 R >>\nendobj\n'
  assert.equal(contarPaginas(pdf), 3)
  assert.equal(contarPaginas(Buffer.from(pdf, 'latin1')), 3)
  assert.equal(contarPaginas('%PDF-1.4 sem paginas'), 0)
})

test('calcularInicios soma as paginas de cada capitulo a partir da primeira pagina de capitulo', () => {
  assert.deepEqual(calcularInicios([2, 3, 1], 3), [3, 5, 8])
  assert.deepEqual(calcularInicios([], 3), [])
  assert.throws(() => calcularInicios([2, 0, 1], 3), /pelo menos 1 pagina/)
})

test('montarHtml: capa, sumario com a pagina de cada capitulo e os capitulos na ordem', () => {
  const html = montarHtml(base)
  assert.match(html, /^<!doctype html>/i)
  assert.match(html, /@page/)
  assert.ok(html.indexOf('class="capa"') < html.indexOf('class="sumario"'))
  assert.ok(html.indexOf('class="sumario"') < html.indexOf('id="cap-um"'))
  assert.ok(html.indexOf('id="cap-um"') < html.indexOf('id="cap-dois"'))
  assert.match(html, /Manual do Usuário/)
  assert.match(html, /Versão 3\.0/)
  assert.match(html, /outubro de 2026/)
  assert.match(html, /<a href="#cap-um"[^>]*>[\s\S]*?Primeiro[\s\S]*?<span class="pag">3<\/span>/)
  assert.match(html, /<a href="#cap-dois"[^>]*>[\s\S]*?Segundo[\s\S]*?<span class="pag">5<\/span>/)
  assert.match(html, /Capítulo 1/)
  assert.match(html, /Capítulo 2/)
})

test('montarHtml: o HTML do texto e escapado (titulo e conteudo)', () => {
  const html = montarHtml(base)
  assert.ok(!html.includes('<b>capítulo</b>'), 'nenhuma tag crua vinda do texto')
  assert.match(html, /Primeiro &lt;b&gt;capítulo&lt;\/b&gt;/)
})

test('montarHtml: print vira figura com legenda, caminho absoluto, sem carregamento preguicoso', () => {
  const html = montarHtml(base)
  assert.match(html, /<figure>\s*<img src="file:\/\/\/x\/img\/um-01-passo\.png" alt="Tela do passo"[^>]*>\s*<figcaption>Tela do passo<\/figcaption>\s*<\/figure>/)
  assert.ok(!html.includes('loading="lazy"'))
  assert.ok(!html.includes('onerror'))
  assert.ok(!html.includes('<p><figure>'), 'figura nao fica dentro de paragrafo')
})

test('montarHtml: o titulo do texto (h1) nao se repete — o titulo do capitulo vem do cabecalho', () => {
  const html = montarHtml(base)
  assert.equal((html.match(/<h1[ >]/g) || []).length, 3, 'um h1 na capa e um por capitulo (o do texto foi retirado)')
  assert.equal((html.match(/<h1>Segundo<\/h1>/g) || []).length, 1)
})

test('montarHtml com corpoApenas (medicao de paginas) nao traz capa nem sumario', () => {
  const html = montarHtml({ ...base, corpoApenas: true })
  assert.ok(!html.includes('class="capa"') && !html.includes('class="sumario"'))
  assert.ok(html.includes('id="cap-um"'))
})

test('montarHtml recusa quantidade de inicios diferente da de capitulos', () => {
  assert.throws(() => montarHtml({ ...base, inicios: [3] }), /inicios/)
})

test('lerCapitulos le os 17 capitulos publicados, na ordem do capitulos.json, com a Carbigdata por ultimo', () => {
  const caps = lerCapitulos(SRC_MANUAL)
  assert.equal(caps.length, 17)
  assert.equal(caps[0].id, 'primeiros-passos')
  assert.equal(caps.at(-1).id, 'compartilhar-carbigdata')
  for (const c of caps) {
    assert.ok(c.md.startsWith(`# ${c.titulo}`), `${c.id}: o texto comeca com o titulo`)
    assert.ok(c.md.includes('](img:'), `${c.id}: tem ao menos um print`)
  }
  assert.ok(join(SRC_MANUAL, 'capitulos.json'))
})

test('capa traz os dois contatos oficiais (suporte e contato) e o endereco do painel', () => {
  const capa = montarHtml(base).split('class="sumario"')[0]
  assert.match(capa, /suporte@livebybit\.com/)
  assert.match(capa, /contato@livebybit\.com/)
  assert.match(capa, /painel\.livebybit\.com/)
})

test('prints do PDF tem altura maxima, para caber mais de um por pagina', () => {
  assert.match(montarHtml(base), /figure img \{[^}]*max-height: \d+mm/)
})
