// run.mjs - robo do Manual: compila o painel (API de demonstracao), serve em 127.0.0.1, abre o Chromium com TODA
// requisicao interceptada (dados ficticios), percorre um capitulo e salva prints + manifest.json + relatorio.md.
// Uso (no Serv QA):  cd /opt/painel/manual && npm run manual -- --cap primeiros-passos
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { exigirLocalhost, decidirRequisicao } from './seguranca.mjs'
import { criarMock, ErroApiSemDado } from './mock-api.mjs'
import { rotas, estadoInicial } from '../dados/rotas.mjs'
import { localizar, ErroPassoQuebrado } from './localizar.mjs'
import { destacarEFotografar } from './destaque.mjs'
import { criarRelatorio } from './relatorio.mjs'
import { servirEstatico } from './servidor.mjs'

export const API_DEMO = 'https://api-demo.invalid'
export const CHAVE_SESSAO = 'sb-qtvrzdwgfeomzahtjwpz-auth-token'
export const VIEWPORT = { width: 1440, height: 900 }     // tela de notebook comum; mostra o layout completo do painel
const CTX_HOSTS = { apiHost: 'api-demo.invalid', playHost: 'play.livebybit.com', authHost: 'qtvrzdwgfeomzahtjwpz.supabase.co' }
const AQUI = dirname(fileURLToPath(import.meta.url))
const MANUAL_DIR = resolve(AQUI, '..')

export function parsearArgs(argv) {
  const r = { cap: null, porta: 4173, painel: '..' }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--cap') r.cap = argv[++i]
    else if (argv[i] === '--porta') r.porta = Number(argv[++i])
    else if (argv[i] === '--painel') r.painel = argv[++i]
  }
  if (!r.cap) throw new Error('Informe o capítulo: --cap primeiros-passos')
  return r
}

export const nomeArquivo = (cap, indice, id) => `${cap}-${String(indice).padStart(2, '0')}-${id}.png`

