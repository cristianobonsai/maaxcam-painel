import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mdParaHtml } from '../../src/manual/markdown.js'
import { varrerTexto } from '../robo/seguranca.mjs'
import roteiro from '../capitulos/primeiros-passos/roteiro.mjs'
import { nomeArquivo } from '../robo/run.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const TEXTO = join(AQUI, '..', 'capitulos', 'primeiros-passos', 'texto.md')
const PUBLICADO = join(AQUI, '..', '..', 'src', 'manual', 'primeiros-passos.md')

test('mdParaHtml escapa HTML do texto', () => {
  const html = mdParaHtml('<script>alert(1)</script> e <img src=x onerror=alert(1)>')
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<img src=x'))
})

test('mdParaHtml: titulos, paragrafos, listas e enfase', () => {
  assert.match(mdParaHtml('# Título'), /<h1>Título<\/h1>/)
  assert.match(mdParaHtml('## Sub'), /<h2>Sub<\/h2>/)
  const ul = mdParaHtml('- um\n- dois')
  assert.match(ul, /<ul>\s*<li>um<\/li>\s*<li>dois<\/li>\s*<\/ul>/)
  const ol = mdParaHtml('1. a\n2. b')
  assert.match(ol, /<ol>/)
  assert.equal((ol.match(/<li>/g) || []).length, 2)
  assert.match(mdParaHtml('um **negrito** e *itálico* e `código`'), /<strong>negrito<\/strong> e <em>itálico<\/em> e <code>código<\/code>/)
  assert.match(mdParaHtml('linha 1\nlinha 2'), /<p>linha 1 linha 2<\/p>/)
})

test('mdParaHtml: imagem img:<id> vira src do manual; id invalido nao vira imagem', () => {
  const html = mdParaHtml('![Formulário](img:primeiros-passos-05-formulario)')
  assert.match(html, /src="\/manual\/img\/primeiros-passos-05-formulario\.png"/)
  assert.match(html, /alt="Formulário"/)
  assert.match(html, /onerror=/)
  assert.ok(!mdParaHtml('![x](img:../../etc/passwd)').includes('<img'))
})

test('mdParaHtml: so links http(s) ou internos viram <a>', () => {
  assert.match(mdParaHtml('[site](https://livebybit.com)'), /<a href="https:\/\/livebybit\.com" target="_blank" rel="noopener noreferrer">site<\/a>/)
  assert.match(mdParaHtml('[painel](/painel/cameras)'), /<a href="\/painel\/cameras"/)
  assert.ok(!mdParaHtml('[x](javascript:alert(1))').includes('<a '))
  assert.ok(!mdParaHtml('[x](//evil.com/p)').includes('<a '))                         // protocolo relativo nao vira link
})

test('texto.md: sem dado real nem palavra proibida e referencia exatamente os 8 prints do roteiro', () => {
  const texto = readFileSync(TEXTO, 'utf8')
  assert.deepEqual(varrerTexto(texto), [])
  const usados = [...texto.matchAll(/img:([a-z0-9-]+)/g)].map((m) => m[1]).sort()
  const esperados = roteiro.passos.map((p, i) => nomeArquivo(roteiro.id, i + 1, p.id).replace(/\.png$/, '')).sort()
  assert.deepEqual(usados, esperados)
})

test('texto publicado em src/manual e igual ao do capitulo (rode publicar depois de editar)', () => {
  assert.equal(readFileSync(PUBLICADO, 'utf8'), readFileSync(TEXTO, 'utf8'))
})
