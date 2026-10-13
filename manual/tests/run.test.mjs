import test from 'node:test'
import assert from 'node:assert/strict'
import { parsearArgs, nomeArquivo, sessaoFalsa, CHAVE_SESSAO } from '../robo/run.mjs'
import roteiro from '../capitulos/primeiros-passos/roteiro.mjs'
import { varrerTexto } from '../robo/seguranca.mjs'

test('parsearArgs: cap, porta e painel com padroes', () => {
  assert.deepEqual(parsearArgs(['--cap', 'primeiros-passos', '--porta', '4999']), { cap: 'primeiros-passos', porta: 4999, painel: '..' })
  assert.deepEqual(parsearArgs(['--cap', 'x']), { cap: 'x', porta: 4173, painel: '..' })
  assert.equal(parsearArgs(['--cap', 'x', '--painel', '/opt/painel']).painel, '/opt/painel')
  assert.throws(() => parsearArgs([]), /--cap/)
  for (const ruim of ['../capitulos/primeiros-passos', 'build', 'falhas', 'A B', '', 'x/y']) {
    assert.throws(() => parsearArgs(['--cap', ruim]), /--cap/, ruim)                  // nada de caminho nem nome reservado
  }
})

test('substituirHostDemo: na tela o endereco ficticio da API aparece como o real (so cosmetico, so no print)', async () => {
  const { substituirHostDemo } = await import('../robo/run.mjs')
  assert.equal(substituirHostDemo('https://api-demo.invalid/api/cameras/MAADEMO1/snapshot.jpg'), 'https://api.livebybit.com/api/cameras/MAADEMO1/snapshot.jpg')
  assert.equal(substituirHostDemo('sem host aqui'), 'sem host aqui')
  assert.equal(substituirHostDemo('a api-demo.invalid e outra api-demo.invalid'), 'a api.livebybit.com e outra api.livebybit.com')
})

test('nomeArquivo: nome estavel com dois digitos', () => {
  assert.equal(nomeArquivo('primeiros-passos', 5, 'formulario'), 'primeiros-passos-05-formulario.png')
  assert.equal(nomeArquivo('primeiros-passos', 12, 'x'), 'primeiros-passos-12-x.png')
})

test('sessaoFalsa: formato do supabase, sem credencial real, validade longa', () => {
  const s = sessaoFalsa(1_700_000_000)
  assert.equal(CHAVE_SESSAO, 'sb-qtvrzdwgfeomzahtjwpz-auth-token')
  assert.equal(s.user.email, 'cliente@exemplo.com')
  assert.ok(s.expires_at > 1_700_000_000 + 300 * 86400)
  assert.deepEqual(varrerTexto(JSON.stringify(s)), [])
})

test('roteiro de Primeiros passos: 8 passos com ids unicos, contexto valido e alvos preenchidos', () => {
  assert.equal(roteiro.id, 'primeiros-passos')
  assert.deepEqual(roteiro.passos.map((p) => p.id),
    ['entrar', 'link-enviado', 'painel', 'lista', 'formulario', 'criada', 'transmissao', 'verificar'])
  for (const p of roteiro.passos) {
    assert.ok(['sem-sessao', 'logado'].includes(p.contexto), p.id)
    assert.ok(p.titulo && p.legenda, p.id)
    assert.ok(p.destacar.length >= 1, p.id)
    for (const a of p.destacar) {
      assert.ok(a.nome instanceof RegExp || (typeof a.nome === 'string' && a.nome.length > 0), p.id)
      assert.ok(a.por ? ['texto', 'css'].includes(a.por) : !!a.papel, p.id)
      assert.ok(a.numero === undefined || ['esquerda', 'direita', 'acima', 'abaixo'].includes(a.numero), p.id)
    }
  }
})

test('roteiro da Carbigdata: 2 passos, o ultimo destaca o link HLS e o botao Copiar; sem palavra proibida no codigo', async () => {
  const r = (await import('../capitulos/compartilhar-carbigdata/roteiro.mjs')).default
  assert.equal(r.id, 'compartilhar-carbigdata')
  assert.deepEqual(r.passos.map((p) => p.id), ['gerenciar', 'link-hls'])
  for (const p of r.passos) {
    assert.equal(p.contexto, 'logado', p.id)
    assert.ok(p.titulo && p.legenda && p.destacar.length >= 1, p.id)
  }
  const hls = r.passos[1].destacar
  assert.ok(hls.some((a) => a.por === 'texto' && String(a.nome).includes('/hls/')), 'destaca o link HLS')
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  const fonte = readFileSync(fileURLToPath(new URL('../capitulos/compartilhar-carbigdata/roteiro.mjs', import.meta.url)), 'utf8')
  // a palavra so aparece no texto.md; no codigo ela existe apenas dentro do identificador do capitulo
  assert.deepEqual(varrerTexto(fonte.replaceAll('compartilhar-carbigdata', 'capitulo')), [])
})

test('o codigo-fonte do roteiro e dos dados ficticios nao tem dado real (constantes digitadas na tela)', async () => {
  const { readFileSync } = await import('node:fs')
  const { fileURLToPath } = await import('node:url')
  for (const rel of ['../capitulos/primeiros-passos/roteiro.mjs', '../dados/rotas.mjs']) {
    const fonte = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
    assert.deepEqual(varrerTexto(fonte), [], rel)
  }
})

test('titulos e legendas do roteiro nao tem dado real nem palavra proibida', () => {
  const texto = roteiro.passos.map((p) => `${p.titulo} ${p.legenda}`).join('\n')
  assert.deepEqual(varrerTexto(texto), [])
})
