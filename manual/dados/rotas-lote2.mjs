// rotas-lote2.mjs - respostas FICTICIAS do lote 2 do manual: localizacao/mapa, monitoramento, cartoes e integracao.
// Nada aqui pode ser real (a varredura de seguranca roda nos testes). Enderecos, IPs e codigos sao inventados.

const ENDERECOS = [
  { label: 'Rua Exemplo, 100 - Centro, Florianópolis - SC', lat: -27.5954, lng: -48.548 },
  { label: 'Rua Exemplo, 250 - Centro, Florianópolis - SC', lat: -27.5961, lng: -48.5448 },
  { label: 'Avenida Exemplo, 15 - Centro, Florianópolis - SC', lat: -27.5938, lng: -48.5502 },
]

const TS_EXEMPLO = Date.UTC(2026, 9, 13, 13, 15) / 1000      // 13/10/2026 10:15 (Brasilia)

const TS_SILENCIO_ATE = Date.UTC(2026, 9, 20, 13, 15) / 1000   // 20/10/2026 10:15 (Brasilia): "silenciar 7 dias" no print

/** Resposta de `notice` (avisos da camera) para cada modo: off | 7d | sempre. Sempre pode editar (dono da conta). */
function avisoPublico(modo) {
  return { mode: modo, muted_until: modo === '7d' ? TS_SILENCIO_ATE : null, muted_forever: modo === 'sempre', can_edit: true }
}

// "O que costuma resolver" do bloco `chronic` (mesmo texto que o servidor devolve)
const CRONICA_CONFERIR = ['Conferir o roteador e o cabo de rede da câmera', 'Trocar o Wi-Fi por cabo, se for o caso',
  'Ver se a internet do local cai nesses horários', 'Atualizar o firmware do equipamento']

function monitoramento(c, cenario, aviso = 'off', resumoLigado = true) {
  const no_ar = !!c.is_streaming
  const m = {
    tipo: c.youtube_key ? 'youtube' : 'hls',
    conexao: no_ar ? 'conectada' : 'sem_sinal',
    estabilidade: 'estavel', drops_24h: 0,
    saida: no_ar ? 'publicando' : '—',
    ajustes: 'ok',
    resolucao: no_ar ? '1920x1080' : null, fps: no_ar ? 15 : null,
    bitrate_kbps: no_ar ? 2048 : null, keyframe_s: no_ar ? 2 : null, codec: no_ar ? 'H.264' : null,
    health_active: false,
    notice: avisoPublico(aviso),
  }
  if (cenario === 'problemas') {
    Object.assign(m, { estabilidade: 'instavel', drops_24h: 7, ajustes: 'ajustar',
      ajustes_motivo: 'Intervalo entre quadros-chave de 5 s (o ideal é cerca de 2 s)', keyframe_s: 5 })
  }
  if (cenario === 'duplicada') {
    m.ingest = { duplicate: true, ip_blocked: '203.0.113.7', since_ts: TS_EXEMPLO, attempts: 12 }
  }
  if (cenario === 'cronica' || cenario === 'cronica-economico') {
    m.chronic = { level: cenario === 'cronica' ? 'cuidado' : 'economico', drops_week: 38, days_bad: 6,
      what_to_check: CRONICA_CONFERIR, economy: cenario === 'cronica-economico', summary_on: resumoLigado, can_edit: true }
  }
  return m
}

// ---------- cartoes ----------
const TEXTO = (extra) => ({ type: 'text', style: { font: 'regular', font_family: 'dejavu', size: 40, color: '#FFFFFF', align: 'left' }, ...extra })

