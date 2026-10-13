// Dados ficticios do lote 3 do manual: grupos de transmissao, notificacoes, relatorios e faturamento.
import test from 'node:test'
import assert from 'node:assert/strict'
import { criarMock } from '../robo/mock-api.mjs'
import { rotas, estadoInicial } from '../dados/rotas.mjs'
import { aplicarCenario } from '../dados/rotas-lote3.mjs'
import { varrerTexto } from '../robo/seguranca.mjs'

const novoMock = () => criarMock(rotas, estadoInicial)
const limpo = (obj) => assert.deepEqual(varrerTexto(JSON.stringify(obj)), [])

test('GET /api/cameras (sem ?mine=1) devolve a mesma lista; /api/me so libera grupos no cenario "grupos"', () => {
  const m = novoMock()
  assert.equal(m.responder('GET', '/api/cameras').json.length, 2)
  assert.equal(m.responder('GET', '/api/me').json.can_use_groups, false)
  aplicarCenario(m.estado(), 'grupos')
  assert.equal(m.responder('GET', '/api/me').json.can_use_groups, true)
  const cams = m.responder('GET', '/api/cameras').json
  assert.equal(cams.length, 3)
  assert.equal(cams.filter((c) => c.plan === 'premium').length, 3)
})

test('grupos: vazio por padrao; cenario cria 1 grupo com 2 cameras; criar, editar, adicionar/remover camera, ligar e desligar', () => {
  const m = novoMock()
  assert.deepEqual(m.responder('GET', '/api/groups').json, [])
  aplicarCenario(m.estado(), 'grupos')
  const [g] = m.responder('GET', '/api/groups').json
  assert.equal(g.name, 'Praças do Centro')
  assert.equal(g.relay_active, false)
  assert.equal(g.has_youtube_key, true)
  assert.equal(g.cameras.length, 2)
  assert.deepEqual(g.cameras.map((c) => c.camera_name), ['Entrada', 'Estacionamento'])
  for (const c of g.cameras) for (const k of ['id', 'camera_id', 'duration_seconds', 'order_index']) assert.ok(c[k] !== undefined, k)

  const novo = m.responder('POST', '/api/groups', { name: 'Grupo Novo', transition_seconds: 5, resolution_tier: '1080p' })
  assert.equal(novo.status, 200)
  assert.equal(m.responder('GET', '/api/groups').json.length, 2)
  assert.equal(m.responder('PUT', `/api/groups/${g.id}`, { name: 'Praças e Orlas' }).status, 200)
  assert.equal(m.responder('GET', '/api/groups').json[0].name, 'Praças e Orlas')

  assert.equal(m.responder('POST', `/api/groups/${g.id}/cameras`, { camera_id: 'MAADEMO3', duration_seconds: 8 }).status, 200)
  const apos = m.responder('GET', '/api/groups').json[0]
  assert.equal(apos.cameras.length, 3)
  assert.equal(m.responder('DELETE', `/api/groups/${g.id}/cameras/${apos.cameras[2].id}`).status, 200)
  assert.equal(m.responder('GET', '/api/groups').json[0].cameras.length, 2)

  assert.equal(m.responder('POST', `/api/groups/${g.id}/relay/start`).status, 200)
  assert.equal(m.responder('GET', '/api/groups').json[0].relay_active, true)
  assert.equal(m.responder('POST', `/api/groups/${g.id}/relay/stop`).status, 200)
  assert.equal(m.responder('GET', '/api/groups').json[0].relay_active, false)
  assert.equal(m.responder('DELETE', `/api/groups/${g.id}`).status, 200)
  limpo(m.responder('GET', '/api/groups').json)
})

test('cenario "grupo-no-ar": grupo no ar, estado degradado e uma camera instavel fora do rodizio', () => {
  const m = novoMock()
  aplicarCenario(m.estado(), 'grupos')
  aplicarCenario(m.estado(), 'grupo-no-ar')
  const [g] = m.responder('GET', '/api/groups').json
  assert.equal(g.relay_active, true)
  assert.equal(g.status, 'degradado')
  assert.equal(g.health_active, true)
  assert.ok(g.audio_file)
  const inst = g.cameras.find((c) => c.health === 'instavel')
  assert.ok(inst && inst.health_returns_in_s > 0 && inst.health_reason)
  limpo(g)
})

