// Dados ficticios do lote 4 do manual: usuarios (convidados e grupos de acesso) e minha conta.
import test from 'node:test'
import assert from 'node:assert/strict'
import { criarMock } from '../robo/mock-api.mjs'
import { rotas, estadoInicial } from '../dados/rotas.mjs'
import { aplicarCenario } from '../dados/rotas-lote3.mjs'
import { aplicarCenarioConta } from '../dados/rotas-lote4.mjs'
import { varrerTexto } from '../robo/seguranca.mjs'

const novoMock = () => criarMock(rotas, estadoInicial)
const limpo = (obj) => assert.deepEqual(varrerTexto(JSON.stringify(obj)), [])

test('convites: um pendente de partida; enviar acrescenta, cancelar tira, e-mail que ja tem conta responde o erro que o painel reconhece', () => {
  const m = novoMock()
  const antes = m.responder('GET', '/api/account/invites').json
  assert.equal(antes.length, 1)
  assert.equal(antes[0].status, 'pending')
  assert.match(antes[0].email, /@exemplo\.com$/)

  assert.equal(m.responder('POST', '/api/account/invites', { email: 'nova.pessoa@exemplo.com' }).status, 200)
  assert.equal(m.responder('GET', '/api/account/invites').json.length, 2)
  assert.equal(m.responder('POST', '/api/account/invites', { email: '' }).status, 422)

  const preso = m.responder('POST', '/api/account/invites', { email: 'ja-tem-conta@exemplo.com' })
  assert.equal(preso.status, 409)
  assert.ok(preso.json.detail.includes('já tem conta própria'), 'o painel procura exatamente este trecho')
  assert.equal(m.responder('GET', '/api/account/invites').json.length, 2, 'o e-mail recusado nao vira convite')

  assert.equal(m.responder('DELETE', `/api/account/invites/${antes[0].id}`).status, 200)
  assert.equal(m.responder('GET', '/api/account/invites').json.length, 1)
  limpo([antes, preso.json])
})

test('convidado: mesmo usuario das notificacoes, permissoes que gravam e remocao', () => {
  const m = novoMock()
  const [membro] = m.responder('GET', '/api/account/members').json
  const guests = m.responder('GET', '/api/notifications/guests').json.guests
  assert.equal(membro.user_id, guests[0].user_id)
  assert.equal(membro.email, guests[0].email)
  for (const k of ['can_add_cameras', 'can_edit_cameras', 'can_change_plan', 'can_create_groups', 'can_edit_notif', 'can_view_access_logs', 'can_view_drops', 'can_view_uptime']) {
    assert.ok(k in membro.permissions, k)
  }
  assert.equal(m.responder('PUT', `/api/account/members/${membro.user_id}/permissions`, { ...membro.permissions, can_add_cameras: 1 }).status, 200)
  assert.equal(m.responder('GET', '/api/account/members').json[0].permissions.can_add_cameras, 1)
  assert.equal(m.responder('DELETE', `/api/account/members/${membro.user_id}`).status, 200)
  assert.deepEqual(m.responder('GET', '/api/account/members').json, [])
  limpo(membro)
})

test('grupos de transmissao do convidado: lista vazia por padrao, grava nivel e autorizacao da chave, ignora grupo que nao existe', () => {
  const m = novoMock()
  aplicarCenario(m.estado(), 'grupos')
  const [membro] = m.responder('GET', '/api/account/members').json
  const [g] = m.responder('GET', '/api/groups').json
  assert.deepEqual(m.responder('GET', `/api/account/members/${membro.user_id}/groups`).json.groups, [])
  const ok = m.responder('PUT', `/api/account/members/${membro.user_id}/groups`, { groups: [{ group_id: g.id, level: 'editar', youtube_key: true }, { group_id: 9999, level: 'ver', youtube_key: false }] })
  assert.equal(ok.status, 200)
  assert.deepEqual(ok.json.ignored, [9999])
  assert.deepEqual(m.responder('GET', `/api/account/members/${membro.user_id}/groups`).json.groups, [{ group_id: g.id, level: 'editar', youtube_key: true }])
})

