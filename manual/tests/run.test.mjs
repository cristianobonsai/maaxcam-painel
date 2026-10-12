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
    }
  }
})

test('titulos e legendas do roteiro nao tem dado real nem palavra proibida', () => {
  const texto = roteiro.passos.map((p) => `${p.titulo} ${p.legenda}`).join('\n')
  assert.deepEqual(varrerTexto(texto), [])
})
