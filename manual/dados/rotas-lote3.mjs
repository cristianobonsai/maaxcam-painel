// rotas-lote3.mjs - respostas FICTICIAS do lote 3 do manual: grupos de transmissao, notificacoes, relatorios e faturamento.
// Nada aqui pode ser real (a varredura de seguranca roda nos testes). Nomes, e-mails e IPs sao inventados.

const PRECO = { basico: 9.9, pro: 29.9, premium: 32.9 }
const PRECO_GRUPO = 59.9
const arredondar = (v) => Math.round(v * 100) / 100

const PLANO_PADRAO_NOTIF = {
  enabled: true, notify_on_return: true, daily_summary: false, daily_time: '08:00',
  off_delay_minutes: 3, off_delay_2_minutes: 0, email_enabled: false, email_to: '',
}
const EXTRA_PADRAO = { quiet_hours_enabled: false, quiet_start: '22:00', quiet_end: '07:00' }

/** Liga um cenario no estado do mock (o roteiro chama isto antes de recarregar a tela). */
export function aplicarCenario(estado, nome) {
  if (nome === 'grupos') {
    estado.grupos_ativos = true
    for (const c of estado.cameras) c.plan = 'premium'
    if (!estado.cameras.some((c) => c.camera_id === 'MAADEMO3')) {
      estado.cameras.push({
        camera_id: 'MAADEMO3', name: 'Balcão', enabled: true, is_streaming: true, youtube_relay_active: false,
        group_name: null, plan: 'premium', location: 'Centro', project: 'Padaria Exemplo', brand: 'Intelbras', cloud: '',
        youtube_key: '', quality_tier: '1080p', stream_key: 'demo-balcao03', playback_id: 'demo-pb-3', lat: -27.5949, lng: -48.547,
      })
      estado.proximo = Math.max(estado.proximo, 4)
    }
    const id = estado.seq++
    estado.grupos = [{
      id, name: 'Praças do Centro', enabled: false, relay_active: false, transition_seconds: 5, resolution_tier: '1080p',
      has_youtube_key: true, audio_file: null, status: 'ok', health_active: false,
      membros: [
        { id: estado.seq++, camera_id: 'MAADEMO1', duration_seconds: 6, order_index: 1, cartao: true },
        { id: estado.seq++, camera_id: 'MAADEMO2', duration_seconds: 6, order_index: 2, cartao: false },
      ],
    }]
    for (const c of estado.cameras) if (['MAADEMO1', 'MAADEMO2'].includes(c.camera_id)) c.group_name = 'Praças do Centro'
    return
  }
  if (nome === 'grupo-no-ar') {
    const g = estado.grupos?.[0]
    if (!g) throw new Error('cenario "grupo-no-ar" precisa do cenario "grupos" antes')
    Object.assign(g, { enabled: true, relay_active: true, status: 'degradado', health_active: true, audio_file: '/audio_uploads/vinheta-da-loja.mp3' })
    g.membros[0].health = 'ok'
    Object.assign(g.membros[1], { health: 'instavel', health_reason: 'Quedas frequentes na última hora', health_returns_in_s: 720 })
    return
  }
  if (nome === 'telegram') { estado.telegram_conectado = true; return }
  throw new Error(`cenario desconhecido: ${nome}`)
}

function grupoJson(estado, g) {
  return {
    id: g.id, name: g.name, enabled: g.enabled, relay_active: g.relay_active, transition_seconds: g.transition_seconds,
    resolution_tier: g.resolution_tier, has_youtube_key: g.has_youtube_key, audio_file: g.audio_file,
    status: g.status, health_active: g.health_active, paused_reason: null,
    cameras: g.membros.map((m) => {
      const c = estado.cameras.find((x) => x.camera_id === m.camera_id)
      return {
        id: m.id, camera_id: m.camera_id, camera_name: c?.name || m.camera_id, duration_seconds: m.duration_seconds,
        order_index: m.order_index, card_video_path: m.cartao ? `/cards/${m.camera_id}.ts` : null,
        card_enabled: !!m.cartao, card_duration_seconds: 5,
        health: m.health || 'ok', health_reason: m.health_reason ?? null, health_returns_in_s: m.health_returns_in_s ?? null,
        online: c ? c.is_streaming !== false : true, visible: true,
      }
    }),
  }
}

