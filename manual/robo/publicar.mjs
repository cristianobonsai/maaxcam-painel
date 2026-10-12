// publicar.mjs - leva os prints e o texto de um capitulo para o painel (public/manual/img e src/manual).
// Remove PNGs antigos do MESMO capitulo que nao existem mais (sem sobras); nunca toca nos de outros capitulos.
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

export function publicar({ saida, capitulo, texto, destinoImg, destinoSrc }) {
  const origem = join(saida, capitulo)
  const pngs = existsSync(origem) ? readdirSync(origem).filter((f) => f.endsWith('.png')).sort() : []
  if (pngs.length === 0) throw new Error(`Publicar: nenhum print em ${origem} (rode o robô antes).`)
  mkdirSync(destinoImg, { recursive: true })
  for (const f of pngs) copyFileSync(join(origem, f), join(destinoImg, f))
  const removidos = readdirSync(destinoImg)
    .filter((f) => f.startsWith(`${capitulo}-`) && f.endsWith('.png') && !pngs.includes(f))
    .sort()
  for (const f of removidos) unlinkSync(join(destinoImg, f))
  if (texto) {
    mkdirSync(destinoSrc, { recursive: true })
    copyFileSync(texto, join(destinoSrc, `${capitulo}.md`))
  }
  return { copiados: pngs, removidos }
}
