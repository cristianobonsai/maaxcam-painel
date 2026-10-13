// Dados ficticios do lote 2 do manual: localizacao/mapa, monitoramento, cartoes e integracao.
import test from 'node:test'
import assert from 'node:assert/strict'
import { criarMock } from '../robo/mock-api.mjs'
import { rotas, estadoInicial } from '../dados/rotas.mjs'
import { varrerTexto } from '../robo/seguranca.mjs'

const novoMock = () => criarMock(rotas, estadoInicial)
const limpo = (obj) => assert.deepEqual(varrerTexto(JSON.stringify(obj)), [])

test('localizacao: as duas cameras ja tem ponto no mapa; PUT grava; camera nova nao aparece em /api/map/coords', () => {
  const m = novoMock()
  const loc = m.responder('GET', '/api/cameras/MAADEMO1/location').json
  assert.equal(typeof loc.lat, 'number')
  assert.equal(typeof loc.lng, 'number')
  assert.ok(loc.location)
  const coords = m.responder('GET', '/api/map/coords').json
  assert.deepEqual(Object.keys(coords).sort(), ['MAADEMO1', 'MAADEMO2'])
  assert.equal(coords.MAADEMO1.lat, loc.lat)

  assert.equal(m.responder('PUT', '/api/cameras/MAADEMO1/location', { location: 'Padaria Exemplo - Rua Exemplo, 100', lat: -27.6, lng: -48.55 }).status, 200)
  const depois = m.responder('GET', '/api/cameras/MAADEMO1/location').json
  assert.equal(depois.location, 'Padaria Exemplo - Rua Exemplo, 100')
  assert.equal(m.responder('GET', '/api/map/coords').json.MAADEMO1.lng, -48.55)

  const nova = m.responder('POST', '/api/cameras', { name: 'Portão' }).json
  assert.equal(m.responder('GET', `/api/cameras/${nova.camera_id}/location`).json.lat, null)
  assert.ok(!(nova.camera_id in m.responder('GET', '/api/map/coords').json))
  assert.equal(m.responder('GET', '/api/cameras/NAOEXISTE/location').status, 404)
  limpo([loc, coords, depois])
})

test('geocodificacao ficticia: busca devolve enderecos inventados; reversa devolve um rotulo', () => {
  const m = novoMock()
  const r = m.responder('GET', '/api/geocode?q=rua%20exemplo').json
  assert.ok(Array.isArray(r) && r.length >= 2)
  for (const x of r) assert.ok(x.label && typeof x.lat === 'number' && typeof x.lng === 'number')
  const rev = m.responder('GET', '/api/reverse-geocode?lat=-27.5954&lng=-48.548').json
  assert.ok(rev.label)
  assert.equal(rev.display_name, rev.label)
  limpo([r, rev])
})

test('monitoramento da camera: padrao saudavel; cenarios problemas e duplicada; camera sem sinal; 404', () => {
  const m = novoMock()
  const ok = m.responder('GET', '/api/cameras/MAADEMO1/monitoring').json
  assert.equal(ok.conexao, 'conectada')
  assert.equal(ok.estabilidade, 'estavel')
  assert.equal(ok.drops_24h, 0)
  assert.equal(ok.ajustes, 'ok')
  for (const k of ['tipo', 'saida', 'resolucao', 'fps', 'bitrate_kbps', 'keyframe_s', 'codec']) assert.ok(ok[k] !== undefined, k)

  const sem = m.responder('GET', '/api/cameras/MAADEMO2/monitoring').json
  assert.notEqual(sem.conexao, 'conectada')

  m.estado().monitoramento = 'problemas'
  const p = m.responder('GET', '/api/cameras/MAADEMO1/monitoring').json
  assert.equal(p.estabilidade, 'instavel')
  assert.ok(p.drops_24h >= 3)
  assert.equal(p.ajustes, 'ajustar')
  assert.ok(p.ajustes_motivo)

  m.estado().monitoramento = 'duplicada'
  const d = m.responder('GET', '/api/cameras/MAADEMO1/monitoring').json
  assert.equal(d.ingest.duplicate, true)
  assert.ok(d.ingest.ip_blocked.startsWith('203.0.113.'))
  assert.ok(d.ingest.attempts >= 2)
  assert.equal(m.responder('GET', '/api/cameras/NAOEXISTE/monitoring').status, 404)
  limpo([ok, sem, p, d])
})

