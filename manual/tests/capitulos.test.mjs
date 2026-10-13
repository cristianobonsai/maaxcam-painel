// capitulos.test.mjs - regras que valem para TODO capitulo listado em src/manual/capitulos.json
// (roteiro, texto, prints e a versao publicada precisam andar juntos; senao o manual fica com buraco).
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { varrerTexto } from '../robo/seguranca.mjs'
import { nomeArquivo } from '../robo/run.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const MANUAL = join(AQUI, '..')
const PAINEL = join(MANUAL, '..')
const LISTA = JSON.parse(readFileSync(join(PAINEL, 'src', 'manual', 'capitulos.json'), 'utf8'))

// So estes capitulos podem citar a Carbigdata pelo nome (decisao do Cristiano, 12-13/10/2026).
const PODEM_CITAR = ['compartilhar-carbigdata', 'gerenciar-integracao']
const ULTIMO = 'compartilhar-carbigdata'

async function carregar(id) {
  return (await import(pathToFileURL(join(MANUAL, 'capitulos', id, 'roteiro.mjs')).href)).default
}

test('capitulos.json: ids simples, sem repeticao, com titulo; o da Carbigdata e sempre o ultimo', () => {
  assert.ok(LISTA.length >= 2)
  const ids = LISTA.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const c of LISTA) {
    assert.match(c.id, /^[a-z0-9-]+$/, c.id)
    assert.ok(c.titulo && c.titulo.length >= 3, c.id)
  }
  assert.equal(ids[ids.length - 1], ULTIMO)
})

for (const { id, titulo } of LISTA) {
  test(`capitulo ${id}: roteiro valido, texto casa com os prints, versao publicada e prints presentes`, async () => {
    const roteiro = await carregar(id)
    assert.equal(roteiro.id, id)
    assert.ok(roteiro.passos.length >= 1)
    const passoIds = roteiro.passos.map((p) => p.id)
    assert.equal(new Set(passoIds).size, passoIds.length, 'ids de passo repetidos')
    for (const p of roteiro.passos) {
      assert.match(p.id, /^[a-z0-9-]+$/, p.id)
      assert.ok(['sem-sessao', 'logado'].includes(p.contexto), `${p.id}: contexto`)
      assert.ok(p.titulo && p.legenda, `${p.id}: titulo e legenda`)
      assert.ok(Array.isArray(p.destacar) && p.destacar.length >= 1, `${p.id}: destacar`)
    }

    const texto = readFileSync(join(MANUAL, 'capitulos', id, 'texto.md'), 'utf8')
    assert.match(texto, new RegExp(`^# ${titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'), 'o titulo do texto = titulo do capitulos.json')
    const permitir = PODEM_CITAR.includes(id) ? ['carbigdata'] : []
    assert.deepEqual(varrerTexto(texto, { permitir }), [], 'palavra proibida ou dado real no texto')

    const usados = [...texto.matchAll(/img:([a-z0-9-]+)/g)].map((m) => m[1])
    assert.equal(new Set(usados).size, usados.length, 'print citado duas vezes')
    const esperados = roteiro.passos.map((p, i) => nomeArquivo(id, i + 1, p.id).replace(/\.png$/, ''))
    assert.deepEqual([...usados].sort(), [...esperados].sort(), 'o texto precisa citar exatamente os prints do roteiro')

    assert.equal(readFileSync(join(PAINEL, 'src', 'manual', `${id}.md`), 'utf8'), texto, 'rode "npm run publicar" depois de editar o texto')
    for (const e of esperados) assert.ok(existsSync(join(PAINEL, 'public', 'manual', 'img', `${e}.png`)), `falta o print publicado ${e}.png`)

    const fonte = readFileSync(join(MANUAL, 'capitulos', id, 'roteiro.mjs'), 'utf8')
    assert.deepEqual(varrerTexto(fonte.replaceAll(id, 'capitulo')), [], 'roteiro nao pode ter dado real nem palavra proibida')
  })
}
