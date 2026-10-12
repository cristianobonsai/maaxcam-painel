import test from 'node:test'
import assert from 'node:assert/strict'
import { criarMock, ErroApiSemDado } from '../robo/mock-api.mjs'
import { rotas, estadoInicial } from '../dados/rotas.mjs'
import { varrerTexto } from '../robo/seguranca.mjs'

const novoMock = () => criarMock(rotas, estadoInicial)

test('GET /api/me devolve o cliente ficticio', () => {
  const r = novoMock().responder('GET', '/api/me')
  assert.equal(r.status, 200)
  assert.equal(r.json.email, 'cliente@exemplo.com')
  assert.equal(r.json.is_admin, false)
  assert.equal(r.json.permissions.can_add_cameras, true)
})

test('rota sem dado ficticio lanca ErroApiSemDado com metodo e caminho', () => {
  const m = novoMock()
  assert.throws(() => m.responder('GET', '/api/xyz'), (e) => {
    assert.ok(e instanceof ErroApiSemDado)
    assert.equal(e.metodo, 'GET')
    assert.equal(e.caminho, '/api/xyz')
    assert.match(e.message, /GET \/api\/xyz/)
    return true
  })
})

test('POST /api/cameras cria no estado; o GET seguinte lista; reset volta ao inicio', () => {
  const m = novoMock()
  assert.equal(m.responder('GET', '/api/cameras?mine=1').json.length, 2)
  const criada = m.responder('POST', '/api/cameras', { name: 'Portão' })
  assert.equal(criada.status, 200)
  assert.match(criada.json.stream_key, /^demo-/)
  assert.equal(criada.json.name, 'Portão')
  assert.match(criada.json.rtmp_url, /^rtmp:\/\/ingest\.livebybit\.com\/live\//)
  assert.equal(m.responder('GET', '/api/cameras?mine=1').json.length, 3)
  m.reset()
  assert.equal(m.responder('GET', '/api/cameras?mine=1').json.length, 2)
})

test('usadas() lista METODO caminho das rotas chamadas', () => {
  const m = novoMock()
  m.responder('GET', '/api/me')
  m.responder('GET', '/api/groups')
  assert.deepEqual(m.usadas(), ['GET /api/me', 'GET /api/groups'])
})

test('OPTIONS (preflight CORS) responde 204 sem exigir rota', () => {
  assert.equal(novoMock().responder('OPTIONS', '/qualquer/coisa').status, 204)
})

test('rotas da tela Gerenciar devolvem os campos que a tela le', () => {
  const m = novoMock()
  const sec = m.responder('GET', '/api/cameras/MAADEMO1/security').json
  for (const k of ['camera_id', 'name', 'rtmp_url', 'hls_url', 'stream_privacy', 'playback_id', 'relay_running',
    'youtube_key', 'tokens', 'ips', 'domains', 'in_group', 'in_active_group', 'has_audio', 'caps']) {
    assert.ok(k in sec, `falta ${k}`)
  }
  assert.ok(Array.isArray(sec.tokens) && Array.isArray(sec.ips) && Array.isArray(sec.domains))
  assert.equal(m.responder('GET', '/api/cameras/MAADEMO1').json.name, 'Entrada')
  assert.equal(m.responder('GET', '/api/cameras/MAADEMO1/caps').status, 200)
  assert.equal(m.responder('GET', '/api/groups').json.length, 0)
  assert.equal(m.responder('GET', '/api/monitoring?mine=1').json.length, 0)
  assert.match(m.responder('GET', '/embed/demo-pb-1').html, /Imagem de exemplo/)
  assert.equal(m.responder('POST', '/auth/v1/otp', { email: 'cliente@exemplo.com' }).status, 200)
})

test('snapshot devolve um PNG valido', () => {
  const r = novoMock().responder('GET', '/api/cameras/MAADEMO1/snapshot.jpg')
  assert.ok(Buffer.isBuffer(r.imagem))
  assert.equal(r.imagem.subarray(0, 4).toString('hex'), '89504e47')
})

test('nenhuma resposta tem dado real (varredura)', () => {
  const m = novoMock()
  const chamadas = [['GET', '/api/me'], ['GET', '/api/cameras?mine=1'], ['GET', '/api/cameras/MAADEMO1'],
    ['GET', '/api/cameras/MAADEMO1/security'], ['GET', '/api/cameras/MAADEMO1/caps'], ['GET', '/api/groups'],
    ['GET', '/api/monitoring?mine=1'], ['GET', '/embed/demo-pb-1'], ['POST', '/api/cameras', { name: 'Portão' }]]
  for (const [met, cam, corpo] of chamadas) {
    const r = m.responder(met, cam, corpo)
    const texto = JSON.stringify(r.json ?? '') + (r.html ?? '')
    assert.deepEqual(varrerTexto(texto), [], `${met} ${cam}`)
  }
})