test('cameras avulsas do convidado: lista e grava', () => {
  const m = novoMock()
  const [membro] = m.responder('GET', '/api/account/members').json
  assert.deepEqual(m.responder('GET', `/api/account/members/${membro.user_id}/cameras`).json.camera_ids, [])
  assert.equal(m.responder('PUT', `/api/account/members/${membro.user_id}/cameras`, { camera_ids: ['MAADEMO2'] }).status, 200)
  assert.deepEqual(m.responder('GET', `/api/account/members/${membro.user_id}/cameras`).json.camera_ids, ['MAADEMO2'])
})

test('grupos de acesso: "Equipe da loja" com a Entrada e o convidado; criar, editar cameras e pessoas, excluir', () => {
  const m = novoMock()
  const [membro] = m.responder('GET', '/api/account/members').json
  const [g] = m.responder('GET', '/api/access-groups').json
  assert.equal(g.name, 'Equipe da loja')
  assert.deepEqual(g.camera_ids, ['MAADEMO1'])
  assert.deepEqual(g.member_ids, [membro.user_id])

  const criado = m.responder('POST', '/api/access-groups', { name: 'Equipe da obra' })
  assert.equal(criado.status, 200)
  assert.ok(criado.json.id)
  assert.equal(m.responder('PUT', `/api/access-groups/${criado.json.id}/cameras`, { camera_ids: ['MAADEMO2'] }).status, 200)
  assert.equal(m.responder('PUT', `/api/access-groups/${criado.json.id}/members`, { user_ids: [membro.user_id] }).status, 200)
  const lista = m.responder('GET', '/api/access-groups').json
  assert.equal(lista.length, 2)
  assert.deepEqual(lista[1].camera_ids, ['MAADEMO2'])
  assert.equal(m.responder('DELETE', `/api/access-groups/${criado.json.id}`).status, 200)
  assert.equal(m.responder('GET', '/api/access-groups').json.length, 1)
  assert.equal(m.responder('PUT', '/api/access-groups/9999/cameras', { camera_ids: [] }).status, 404)
})

test('dados de cobranca: cadastro ficticio completo, sem aceite; salvar com aceite carimba a data e a versao', () => {
  const m = novoMock()
  const d = m.responder('GET', '/api/billing/info').json
  for (const k of ['tipo', 'nome', 'cpf_cnpj', 'email_cobranca', 'telefone', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'uf']) assert.ok(d[k], k)
  assert.ok(!d.termos_aceite_em, 'comeca sem aceite, para o print mostrar a caixa de aceite')
  assert.equal(m.responder('PUT', '/api/billing/info', { ...d, nome: 'Padaria Exemplo Ltda ME' }).status, 200)
  assert.equal(m.responder('GET', '/api/billing/info').json.nome, 'Padaria Exemplo Ltda ME')
  assert.ok(!m.responder('GET', '/api/billing/info').json.termos_aceite_em)
  m.responder('PUT', '/api/billing/info', { ...d, aceite_termos: true, termos_versao: '1.0' })
  const dep = m.responder('GET', '/api/billing/info').json
  assert.match(dep.termos_aceite_em, /^2026-10-13 /)
  assert.equal(dep.termos_versao, '1.0')
  limpo(d)
})

test('minha conta: dono por padrao; cenario "convidado" preenche owner_id e owner_email; excluir conta com cameras e recusado', () => {
  const m = novoMock()
  assert.equal(m.responder('GET', '/api/me').json.owner_id, null)
  aplicarCenarioConta(m.estado(), 'convidado')
  const me = m.responder('GET', '/api/me').json
  assert.ok(me.owner_id)
  assert.match(me.owner_email, /@exemplo\.com$/)
  const r = m.responder('POST', '/api/account/self-delete', { confirm: 'EXCLUIR' })
  assert.equal(r.status, 409)
  assert.ok(r.json.detail.length > 10)
  assert.throws(() => aplicarCenarioConta(m.estado(), 'outro'), /desconhecido/)
  limpo([me, r.json])
})
