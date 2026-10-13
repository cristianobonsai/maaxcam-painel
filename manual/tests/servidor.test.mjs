import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { servirEstatico } from '../robo/servidor.mjs'

test('servirEstatico: arquivo, rota SPA (fallback) e 404 de arquivo inexistente', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'manual-srv-'))
  writeFileSync(join(dir, 'index.html'), '<html>painel</html>')
  writeFileSync(join(dir, 'app.js'), 'console.log(1)')
  const srv = await servirEstatico(dir, 0)
  try {
    assert.match(srv.origem, /^http:\/\/127\.0\.0\.1:\d+$/)
    const raiz = await fetch(`${srv.origem}/`)
    assert.equal(raiz.status, 200)
    assert.match(await raiz.text(), /painel/)
    const spa = await fetch(`${srv.origem}/painel/cameras`)
    assert.equal(spa.status, 200)
    assert.match(await spa.text(), /painel/)
    const js = await fetch(`${srv.origem}/app.js`)
    assert.match(js.headers.get('content-type'), /javascript/)
    assert.equal((await fetch(`${srv.origem}/arquivo-inexistente.png`)).status, 404)
    // arquivo-sentinela FORA da pasta servida: nenhuma forma de "../" pode entrega-lo
    const fora = join(dir, '..', 'segredo-fora-manual-test.txt')
    writeFileSync(fora, 'SEGREDO-FORA')
    try {
      for (const caminho of ['/..%2fsegredo-fora-manual-test.txt', '/%2e%2e/segredo-fora-manual-test.txt',
        '/..%5csegredo-fora-manual-test.txt', '/%2e%2e%2f%2e%2e%2fsegredo-fora-manual-test.txt']) {
        const r = await fetch(`${srv.origem}${caminho}`)
        assert.notEqual(r.status, 200, caminho)
        assert.ok(!(await r.text()).includes('SEGREDO-FORA'), caminho)
      }
    } finally { rmSync(fora, { force: true }) }
    assert.equal((await fetch(`${srv.origem}/%E0%A4%A`)).status, 400)                    // % malformado: 400, sem derrubar o robo
    assert.equal((await fetch(`${srv.origem}/`)).status, 200)                            // e o servidor continua de pe
  } finally {
    await srv.fechar()
    rmSync(dir, { recursive: true, force: true })
  }
})
