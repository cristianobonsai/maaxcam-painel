// pdf-cli.mjs - gera o PDF do manual (no Serv QA, onde o Playwright esta instalado):
//   cd manual && npm run pdf -- --versao 3.0
// Saida: manual/saida/pdf/LiveByBit-Manual-Usuario-v<versao>.pdf (+ manual.html e medida-*.html, descartaveis).
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dataPorExtenso, gerarPdf, lerCapitulos } from './pdf.mjs'

const MANUAL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PAINEL_DIR = resolve(MANUAL_DIR, '..')

export function parsearArgsPdf(argv) {
  const r = { versao: '3.0' }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--versao') {
      r.versao = argv[++i] || ''
      if (!/^\d+\.\d+$/.test(r.versao)) throw new Error('--versao precisa ser no formato 3.0')
    } else throw new Error(`argumento desconhecido: ${argv[i]}`)
  }
  return r
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { versao } = parsearArgsPdf(process.argv.slice(2))
    const r = await gerarPdf({
      capitulos: lerCapitulos(join(PAINEL_DIR, 'src', 'manual')),
      versao, data: dataPorExtenso(new Date()),
      baseImg: `${pathToFileURL(join(PAINEL_DIR, 'public', 'manual', 'img')).href}/`,
      pasta: join(MANUAL_DIR, 'saida', 'pdf'), nomePdf: `LiveByBit-Manual-Usuario-v${versao.split('.')[0]}.pdf`,
    })
    console.log(`[manual] PDF gerado: ${r.arquivo} (${r.paginas} paginas)`)
    console.log(`[manual] capitulos comecam nas paginas: ${r.inicios.join(', ')}`)
  } catch (e) {
    console.error(`[manual] ERRO: ${e.message}`)
    process.exit(1)
  }
}
