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
  assert.equal(m.responder('POST', '/auth/v1/otp?redirect_to=http%3A%2F%2F127.0.0.1%3A4173%2Fpainel', {}).status, 200)
})

test('caps (liberacoes do plano) seguem o plano da camera: Basico bloqueia embed/youtube/audio/foto', () => {
  const m = novoMock()
  const pro = m.responder('GET', '/api/cameras/MAADEMO1/security').json.caps       // MAADEMO1 = Pro
  assert.deepEqual(pro, { embed: true, youtube: true, audio: true, snapshot: true })
  const basico = m.responder('GET', '/api/cameras/MAADEMO2/security').json.caps    // MAADEMO2 = Basico
  assert.deepEqual(basico, { embed: false, youtube: false, audio: false, snapshot: false })
  assert.deepEqual(m.responder('GET', '/api/cameras/MAADEMO2/caps').json, basico)
  const nova = m.responder('POST', '/api/cameras', { name: 'Portão', plan: 'basico' }).json
  assert.deepEqual(m.responder('GET', `/api/cameras/${nova.camera_id}/caps`).json, basico)
})

test('camera inexistente: 404 (nao 200 vazio nem excecao)', () => {
  const m = novoMock()
  for (const caminho of ['/api/cameras/NAOEXISTE', '/api/cameras/NAOEXISTE/security', '/api/cameras/NAOEXISTE/caps']) {
    assert.equal(m.responder('GET', caminho).status, 404, caminho)
  }
})

test('monitoramento do dashboard: cenario "atencao" lista cameras com problema; padrao = tudo certo (lista vazia)', () => {
  const m = novoMock()
  assert.deepEqual(m.responder('GET', '/api/monitoring?mine=1').json, [])
  m.estado().cenario = 'atencao'
  const lista = m.responder('GET', '/api/monitoring?mine=1').json
  assert.ok(lista.length >= 1)
  for (const c of lista) {
    assert.ok(c.camera_id && c.name && c.status_geral && c.status_geral !== 'ok')
  }
  assert.ok(lista.some((c) => c.status_geral === 'fora_do_ar'))
  assert.deepEqual(varrerTexto(JSON.stringify(lista)), [])
})

test('PUT /api/cameras/{id} grava no estado (nome, qualidade, ativa, plano, chave do YouTube); 404 se nao existe', () => {
  const m = novoMock()
  const r = m.responder('PUT', '/api/cameras/MAADEMO1', { name: 'Entrada principal', enabled: false, quality_tier: '2k', plan: 'premium', youtube_key: 'rtmp://exemplo/live2/abc' })
  assert.equal(r.status, 200)
  const c = m.responder('GET', '/api/cameras/MAADEMO1').json
  assert.equal(c.name, 'Entrada principal')
  assert.equal(c.enabled, false)
  assert.equal(c.quality_tier, '2k')
  assert.equal(c.plan, 'premium')
  assert.equal(c.youtube_key, 'rtmp://exemplo/live2/abc')
  assert.equal(m.responder('GET', '/api/cameras/MAADEMO1/security').json.youtube_key, 'rtmp://exemplo/live2/abc')
  assert.equal(m.responder('PUT', '/api/cameras/NAOEXISTE', { name: 'x' }).status, 404)
})

test('seguranca: privacidade, dominios, IPs e tokens funcionam no estado e aparecem no GET /security', () => {
  const m = novoMock()
  const antes = m.responder('GET', '/api/cameras/MAADEMO1/security').json
  assert.equal(antes.stream_privacy, 'public')
  assert.deepEqual([antes.domains, antes.ips, antes.tokens], [[], [], []])

  assert.equal(m.responder('PUT', '/api/cameras/MAADEMO1/security/privacy', { stream_privacy: 'private' }).status, 200)
  assert.equal(m.responder('POST', '/api/cameras/MAADEMO1/security/domains', { domain: 'exemplo.com.br' }).status, 200)
  assert.equal(m.responder('POST', '/api/cameras/MAADEMO1/security/ips', { cidr: '203.0.113.0/24', label: 'Servidor A' }).status, 200)
  const t = m.responder('POST', '/api/cameras/MAADEMO1/security/tokens', { label: 'Servidor A' })
  assert.equal(t.status, 200)

  const s = m.responder('GET', '/api/cameras/MAADEMO1/security').json
  assert.equal(s.stream_privacy, 'private')
  assert.equal(s.domains[0].domain, 'exemplo.com.br')
  assert.equal(s.ips[0].cidr, '203.0.113.0/24')
  assert.equal(s.ips[0].label, 'Servidor A')
  assert.equal(s.tokens[0].label, 'Servidor A')
  assert.match(s.tokens[0].token, /^demo-/)
  assert.deepEqual(varrerTexto(JSON.stringify(s)), [])

  assert.equal(m.responder('DELETE', `/api/cameras/MAADEMO1/security/tokens/${s.tokens[0].id}`).status, 200)
  assert.equal(m.responder('DELETE', `/api/cameras/MAADEMO1/security/domains/${s.domains[0].id}`).status, 200)
  assert.equal(m.responder('DELETE', `/api/cameras/MAADEMO1/security/ips/${s.ips[0].id}`).status, 200)
  const vazio = m.responder('GET', '/api/cameras/MAADEMO1/security').json
  assert.deepEqual([vazio.domains, vazio.ips, vazio.tokens], [[], [], []])
  assert.equal(m.responder('PUT', '/api/cameras/NAOEXISTE/security/privacy', { stream_privacy: 'private' }).status, 404)
})

test('reset() volta tambem a seguranca e o cenario ao inicio', () => {
  const m = novoMock()
  m.estado().cenario = 'atencao'
  m.responder('PUT', '/api/cameras/MAADEMO1/security/privacy', { stream_privacy: 'private' })
  m.reset()
  assert.equal(m.estado().cenario, undefined)
  assert.equal(m.responder('GET', '/api/cameras/MAADEMO1/security').json.stream_privacy, 'public')
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
