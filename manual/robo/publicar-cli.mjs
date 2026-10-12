// publicar-cli.mjs - leva os prints (manual/saida/<cap>) e o texto (capitulos/<cap>/texto.md) para o painel:
// public/manual/img/*.png e src/manual/<cap>.md. Uso (no PC):  cd manual && npm run publicar -- --cap primeiros-passos
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { publicar } from './publicar.mjs'
import { parsearArgs } from './run.mjs'

const MANUAL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { cap } = parsearArgs(process.argv.slice(2))
    const r = publicar({
      saida: join(MANUAL_DIR, 'saida'), capitulo: cap,
      texto: join(MANUAL_DIR, 'capitulos', cap, 'texto.md'),
      destinoImg: join(MANUAL_DIR, '..', 'public', 'manual', 'img'),
      destinoSrc: join(MANUAL_DIR, '..', 'src', 'manual'),
    })
    console.log(`[manual] publicados ${r.copiados.length} prints; removidos ${r.removidos.length} antigos.`)
  } catch (e) {
    console.error(`[manual] ERRO: ${e.message}`)
    process.exit(1)
  }
}
