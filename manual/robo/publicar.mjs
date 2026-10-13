// publicar.mjs - leva os prints e o texto de um capitulo para o painel (public/manual/img e src/manual).
// Recusa rodada que quebrou/incompleta (status.json) e texto que cita print que o robo nao gerou.
// Remove PNGs antigos do MESMO capitulo que nao existem mais (sem sobras); nunca toca nos de outros capitulos.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function publicar({ saida, capitulo, texto, destinoImg, destinoSrc }) {
  const origem = join(saida, capitulo)
  const pngs = existsSync(origem) ? readdirSync(origem).filter((f) => f.endsWith('.png')).sort() : []
  if (pngs.length === 0) throw new Error(`Publicar: nenhum print em ${origem} (rode o robô antes).`)

  // so publica o que uma rodada COMPLETA e sem quebra produziu (status.json e escrito no fim de cada rodada)
  const arquivoStatus = join(origem, 'status.json')
  if (!existsSync(arquivoStatus)) throw new Error(`Publicar: sem status.json em ${origem} (rodada incompleta ou antiga; rode o robô de novo).`)
  let status
  try { status = JSON.parse(readFileSync(arquivoStatus, 'utf8')) } catch { throw new Error(`Publicar: status.json ilegível em ${origem}.`) }
  if (status.quebra !== false) throw new Error('Publicar: a última rodada do robô quebrou; corrija e rode de novo antes de publicar.')

  if (texto) {
    const citados = [...readFileSync(texto, 'utf8').matchAll(/img:([a-z0-9-]+)/g)].map((m) => m[1])
    const faltando = [...new Set(citados)].filter((id) => !pngs.includes(`${id}.png`))
    if (faltando.length) throw new Error(`Publicar: o texto cita print que o robô não gerou: ${faltando.join(', ')}.`)
  }

  mkdirSync(destinoImg, { recursive: true })
  for (const f of pngs) copyFileSync(join(origem, f), join(destinoImg, f))
  // orfao = print numerado deste capitulo (cap-NN-id.png); "primeiros-passos-2-..." e de outro capitulo
  const doCapitulo = new RegExp(`^${escapar(capitulo)}-\\d{2}-[a-z0-9-]+\\.png$`)
  const removidos = readdirSync(destinoImg).filter((f) => doCapitulo.test(f) && !pngs.includes(f)).sort()
  for (const f of removidos) unlinkSync(join(destinoImg, f))
  if (texto) {
    mkdirSync(destinoSrc, { recursive: true })
    copyFileSync(texto, join(destinoSrc, `${capitulo}.md`))
  }
  return { copiados: pngs, removidos }
}
