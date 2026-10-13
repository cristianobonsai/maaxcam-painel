import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { publicar } from '../robo/publicar.mjs'

const IDS = ['01-entrar', '02-link', '03-painel']

function montar({ status = { quebra: false, passos: 3 }, texto = '# Texto\n\n![a](img:primeiros-passos-01-entrar)\n![b](img:primeiros-passos-03-painel)\n' } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'manual-pub-'))
  const saida = join(raiz, 'saida'); const destinoImg = join(raiz, 'img'); const destinoSrc = join(raiz, 'src')
  mkdirSync(join(saida, 'primeiros-passos'), { recursive: true })
  mkdirSync(destinoImg, { recursive: true }); mkdirSync(destinoSrc, { recursive: true })
  for (const n of IDS) writeFileSync(join(saida, 'primeiros-passos', `primeiros-passos-${n}.png`), 'png')
  if (status) writeFileSync(join(saida, 'primeiros-passos', 'status.json'), JSON.stringify(status))
  writeFileSync(join(destinoImg, 'primeiros-passos-99-velho.png'), 'velho')
  writeFileSync(join(destinoImg, 'outro-capitulo-01-x.png'), 'outro')
  writeFileSync(join(destinoImg, 'primeiros-passos-2-01-x.png'), 'capitulo-de-nome-parecido')
  const arquivoTexto = join(raiz, 'texto.md'); writeFileSync(arquivoTexto, texto)
  return { raiz, saida, destinoImg, destinoSrc, texto: arquivoTexto }
}
const chamar = (p) => publicar({ saida: p.saida, capitulo: 'primeiros-passos', texto: p.texto, destinoImg: p.destinoImg, destinoSrc: p.destinoSrc })

test('publicar copia os prints, remove os orfaos so do mesmo capitulo (nem os de nome parecido)', () => {
  const p = montar()
  try {
    const r = chamar(p)
    assert.equal(r.copiados.length, 3)
    assert.deepEqual(r.removidos, ['primeiros-passos-99-velho.png'])
    assert.deepEqual(readdirSync(p.destinoImg).sort(), [
      'outro-capitulo-01-x.png', 'primeiros-passos-01-entrar.png', 'primeiros-passos-02-link.png',
      'primeiros-passos-03-painel.png', 'primeiros-passos-2-01-x.png'])
    assert.match(readFileSync(join(p.destinoSrc, 'primeiros-passos.md'), 'utf8'), /^# Texto/)
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})

test('publicar RECUSA rodada que quebrou e nao apaga nada do painel', () => {
  const p = montar({ status: { quebra: true, passos: 3 } })
  try {
    assert.throws(() => chamar(p), /quebrou/)
    assert.ok(existsSync(join(p.destinoImg, 'primeiros-passos-99-velho.png')))
    assert.ok(!existsSync(join(p.destinoSrc, 'primeiros-passos.md')))
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})

test('publicar RECUSA saida sem status.json (rodada incompleta ou antiga)', () => {
  const p = montar({ status: null })
  try {
    assert.throws(() => chamar(p), /status/)
    assert.ok(existsSync(join(p.destinoImg, 'primeiros-passos-99-velho.png')))
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})

test('publicar RECUSA texto que cita imagem que o robo nao gerou (e diz qual)', () => {
  const p = montar({ texto: '![x](img:primeiros-passos-09-fantasma)\n![y](img:primeiros-passos-01-entrar)\n' })
  try {
    assert.throws(() => chamar(p), /primeiros-passos-09-fantasma/)
    assert.ok(!existsSync(join(p.destinoSrc, 'primeiros-passos.md')))
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})

test('publicar sem prints na saida falha e nao apaga nada', () => {
  const p = montar()
  try {
    rmSync(join(p.saida, 'primeiros-passos'), { recursive: true })
    mkdirSync(join(p.saida, 'primeiros-passos'))
    assert.throws(() => chamar(p), /nenhum print/)
    assert.ok(existsSync(join(p.destinoImg, 'primeiros-passos-99-velho.png')))
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})
