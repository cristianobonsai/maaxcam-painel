// rotas-lote4.mjs - respostas FICTICIAS do lote 4 do manual: usuarios (convidados, grupos de acesso) e minha conta.
// Nada aqui pode ser real (a varredura de seguranca roda nos testes). E-mails, nomes e enderecos sao inventados.
import { convidadoDe } from './rotas-lote3.mjs'

const PERMISSOES_PADRAO = {
  can_add_cameras: 0, can_edit_cameras: 1, can_change_plan: 0, can_create_groups: 0, can_edit_notif: 1,
  can_view_access_logs: 0, can_view_drops: 1, can_view_uptime: 1,
}
const COBRANCA_PADRAO = {
  tipo: 'PJ', nome: 'Padaria Exemplo Ltda', cpf_cnpj: '12.345.678/0001-90', email_cobranca: 'financeiro@exemplo.com',
  telefone: '(11) 90000-0000', cep: '88000-000', rua: 'Rua das Flores', numero: '123', complemento: 'Sala 2',
  bairro: 'Centro', cidade: 'Florianópolis', uf: 'SC', termos_aceite_em: '', termos_versao: '',
}
const NAO_ENCONTRADO = { status: 404, json: { detail: 'Não encontrado' } }
const OK = { json: { ok: true } }

/** Liga um cenario da tela "Minha conta" (o roteiro chama isto antes de recarregar a tela). */
export function aplicarCenarioConta(estado, nome) {
  if (nome === 'convidado') { estado.me_convidado = true; return }
  throw new Error(`cenario desconhecido: ${nome}`)
}