test('notificacoes: padrao, PUT mescla, extras, link do Telegram, teste, cenario conectado e desconectar', () => {
  const m = novoMock()
  const base = m.responder('GET', '/api/notifications').json
  assert.equal(base.enabled, true)
  assert.equal(base.off_delay_minutes, 3)
  assert.equal(base.email_enabled, false)
  const extra = m.responder('GET', '/api/notifications/extra').json
  assert.equal(extra.connected, false)
  assert.equal(extra.quiet_hours_enabled, false)

  assert.equal(m.responder('PUT', '/api/notifications', { off_delay_minutes: 5, email_enabled: true, email_to: 'alertas@exemplo.com' }).status, 200)
  assert.equal(m.responder('PUT', '/api/notifications/extra', { quiet_hours_enabled: true, quiet_start: '23:00', quiet_end: '06:00' }).status, 200)
  const dep = m.responder('GET', '/api/notifications').json
  assert.equal(dep.off_delay_minutes, 5)
  assert.equal(dep.email_to, 'alertas@exemplo.com')
  assert.equal(m.responder('GET', '/api/notifications/extra').json.quiet_start, '23:00')

  const link = m.responder('GET', '/api/notifications/telegram/link').json
  assert.match(link.deep_link, /^https:\/\/t\.me\//)
  assert.ok(link.link_code)

  aplicarCenario(m.estado(), 'telegram')
  const ligado = m.responder('GET', '/api/notifications/extra').json
  assert.equal(ligado.connected, true)
  assert.ok(ligado.chat_id && ligado.bot_username)
  assert.equal(m.responder('POST', '/api/notifications/test').status, 200)
  assert.equal(m.responder('POST', '/api/notifications/disconnect').status, 200)
  assert.equal(m.responder('GET', '/api/notifications/extra').json.connected, false)
  limpo([base, extra, dep, link, ligado])
})

test('notificacoes de convidados: um convidado fictício, um grupo de acesso e PUT que grava', () => {
  const m = novoMock()
  const { guests } = m.responder('GET', '/api/notifications/guests').json
  assert.equal(guests.length, 1)
  assert.match(guests[0].email, /@exemplo\.com$/)
  assert.equal(guests[0].enabled, true)
  const grupos = m.responder('GET', '/api/access-groups').json
  assert.equal(grupos[0].name, 'Equipe da loja')
  assert.ok(grupos[0].member_ids.includes(guests[0].user_id))
  assert.equal(m.responder('PUT', `/api/notifications/guests/${guests[0].user_id}`, { enabled: false, via_email: true, via_telegram: false, scope: [] }).status, 200)
  assert.equal(m.responder('GET', '/api/notifications/guests').json.guests[0].enabled, false)
  limpo([guests, grupos])
})

test('relatorios: disponibilidade, SLA por periodo, quedas (ranking, detalhe, periodo) e acessos', () => {
  const m = novoMock()
  const up = m.responder('GET', '/api/reports/uptime?dias=7').json
  assert.equal(up.cameras.length, 2)
  for (const c of up.cameras) for (const k of ['camera_id', 'nome', 'pct_online', 'horas_online', 'horas_offline']) assert.ok(c[k] !== undefined, k)
  const sla = m.responder('GET', '/api/reports/uptime/periodo?data_inicio=2026-10-06&data_fim=2026-10-12').json
  assert.equal(sla.data_inicio, '2026-10-06')
  assert.equal(sla.data_fim, '2026-10-12')
  assert.ok(sla.cameras.every((c) => 'maior_queda_seg' in c && 'maior_queda_fmt' in c))
  assert.ok(sla.cameras.some((c) => c.maior_queda_seg > 4 * 86400), 'uma camera extrapola o SLA de 4 dias, para o print mostrar os dois estados')
  assert.ok(sla.cameras.some((c) => c.maior_queda_seg < 4 * 86400))

  const q = m.responder('GET', '/api/reports/drops?dias=7').json
  assert.equal(q.dias, 7)
  assert.equal(q.total_quedas, q.cameras.reduce((s, c) => s + c.quedas, 0))
  const comQueda = q.cameras.find((c) => c.quedas > 0)
  const det = m.responder('GET', `/api/reports/drops/${comQueda.camera_id}?dias=7`).json
  assert.equal(det.total, comQueda.quedas)
  assert.equal(det.quedas.length, comQueda.quedas)
  const per = m.responder('GET', `/api/reports/drops/${comQueda.camera_id}/periodo?data_inicio=2026-10-06&data_fim=2026-10-12`).json
  assert.ok(per.nome && per.total_offline_fmt && per.quedas.length >= 2)
  assert.ok(per.quedas.every((x) => x.caiu && x.duracao_fmt))

  const ac = m.responder('GET', '/api/reports/access-logs?dias=7').json
  assert.equal(ac.total, ac.logins.length)
  assert.ok(ac.logins.every((l) => /@exemplo\.com$/.test(l.email) && l.ip.startsWith('203.0.113.') && l.quando))
  const acp = m.responder('GET', '/api/reports/access/periodo?data_inicio=2026-10-06&data_fim=2026-10-12').json
  assert.equal(acp.total, acp.logins.length)
  limpo([up, sla, q, det, per, ac, acp])
})

test('faturamento: soma por plano das cameras reais do estado; com grupos soma R$ 59,90 por grupo', () => {
  const m = novoMock()
  const b = m.responder('GET', '/api/billing/summary').json
  assert.equal(b.groups_addon, false)
  assert.deepEqual(b.itens_por_plano.map((i) => [i.plan, i.quantidade, i.subtotal]).sort(), [['basico', 1, 9.9], ['pro', 1, 29.9]])
  assert.equal(b.total_geral, 39.8)

  aplicarCenario(m.estado(), 'grupos')
  const g = m.responder('GET', '/api/billing/summary').json
  assert.equal(g.groups_addon, true)
  assert.equal(g.itens_por_plano.length, 1)
  assert.equal(g.itens_por_plano[0].plan, 'premium')
  assert.equal(g.itens_por_plano[0].quantidade, 3)
  assert.equal(g.grupos.length, 1)
  assert.equal(g.grupos[0].preco, 59.9)
  assert.equal(g.total_geral, Math.round((3 * 32.9 + 59.9) * 100) / 100)
  limpo([b, g])
})

test('cenarios desconhecidos falham alto (nada de erro silencioso)', () => {
  assert.throws(() => aplicarCenario(estadoInicial(), 'inventado'), /cenario/i)
})
