// servidor.mjs - servidor estatico local do painel compilado (com fallback de rotas SPA para index.html).
// Escuta SO em 127.0.0.1 (o robo exige localhost).
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf',
}

function arquivoDe(dir, urlPath) {
  const alvo = normalize(join(dir, decodeURIComponent(urlPath)))
  if (alvo !== dir && !alvo.startsWith(dir + sep)) return null           // fora da pasta (../)
  try { return statSync(alvo).isFile() ? alvo : null } catch { return null }
}

export function servirEstatico(dir, porta) {
  const raiz = normalize(dir)
  const servidor = createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://127.0.0.1')
    let arquivo
    try { arquivo = arquivoDe(raiz, pathname) } catch { res.writeHead(400); res.end('requisicao invalida'); return }   // % malformado
    if (!arquivo) {
      if (extname(pathname)) { res.writeHead(404); res.end('nao encontrado'); return }
      arquivo = join(raiz, 'index.html')                                   // rota SPA
    }
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo).toLowerCase()] || 'application/octet-stream' })
    createReadStream(arquivo).on('error', () => res.end()).pipe(res)
  })
  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(porta, '127.0.0.1', () => {
      const { port } = servidor.address()
      resolve({
        origem: `http://127.0.0.1:${port}`,
        fechar: () => new Promise((ok) => { servidor.close(() => ok()); servidor.closeAllConnections?.() }),
      })
    })
  })
}