export function rotasLote4(estado) {
  const convites = () => (estado.convites ||= [{ id: estado.seq++, email: 'novo.colaborador@exemplo.com', status: 'pending' }])
  const membros = () => (estado.membros ||= [{ user_id: convidadoDe(estado).user_id, email: convidadoDe(estado).email, permissions: { ...PERMISSOES_PADRAO } }])
  const gruposAcesso = () => (estado.gruposAcesso ||= [{ id: estado.seq++, name: 'Equipe da loja', camera_ids: ['MAADEMO1'], member_ids: [convidadoDe(estado).user_id] }])
  const niveis = (uid) => ((estado.niveisGrupos ||= {})[uid] ||= [])
  const avulsas = (uid) => ((estado.camAvulsas ||= {})[uid] ||= [])
  const cobranca = () => (estado.cobranca ||= { ...COBRANCA_PADRAO })
  const gAcesso = (id, fazer) => { const g = gruposAcesso().find((x) => String(x.id) === String(id)); return g ? fazer(g) : NAO_ENCONTRADO }

  return [
    // ---- convites ----
    { metodo: 'GET', padrao: /^\/api\/account\/invites$/, resposta: () => ({ json: convites().map((c) => ({ ...c })) }) },
    { metodo: 'POST', padrao: /^\/api\/account\/invites$/,
      resposta: (_m, corpo) => {
        const email = String(corpo?.email || '').trim()
        if (!email) return { status: 422, json: { detail: 'Informe o e-mail.' } }
        if (email === 'ja-tem-conta@exemplo.com') {
          return { status: 409, json: { detail: `O e-mail ${email} já tem conta própria no LiveByBit.` } }
        }
        convites().push({ id: estado.seq++, email, status: 'pending' })
        return OK
      } },
    { metodo: 'DELETE', padrao: /^\/api\/account\/invites\/(\d+)$/,
      resposta: (m) => { estado.convites = convites().filter((c) => String(c.id) !== m[1]); return OK } },

    // ---- convidados ----
    { metodo: 'GET', padrao: /^\/api\/account\/members$/, resposta: () => ({ json: membros().map((x) => ({ ...x, permissions: { ...x.permissions } })) }) },
    { metodo: 'PUT', padrao: /^\/api\/account\/members\/([^/?]+)\/permissions$/,
      resposta: (m, corpo) => {
        const x = membros().find((y) => y.user_id === m[1])
        if (!x) return NAO_ENCONTRADO
        x.permissions = { ...x.permissions, ...(corpo || {}) }
        return OK
      } },
    { metodo: 'DELETE', padrao: /^\/api\/account\/members\/([^/?]+)$/,
      resposta: (m) => { estado.membros = membros().filter((x) => x.user_id !== m[1]); return OK } },
    { metodo: 'GET', padrao: /^\/api\/account\/members\/([^/?]+)\/groups$/, resposta: (m) => ({ json: { groups: niveis(m[1]).map((n) => ({ ...n })) } }) },
    { metodo: 'PUT', padrao: /^\/api\/account\/members\/([^/?]+)\/groups$/,
      resposta: (m, corpo) => {
        const existentes = new Set((estado.grupos || []).map((g) => g.id))
        const itens = Array.isArray(corpo?.groups) ? corpo.groups : []
        estado.niveisGrupos = { ...(estado.niveisGrupos || {}), [m[1]]: itens.filter((i) => existentes.has(i.group_id)).map((i) => ({ group_id: i.group_id, level: i.level, youtube_key: !!i.youtube_key })) }
        return { json: { ok: true, ignored: itens.filter((i) => !existentes.has(i.group_id)).map((i) => i.group_id) } }
      } },
    { metodo: 'GET', padrao: /^\/api\/account\/members\/([^/?]+)\/cameras$/, resposta: (m) => ({ json: { camera_ids: [...avulsas(m[1])] } }) },
    { metodo: 'PUT', padrao: /^\/api\/account\/members\/([^/?]+)\/cameras$/,
      resposta: (m, corpo) => { (estado.camAvulsas ||= {})[m[1]] = Array.isArray(corpo?.camera_ids) ? [...corpo.camera_ids] : []; return OK } },

    // ---- grupos de acesso ----
    { metodo: 'GET', padrao: /^\/api\/access-groups$/, resposta: () => ({ json: gruposAcesso().map((g) => ({ ...g, camera_ids: [...g.camera_ids], member_ids: [...g.member_ids] })) }) },
    { metodo: 'POST', padrao: /^\/api\/access-groups$/,
      resposta: (_m, corpo) => {
        const g = { id: estado.seq++, name: String(corpo?.name || 'Novo grupo'), camera_ids: [], member_ids: [] }
        gruposAcesso().push(g)
        return { json: { id: g.id, name: g.name } }
      } },
    { metodo: 'PUT', padrao: /^\/api\/access-groups\/(\d+)\/cameras$/,
      resposta: (m, corpo) => gAcesso(m[1], (g) => { g.camera_ids = Array.isArray(corpo?.camera_ids) ? [...corpo.camera_ids] : []; return OK }) },
    { metodo: 'PUT', padrao: /^\/api\/access-groups\/(\d+)\/members$/,
      resposta: (m, corpo) => gAcesso(m[1], (g) => { g.member_ids = Array.isArray(corpo?.user_ids) ? [...corpo.user_ids] : []; return OK }) },
    { metodo: 'DELETE', padrao: /^\/api\/access-groups\/(\d+)$/,
      resposta: (m) => gAcesso(m[1], (g) => { estado.gruposAcesso = gruposAcesso().filter((x) => x !== g); return OK }) },

    // ---- minha conta ----
    { metodo: 'GET', padrao: /^\/api\/billing\/info$/, resposta: () => ({ json: { ...cobranca() } }) },
    { metodo: 'PUT', padrao: /^\/api\/billing\/info$/,
      resposta: (_m, corpo) => {
        const { aceite_termos, ...resto } = corpo || {}
        Object.assign(cobranca(), resto)
        if (aceite_termos) { cobranca().termos_aceite_em = '2026-10-13 10:00:00'; cobranca().termos_versao = corpo.termos_versao || '1.0' }
        return OK
      } },
    { metodo: 'POST', padrao: /^\/api\/account\/self-delete$/,
      resposta: () => ({ status: 409, json: { detail: 'Não é possível excluir a conta com câmeras cadastradas. Exclua as câmeras e cancele o plano antes.' } }) },
  ]
}