/** Sessao de login de mentira no formato do supabase-js (nenhuma credencial real). */
export function sessaoFalsa(agora = Math.floor(Date.now() / 1000)) {
  return {
    access_token: 'demo-token', token_type: 'bearer', expires_in: 31_536_000, expires_at: agora + 31_536_000,
    refresh_token: 'demo-refresh',
    user: { id: 'demo-cliente', aud: 'authenticated', role: 'authenticated', email: 'cliente@exemplo.com',
      app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  }
}

function compilarPainel(painelDir, buildDir) {
  const r = spawnSync('npm', ['run', 'build', '--', '--outDir', buildDir, '--emptyOutDir'], {
    cwd: painelDir, env: { ...process.env, VITE_API_URL: API_DEMO }, stdio: 'inherit', shell: process.platform === 'win32',
  })
  if (r.status !== 0) throw new Error('Falha ao compilar o painel de demonstração.')
}

export async function executar(argv) {
  const args = parsearArgs(argv)
  const painelDir = resolve(MANUAL_DIR, args.painel)
  const saida = join(MANUAL_DIR, 'saida')
  const buildDir = join(saida, 'build')
  const capDir = join(saida, args.cap)
  const falhasDir = join(saida, 'falhas')
  const roteiro = (await import(pathToFileURL(join(MANUAL_DIR, 'capitulos', args.cap, 'roteiro.mjs')).href)).default

  mkdirSync(saida, { recursive: true })
  rmSync(capDir, { recursive: true, force: true }); mkdirSync(capDir, { recursive: true })
  rmSync(falhasDir, { recursive: true, force: true }); mkdirSync(falhasDir, { recursive: true })
  compilarPainel(painelDir, buildDir)

  let chromium
  try { ({ chromium } = await import('playwright')) } catch {
    throw new Error('Playwright não instalado: rode "npm install" e "npx playwright install --with-deps chromium" em manual/ (só no Serv QA).')
  }

  const servidor = await servirEstatico(buildDir, args.porta)
  exigirLocalhost(servidor.origem)
  const ctxDecisao = { appOrigin: servidor.origem, ...CTX_HOSTS }
  const mock = criarMock(rotas, estadoInicial)
  const relatorio = criarRelatorio()
  const manifest = []
  const rede = { app: 0, mock: 0, estatico: 0, abortadas: [] }
  const errosApi = []

  const browser = await chromium.launch()
  const contextos = {}
  async function contexto(tipo) {
    if (contextos[tipo]) return contextos[tipo]
    const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'pt-BR' })
    ctx.setDefaultTimeout(10_000)
    if (tipo === 'logado') {
      await ctx.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [CHAVE_SESSAO, JSON.stringify(sessaoFalsa())])
    }
    await ctx.route('**/*', async (route) => {
      const req = route.request()
      const decisao = decidirRequisicao(req.url(), req.method(), ctxDecisao)
      if (decisao === 'abortar') { rede.abortadas.push(`${req.method()} ${req.url()}`); return route.abort() }
      if (decisao !== 'mock') { rede[decisao]++; return route.continue() }
      rede.mock++
      const u = new URL(req.url())
      let corpo
      try { corpo = req.postDataJSON() } catch { corpo = undefined }
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
      try {
        const r = mock.responder(req.method(), u.pathname + u.search, corpo)
        if (r.imagem) return route.fulfill({ status: r.status, contentType: 'image/png', body: r.imagem, headers: cors })
        if (r.html) return route.fulfill({ status: r.status, contentType: 'text/html; charset=utf-8', body: r.html, headers: cors })
        if (r.json !== undefined) return route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.json), headers: cors })
        return route.fulfill({ status: r.status, headers: cors })
      } catch (e) {
        if (!(e instanceof ErroApiSemDado)) throw e
        errosApi.push(e)
        return route.fulfill({ status: 501, contentType: 'application/json', body: JSON.stringify({ detail: e.message }), headers: cors })
      }
    })
    contextos[tipo] = { ctx, page: await ctx.newPage() }
    return contextos[tipo]
  }

  let indice = 0
  try {
    for (const passo of roteiro.passos) {
      indice++
      const { page } = await contexto(passo.contexto === 'logado' ? 'logado' : 'sem-sessao')
      const ctxLoc = { relatorio, capitulo: roteiro.id, passo: passo.id, espera: 4000 }
      const loc = (alvo) => localizar(page, alvo, ctxLoc)
      const arquivo = join(capDir, nomeArquivo(roteiro.id, indice, passo.id))
      try {
        if (passo.ir) await page.goto(servidor.origem + passo.ir, { waitUntil: 'domcontentloaded' })
        if (passo.acao) await passo.acao({ page, loc })
        // espera a rede aquietar, mas no maximo 3 s (players/iframes mantem atividade e nao devem travar o robo)
        await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(400)
        if (errosApi.length) throw errosApi[0]
        const alvos = []
        for (const a of passo.destacar) alvos.push(await loc(a))
        await destacarEFotografar(page, { alvos, arquivo, numeros: true, lados: passo.destacar.map((a) => a.numero) })
        relatorio.ok(roteiro.id, passo.id, `print ${nomeArquivo(roteiro.id, indice, passo.id)}`)
        manifest.push({ arquivo: nomeArquivo(roteiro.id, indice, passo.id), id: passo.id, titulo: passo.titulo,
          legenda: passo.legenda, destacados: passo.destacar.length })
      } catch (e) {
        const falha = join(falhasDir, `${roteiro.id}-${passo.id}.png`)
        await page.screenshot({ path: falha }).catch(() => {})
        if (e instanceof ErroApiSemDado) relatorio.apiSemDado(roteiro.id, passo.id, e.metodo, e.caminho)
        else relatorio.quebra(roteiro.id, passo.id, e instanceof ErroPassoQuebrado ? e.message : `erro: ${e.message}`, falha)
        break                                                         // para o capitulo no primeiro passo quebrado
      }
    }
  } finally {
    await browser.close()
    await servidor.fechar()
  }

  writeFileSync(join(capDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  writeFileSync(join(saida, 'relatorio.md'), relatorio.toMarkdown())
  console.log(`[manual] rede: app=${rede.app} mock=${rede.mock} estatico=${rede.estatico} abortadas=${rede.abortadas.length}`)
  for (const u of rede.abortadas) console.log(`[manual]   abortada: ${u}`)
  console.log(relatorio.toMarkdown())
  return relatorio.temQuebra() ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executar(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(`[manual] ERRO: ${e.message}`); process.exit(1) })
}