/** O convidado ficticio (um so), compartilhado com as telas de Usuarios do lote 4. */
export function convidadoDe(estado) {
  return (estado.convidado ||= {
    user_id: 'demo-convidado', email: 'funcionario@exemplo.com', enabled: true, via_email: true, via_telegram: false,
    telegram_linked: false, scope: [{ type: 'group', id: '1' }],
  })
}

const NOME_CAMERAS = { MAADEMO1: 'Entrada', MAADEMO2: 'Estacionamento', MAADEMO3: 'Balcão' }

/**
 * @param estado estado do mock
 * @param comCamera (estado, id, fazer) => resposta  (404 se a camera nao existe)
 */
export function rotasLote3(estado, comCamera) {
  const NAO_ENCONTRADO = { status: 404, json: { detail: 'Não encontrado' } }
  const grupo = (id) => (estado.grupos || []).find((g) => String(g.id) === String(id))
  const comGrupo = (id, fazer) => { const g = grupo(id); return g ? fazer(g) : NAO_ENCONTRADO }
  const notif = () => (estado.notif ||= { ...PLANO_PADRAO_NOTIF })
  const extra = () => (estado.notifExtra ||= { ...EXTRA_PADRAO })
  const convidado = () => convidadoDe(estado)

  return [
    { metodo: 'GET', padrao: /^\/api\/cameras$/, resposta: () => ({ json: estado.cameras.map((c) => ({ ...c })) }) },

    // ---- grupos de transmissao ----
    { metodo: 'GET', padrao: /^\/api\/groups$/, resposta: () => ({ json: (estado.grupos || []).map((g) => grupoJson(estado, g)) }) },
    { metodo: 'POST', padrao: /^\/api\/groups$/,
      resposta: (_m, corpo) => {
        const g = {
          id: estado.seq++, name: String(corpo?.name || 'Novo grupo'), enabled: false, relay_active: false,
          transition_seconds: Number(corpo?.transition_seconds) || 5, resolution_tier: corpo?.resolution_tier || '1080p',
          has_youtube_key: !!corpo?.youtube_key, audio_file: null, status: 'ok', health_active: false, membros: [],
        }
        ;(estado.grupos ||= []).push(g)
        return { json: grupoJson(estado, g) }
      } },
    { metodo: 'PUT', padrao: /^\/api\/groups\/(\d+)$/,
      resposta: (m, corpo) => comGrupo(m[1], (g) => {
        if (corpo?.name !== undefined) g.name = String(corpo.name)
        if (corpo?.transition_seconds !== undefined) g.transition_seconds = Number(corpo.transition_seconds)
        if (corpo?.enabled !== undefined) g.enabled = !!corpo.enabled
        if (corpo?.youtube_key) g.has_youtube_key = true
        return { json: grupoJson(estado, g) }
      }) },
    { metodo: 'DELETE', padrao: /^\/api\/groups\/(\d+)$/,
      resposta: (m) => comGrupo(m[1], (g) => { estado.grupos = estado.grupos.filter((x) => x !== g); return { json: { ok: true } } }) },
    { metodo: 'POST', padrao: /^\/api\/groups\/(\d+)\/relay\/(start|stop|restart)$/,
      resposta: (m) => comGrupo(m[1], (g) => {
        if (m[2] === 'start') { g.relay_active = true; g.enabled = true }
        if (m[2] === 'stop') g.relay_active = false
        return { json: { ok: true } }
      }) },
    { metodo: 'POST', padrao: /^\/api\/groups\/(\d+)\/cameras$/,
      resposta: (m, corpo) => comGrupo(m[1], (g) => {
        if (!estado.cameras.some((c) => c.camera_id === corpo?.camera_id)) return NAO_ENCONTRADO
        const membro = { id: estado.seq++, camera_id: corpo.camera_id, duration_seconds: Number(corpo.duration_seconds) || 6, order_index: g.membros.length + 1, cartao: false }
        g.membros.push(membro)
        return { json: { ok: true, id: membro.id } }
      }) },
    { metodo: 'PUT', padrao: /^\/api\/groups\/(\d+)\/cameras\/(\d+)$/,
      resposta: (m, corpo) => comGrupo(m[1], (g) => {
        const membro = g.membros.find((x) => String(x.id) === m[2])
        if (!membro) return NAO_ENCONTRADO
        if (corpo?.duration_seconds !== undefined) membro.duration_seconds = Number(corpo.duration_seconds)
        if (corpo?.order_index !== undefined) membro.order_index = Number(corpo.order_index)
        return { json: { ok: true } }
      }) },
    { metodo: 'DELETE', padrao: /^\/api\/groups\/(\d+)\/cameras\/(\d+)$/,
      resposta: (m) => comGrupo(m[1], (g) => { g.membros = g.membros.filter((x) => String(x.id) !== m[2]); return { json: { ok: true } } }) },

    // ---- notificacoes ----
    { metodo: 'GET', padrao: /^\/api\/notifications$/, resposta: () => ({ json: { ...notif() } }) },
    { metodo: 'PUT', padrao: /^\/api\/notifications$/, resposta: (_m, corpo) => { Object.assign(notif(), corpo || {}); return { json: { ok: true } } } },
    { metodo: 'GET', padrao: /^\/api\/notifications\/extra$/,
      resposta: () => ({ json: {
        ...extra(), connected: !!estado.telegram_conectado,
        chat_id: estado.telegram_conectado ? '123456789' : '', bot_username: estado.telegram_conectado ? 'exemplo_bot' : '',
      } }) },
    { metodo: 'PUT', padrao: /^\/api\/notifications\/extra$/, resposta: (_m, corpo) => { Object.assign(extra(), corpo || {}); return { json: { ok: true } } } },
    { metodo: 'GET', padrao: /^\/api\/notifications\/telegram\/link$/,
      resposta: () => ({ json: { deep_link: 'https://t.me/exemplo_bot?start=demo-0001', link_code: 'DEMO-0001' } }) },
    { metodo: 'POST', padrao: /^\/api\/notifications\/test$/, resposta: () => ({ json: { ok: true } }) },
    { metodo: 'POST', padrao: /^\/api\/notifications\/disconnect$/, resposta: () => { estado.telegram_conectado = false; return { json: { ok: true } } } },
    { metodo: 'GET', padrao: /^\/api\/notifications\/guests$/, resposta: () => ({ json: { guests: [{ ...convidado() }] } }) },
    { metodo: 'PUT', padrao: /^\/api\/notifications\/guests\/([^/?]+)$/,
      resposta: (_m, corpo) => { Object.assign(convidado(), corpo || {}); return { json: { ok: true } } } },
    // os grupos de acesso (/api/access-groups) ficam em rotas-lote4.mjs

    // ---- relatorios ----
    { metodo: 'GET', padrao: /^\/api\/reports\/uptime\?/,
      resposta: () => ({ json: { coletando_desde: '06/10/2026', cameras: [
        { camera_id: 'MAADEMO1', nome: 'Entrada', pct_online: 99.2, horas_online: 166.7, horas_offline: 1.3 },
        { camera_id: 'MAADEMO2', nome: 'Estacionamento', pct_online: 91.5, horas_online: 153.7, horas_offline: 14.3 },
      ] } }) },
    { metodo: 'GET', padrao: /^\/api\/reports\/uptime\/periodo\?(.*)$/,
      resposta: (m) => {
        const q = new URLSearchParams(m[1])
        return { json: { data_inicio: q.get('data_inicio'), data_fim: q.get('data_fim'), coletando_desde: '06/10/2026', cameras: [
          { camera_id: 'MAADEMO1', nome: 'Entrada', maior_queda_seg: 4500, maior_queda_fmt: '1h 15min' },
          { camera_id: 'MAADEMO2', nome: 'Estacionamento', maior_queda_seg: 5 * 86400 + 7200, maior_queda_fmt: '5d 2h' },
        ] } }
      } },
    { metodo: 'GET', padrao: /^\/api\/reports\/drops\?/,
      resposta: () => ({ json: { dias: 7, total_quedas: 5, cameras: [
        { camera_id: 'MAADEMO2', nome: 'Estacionamento', quedas: 4, ultima_queda: '12/10/2026 22:41' },
        { camera_id: 'MAADEMO1', nome: 'Entrada', quedas: 1, ultima_queda: '09/10/2026 14:05' },
      ] } }) },
    { metodo: 'GET', padrao: /^\/api\/reports\/drops\/([^/?]+)\/periodo\?(.*)$/,
      resposta: (m) => {
        const q = new URLSearchParams(m[2])
        return { json: {
          nome: NOME_CAMERAS[m[1]] || m[1], data_inicio: q.get('data_inicio'), data_fim: q.get('data_fim'),
          coletando_desde: '06/10/2026', total_quedas: 3, total_offline_fmt: '2h 40min',
          quedas: [
            { caiu: '07/10/2026 08:12', voltou: '07/10/2026 08:57', ainda_offline: false, duracao_fmt: '45min' },
            { caiu: '09/10/2026 14:05', voltou: '09/10/2026 15:20', ainda_offline: false, duracao_fmt: '1h 15min' },
            { caiu: '12/10/2026 22:41', voltou: '12/10/2026 23:21', ainda_offline: false, duracao_fmt: '40min' },
          ],
        } }
      } },
    { metodo: 'GET', padrao: /^\/api\/reports\/drops\/([^/?]+)\?/,
      resposta: (m) => {
        const todas = { MAADEMO2: ['12/10/2026 22:41', '11/10/2026 03:18', '09/10/2026 14:05', '07/10/2026 08:12'], MAADEMO1: ['09/10/2026 14:05'] }[m[1]] || []
        return { json: { total: todas.length, quedas: todas.map((quando) => ({ quando })) } }
      } },
    { metodo: 'GET', padrao: /^\/api\/reports\/access-logs\?/,
      resposta: () => ({ json: { dias: 7, total: 3, logins: [
        { email: 'cliente@exemplo.com', ip: '203.0.113.21', quando: '13/10/2026 09:02' },
        { email: 'funcionario@exemplo.com', ip: '203.0.113.34', quando: '12/10/2026 17:48' },
        { email: 'cliente@exemplo.com', ip: '203.0.113.21', quando: '10/10/2026 08:15' },
      ] } }) },
    { metodo: 'GET', padrao: /^\/api\/reports\/access\/periodo\?(.*)$/,
      resposta: (m) => {
        const q = new URLSearchParams(m[1])
        const logins = [
          { email: 'cliente@exemplo.com', ip: '203.0.113.21', quando: '10/10/2026 08:15' },
          { email: 'funcionario@exemplo.com', ip: '203.0.113.34', quando: '12/10/2026 17:48' },
        ]
        return { json: { data_inicio: q.get('data_inicio'), data_fim: q.get('data_fim'), total: logins.length, logins } }
      } },

    // ---- faturamento ----
    { metodo: 'GET', padrao: /^\/api\/billing\/summary$/,
      resposta: () => {
        const contagem = {}
        for (const c of estado.cameras) contagem[c.plan || 'basico'] = (contagem[c.plan || 'basico'] || 0) + 1
        const itens = ['basico', 'pro', 'premium'].filter((p) => contagem[p]).map((p) => ({
          plan: p, quantidade: contagem[p], preco_unitario: PRECO[p], preco_cheio: PRECO[p], subtotal: arredondar(contagem[p] * PRECO[p]),
        }))
        const grupos = (estado.grupos || []).map((g) => ({ id: g.id, name: g.name, preco: PRECO_GRUPO, preco_cheio: PRECO_GRUPO }))
        const total = arredondar(itens.reduce((s, i) => s + i.subtotal, 0) + grupos.reduce((s, g) => s + g.preco, 0))
        return { json: { itens_por_plano: itens, groups_addon: !!estado.grupos_ativos, grupos, total_geral: total } }
      } },
  ]
}