function cartaoPadrao(c) {
  return {
    items_intro: [
      TEXTO({ mode: 'fixed', content: c.project || 'Padaria Exemplo', style: { font: 'bold', font_family: 'montserrat', size: 72, color: '#FFFFFF', align: 'left' }, position: { x: 5, y: 72 } }),
      TEXTO({ mode: 'dynamic', source: 'camera_name', style: { font: 'regular', font_family: 'dejavu', size: 44, color: '#FDE68A', align: 'left' }, position: { x: 5, y: 86 } }),
      TEXTO({ mode: 'dynamic', source: 'datetime', style: { font: 'regular', font_family: 'dejavu', size: 36, color: '#FFFFFF', align: 'right' }, position: { x: 95, y: 6 } }),
    ],
    items_offline: [
      TEXTO({ mode: 'dynamic', source: 'camera_status', style: { font: 'bold', font_family: 'montserrat', size: 80, color: '#FFFFFF', align: 'center' }, position: { x: 50, y: 40 } }),
      TEXTO({ mode: 'fixed', content: 'Voltamos em breve', style: { font: 'regular', font_family: 'dejavu', size: 48, color: '#FDE68A', align: 'center' }, position: { x: 50, y: 58 } }),
    ],
    card_duration_seconds: 5, card_offline_timeout_minutes: 30,
    card_intro_use_snapshot: false, card_offline_use_snapshot: true,
    card_enabled: true, card_video_path: `/cards/${c.camera_id}.ts`, card_image_path: `/cards/${c.camera_id}.jpg`,
    card_offline_video_exists: true, card_offline_live_enabled: false,
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function textoDoItem(item, camera) {
  if (item.mode !== 'dynamic') return item.content || ''
  if (item.source === 'camera_name') return camera.name
  if (item.source === 'datetime') return '13/10/2026 10:30'
  if (item.source === 'camera_status') return 'Câmera offline'
  return ''
}

/** Imagem fictícia do cartao (SVG): fundo liso + os itens nas posicoes (%) configuradas. */
export function svgCartao(camera, tipo, items) {
  const W = 1280, H = 720
  const ancora = { left: 'start', center: 'middle', right: 'end' }
  const fundo = tipo === 'offline' ? ['#0f172a', '#334155'] : ['#082f49', '#0e7490']
  const textos = (items || []).filter((i) => i.type === 'text').map((i) => {
    const p = i.position || { x: 5, y: 5 }
    const st = i.style || {}
    return `<text x="${Math.round((p.x / 100) * W)}" y="${Math.round((p.y / 100) * H)}" fill="${esc(st.color || '#FFFFFF')}" `
      + `font-family="DejaVu Sans, Verdana, sans-serif" font-size="${Math.round(((st.size || 32) * H) / 1080)}" `
      + `font-weight="${st.font === 'bold' ? 700 : 400}" text-anchor="${ancora[st.align] || 'start'}" dominant-baseline="hanging">${esc(textoDoItem(i, camera))}</text>`
  })
  const imagens = (items || []).filter((i) => i.type === 'image').map((i) => {
    const p = i.position || { x: 5, y: 5 }
    return `<rect x="${Math.round((p.x / 100) * W)}" y="${Math.round((p.y / 100) * H)}" width="${Math.round(((i.width_pct || 15) / 100) * W)}" height="80" rx="10" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width="3"/>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fundo[0]}"/><stop offset="1" stop-color="${fundo[1]}"/></linearGradient></defs>`
    + `<rect width="${W}" height="${H}" fill="url(#g)"/>${imagens.join('')}${textos.join('')}</svg>`
}

// ---------- integracao ----------
const MODELOS = [
  { value: 'hikvision_ids_tcm403bi', label: 'Hikvision iDS-TCM403-BI' },
  { value: 'hikvision_ids_2cd7a26g0_p_izhs', label: 'Hikvision iDS-2CD7A26G0/P-IZHS' },
]

function integracaoPadrao(c) {
  return {
    enabled: true, ambiente: 'sandbox', tipo_reconhecimento: 'interno', modelo_camera: 'hikvision_ids_tcm403bi',
    device_id_sandbox: 'CAM000000001', device_id_producao: '', device_id_qa_externo: 'CAM000000002', device_id_producao_externo: '',
    has_api_key_sandbox: true, has_api_key_producao: false,
    horario_modo: 'comercial', horario_inicio: '07:00', horario_fim: '18:30',
    sftp_host: '203.0.113.10', sftp_port: 2222, sftp_usuario: 'cam_maademo1', sftp_senha: 'demo-senha-0001',
    webhook_url: `http://api.livebybit.com/api/carbigdata/webhook-externo/${c.camera_id}/demo-token-0001`,
    mac_travado: '00:00:5E:00:53:01',
    ultimo_envio_em: '13/10/2026 10:41:07', ultimo_envio_status: 'ok',
    modelos_homologados: MODELOS,
  }
}

const CAMPOS_INTEGRACAO = ['enabled', 'ambiente', 'tipo_reconhecimento', 'modelo_camera', 'device_id_sandbox', 'device_id_producao',
  'device_id_qa_externo', 'device_id_producao_externo', 'horario_modo', 'horario_inicio', 'horario_fim']

/**
 * @param estado estado do mock (cameras, cartao, carbigdata, monitoramento...)
 * @param comCamera (estado, id, fazer) => resposta  (404 se a camera nao existe)
 */
export function rotasLote2(estado, comCamera) {
  const cartaoDe = (c) => (estado.cartao[c.camera_id] ||= cartaoPadrao(c))
  const integracaoDe = (c) => (estado.integracao[c.camera_id] ||= integracaoPadrao(c))
  return [
    // localizacao e mapa
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/location$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: { location: c.location || '', lat: c.lat ?? null, lng: c.lng ?? null } })) },
    { metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/location$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        c.location = String(corpo?.location ?? c.location ?? '')
        c.lat = corpo?.lat ?? null
        c.lng = corpo?.lng ?? null
        return { json: { ok: true } }
      }) },
    { metodo: 'GET', padrao: /^\/api\/map\/coords$/,
      resposta: () => ({ json: Object.fromEntries(estado.cameras.filter((c) => c.lat != null && c.lng != null).map((c) => [c.camera_id, { lat: c.lat, lng: c.lng }])) }) },
    { metodo: 'GET', padrao: /^\/api\/geocode\?/, resposta: () => ({ json: ENDERECOS.map((e) => ({ ...e })) }) },
    { metodo: 'GET', padrao: /^\/api\/reverse-geocode\?/,
      resposta: () => ({ json: { label: ENDERECOS[0].label, display_name: ENDERECOS[0].label } }) },

    // monitoramento
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/monitoring$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: monitoramento(c, estado.monitoramento, (estado.avisos ||= {})[c.camera_id] || 'off',
        (estado.resumoCronica ||= {})[c.camera_id] !== false) })) },
    // resumo semanal da camera cronica (parar / retomar)
    { metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/chronic-summary$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        (estado.resumoCronica ||= {})[c.camera_id] = corpo?.on !== false
        return { json: { summary_on: corpo?.on !== false } }
      }) },
    // avisos da camera (silenciar / reativar)
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/notice$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: avisoPublico((estado.avisos ||= {})[c.camera_id] || 'off') })) },
    { metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/notice$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const modo = ['7d', 'sempre', 'off'].includes(corpo?.mode) ? corpo.mode : 'off';
        (estado.avisos ||= {})[c.camera_id] = modo
        return { json: avisoPublico(modo) }
      }) },

    // cartoes
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/card$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: JSON.parse(JSON.stringify(cartaoDe(c))) })) },
    { metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/card\/items$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const cart = cartaoDe(c)
        const tipo = corpo?.card_type === 'offline' ? 'offline' : 'intro'
        cart[`items_${tipo}`] = Array.isArray(corpo?.items) ? corpo.items : []
        cart[`card_${tipo}_use_snapshot`] = !!corpo?.use_snapshot_bg
        if (tipo === 'intro' && corpo?.duration_seconds) cart.card_duration_seconds = Number(corpo.duration_seconds)
        if (tipo === 'offline' && corpo?.offline_timeout_minutes) cart.card_offline_timeout_minutes = Number(corpo.offline_timeout_minutes)
        return { json: { ok: true } }
      }) },
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/card\/preview(\?.*)?$/,
      resposta: (m) => comCamera(estado, m[1], (c) => {
        const tipo = /card_type=offline/.test(m[2] || '') ? 'offline' : 'intro'
        return { svg: svgCartao(c, tipo, cartaoDe(c)[`items_${tipo}`]) }
      }) },

    // integracao
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/carbigdata$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: { ...integracaoDe(c), lat: c.lat ?? null, lng: c.lng ?? null } })) },
    { metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/carbigdata$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const cfg = integracaoDe(c)
        for (const k of CAMPOS_INTEGRACAO) if (corpo && k in corpo) cfg[k] = corpo[k]
        if (corpo?.api_key_sandbox) cfg.has_api_key_sandbox = true
        if (corpo?.api_key_producao) cfg.has_api_key_producao = true
        return { json: { ok: true } }
      }) },
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/carbigdata\/capturas(\?.*)?$/,
      resposta: (m) => comCamera(estado, m[1], () => ({ json: { total: 0, items: [] } })) },
  ]
}
