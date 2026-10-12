import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { publicar } from '../robo/publicar.mjs'

function montar() {
  const raiz = mkdtempSync(join(tmpdir(), 'manual-pub-'))
  const saida = join(raiz, 'saida'); const destinoImg = join(raiz, 'img'); const destinoSrc = join(raiz, 'src')
  mkdirSync(join(saida, 'primeiros-passos'), { recursive: true })
  mkdirSync(destinoImg, { recursive: true }); mkdirSync(destinoSrc, { recursive: true })
  for (const n of ['01-entrar', '02-link', '03-painel']) writeFileSync(join(saida, 'primeiros-passos', `primeiros-passos-${n}.png`), 'png')
  writeFileSync(join(destinoImg, 'primeiros-passos-99-velho.png'), 'velho')
  writeFileSync(join(destinoImg, 'outro-capitulo-01-x.png'), 'outro')
  const texto = join(raiz, 'texto.md'); writeFileSync(texto, '# Texto')
  return { raiz, saida, destinoImg, destinoSrc, texto }
}

test('publicar copia os prints, remove os orfaos do mesmo capitulo e nao toca nos de outro', () => {
  const p = montar()
  try {
    const r = publicar({ saida: p.saida, capitulo: 'primeiros-passos', texto: p.texto, destinoImg: p.destinoImg, destinoSrc: p.destinoSrc })
    assert.equal(r.copiados.length, 3)
    assert.deepEqual(r.removidos, ['primeiros-passos-99-velho.png'])
    assert.deepEqual(readdirSync(p.destinoImg).sort(), [
      'outro-capitulo-01-x.png', 'primeiros-passos-01-entrar.png', 'primeiros-passos-02-link.png', 'primeiros-passos-03-painel.png'])
    assert.equal(readFileSync(join(p.destinoSrc, 'primeiros-passos.md'), 'utf8'), '# Texto')
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})

test('publicar sem texto nao cria o .md; sem prints nao apaga nada', () => {
  const p = montar()
  try {
    rmSync(join(p.saida, 'primeiros-passos'), { recursive: true })
    mkdirSync(join(p.saida, 'primeiros-passos'))
    assert.throws(() => publicar({ saida: p.saida, capitulo: 'primeiros-passos', destinoImg: p.destinoImg, destinoSrc: p.destinoSrc }), /nenhum print/)
    assert.ok(existsSync(join(p.destinoImg, 'primeiros-passos-99-velho.png')))
  } finally { rmSync(p.raiz, { recursive: true, force: true }) }
})