test('cartoes: GET /card traz itens de introducao e offline; PUT /card/items grava; preview e uma imagem SVG', () => {
  const m = novoMock()
  const c = m.responder('GET', '/api/cameras/MAADEMO1/card').json
  assert.ok(c.items_intro.length >= 2)
  assert.ok(c.items_offline.length >= 1)
  assert.equal(c.card_duration_seconds, 5)
  assert.equal(c.card_offline_timeout_minutes, 30)
  assert.ok(c.card_video_path)
  assert.equal(c.card_offline_video_exists, true)
  assert.equal(c.card_offline_live_enabled, false)
  assert.equal(c.card_enabled, true)

  const novo = { type: 'text', mode: 'fixed', content: 'Bem-vindo', style: { font: 'bold', font_family: 'dejavu', size: 40, color: '#FFFFFF', align: 'left' }, position: { x: 5, y: 80 } }
  assert.equal(m.responder('PUT', '/api/cameras/MAADEMO1/card/items', { card_type: 'intro', items: [novo], duration_seconds: 7, use_snapshot_bg: false }).status, 200)
  const depois = m.responder('GET', '/api/cameras/MAADEMO1/card').json
  assert.equal(depois.items_intro.length, 1)
  assert.equal(depois.card_duration_seconds, 7)

  const prev = m.responder('GET', '/api/cameras/MAADEMO1/card/preview?card_type=intro&_=0')
  assert.equal(prev.status, 200)
  assert.match(prev.svg, /^<svg /)
  assert.match(prev.svg, /Bem-vindo/)
  assert.equal(m.responder('GET', '/api/cameras/NAOEXISTE/card').status, 404)
  limpo([c, depois])
})

test('integracao: GET /carbigdata devolve a configuracao ficticia completa; PUT guarda; capturas vazias', () => {
  const m = novoMock()
  const d = m.responder('GET', '/api/cameras/MAADEMO1/carbigdata').json
  assert.equal(d.enabled, true)
  assert.equal(d.ambiente, 'sandbox')
  assert.equal(d.tipo_reconhecimento, 'interno')
  assert.equal(d.has_api_key_sandbox, true)
  assert.equal(d.has_api_key_producao, false)
  assert.ok(d.sftp_usuario && d.sftp_senha && d.sftp_host && d.sftp_port)
  assert.match(d.webhook_url, /^http:\/\/api\.livebybit\.com\/api\/carbigdata\/webhook-externo\//)
  assert.ok(d.modelos_homologados.length >= 1)
  assert.equal(d.horario_modo, 'comercial')
  assert.ok(d.mac_travado)
  assert.equal('api_key' in d, false)
  assert.equal(d.lat, m.responder('GET', '/api/cameras/MAADEMO1/location').json.lat)

  assert.equal(m.responder('PUT', '/api/cameras/MAADEMO1/carbigdata', { enabled: false, horario_modo: '24h' }).status, 200)
  const depois = m.responder('GET', '/api/cameras/MAADEMO1/carbigdata').json
  assert.equal(depois.enabled, false)
  assert.equal(depois.horario_modo, '24h')

  const cap = m.responder('GET', '/api/cameras/MAADEMO1/carbigdata/capturas?status=todas&limit=1&offset=0').json
  assert.deepEqual(cap, { total: 0, items: [] })
  assert.equal(m.responder('GET', '/api/cameras/NAOEXISTE/carbigdata').status, 404)
  // o endereco do webhook tem o caminho real "/api/carbigdata/..." (como no painel de verdade); o resto segue proibido
  assert.deepEqual(varrerTexto(JSON.stringify(d), { permitir: ['carbigdata'] }), [])
})
