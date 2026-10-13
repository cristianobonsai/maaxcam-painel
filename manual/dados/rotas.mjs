// rotas.mjs - respostas FICTICIAS da API para o capitulo "Primeiros passos" (cliente "Padaria Exemplo").
// Nada aqui pode ser real: a varredura (robo/seguranca.mjs) roda nos testes e na integracao.
import { deflateSync } from 'node:zlib'
import { rotasLote2 } from './rotas-lote2.mjs'

const CLIENTE = {
  user_id: 'demo-cliente',
  email: 'cliente@exemplo.com',
  name: 'Padaria Exemplo',
  is_admin: false,
  owner_id: null,
  can_use_groups: false,
  permissions: {
    can_add_cameras: true, can_edit_cameras: true, can_change_plan: true, can_create_groups: false,
    can_edit_notif: true, can_view_access_logs: true, can_view_drops: true, can_view_uptime: true,
  },
}

const CAMERAS_INICIAIS = [
  { camera_id: 'MAADEMO1', name: 'Entrada', enabled: true, is_streaming: true, youtube_relay_active: false,
    group_name: null, plan: 'pro', location: 'Centro', project: 'Padaria Exemplo', brand: 'Intelbras', cloud: '',
    youtube_key: '', quality_tier: '1080p', stream_key: 'demo-entrada01', playback_id: 'demo-pb-1', lat: -27.5954, lng: -48.548 },
  { camera_id: 'MAADEMO2', name: 'Estacionamento', enabled: true, is_streaming: false, youtube_relay_active: false,
    group_name: null, plan: 'basico', location: 'Centro', project: 'Padaria Exemplo', brand: 'Hikvision', cloud: '',
    youtube_key: '', quality_tier: '1080p', stream_key: 'demo-estac02', playback_id: 'demo-pb-2', lat: -27.5961, lng: -48.5448 },
]

export function estadoInicial() {
  // seguranca: dominios/IPs/tokens por camera; seq: ids deles; cenario: 'atencao' liga o aviso do Dashboard
  // cartao/integracao: configuracao por camera (criada na 1a leitura); monitoramento: 'problemas' | 'duplicada'
  return { cameras: CAMERAS_INICIAIS.map((c) => ({ ...c })), proximo: 3, seguranca: {}, seq: 1, cartao: {}, integracao: {} }
}

const segDe = (estado, id) => (estado.seguranca[id] ||= { domains: [], ips: [], tokens: [] })

// cameras com problema, como o painel mostra no Dashboard (so no cenario 'atencao')
const PROBLEMAS = [
  { camera_id: 'MAADEMO2', name: 'Estacionamento', status_geral: 'fora_do_ar', drops_24h: 0 },
  { camera_id: 'MAADEMO1', name: 'Entrada', status_geral: 'instavel', drops_24h: 7 },
]

const rtmpUrl = (c) => `rtmp://ingest.livebybit.com/live/${c.stream_key}`
const hlsUrl = (c) => `https://play.livebybit.com/v2/hls/${c.playback_id}.m3u8`
const achar = (estado, id) => estado.cameras.find((c) => c.camera_id === id)

// liberacoes do plano: Basico nao tem embed, YouTube, audio nem foto (as telas mostram o cadeado)
const capsDoPlano = (c) => {
  const livre = c.plan !== 'basico'
  return { embed: livre, youtube: livre, audio: livre, snapshot: livre }
}
const NAO_ENCONTRADA = { status: 404, json: { detail: 'Câmera não encontrada' } }
const comCamera = (estado, id, fazer) => { const c = achar(estado, id); return c ? fazer(c) : NAO_ENCONTRADA }

function seguranca(c, estado) {
  const s = segDe(estado, c.camera_id)
  return {
    camera_id: c.camera_id, name: c.name, rtmp_url: rtmpUrl(c), hls_url: hlsUrl(c), stream_privacy: c.stream_privacy || 'public',
    playback_id: c.playback_id, preview_token: '', relay_running: false, youtube_key: c.youtube_key || '',
    tokens: s.tokens.map((t) => ({ ...t })), ips: s.ips.map((i) => ({ ...i })), domains: s.domains.map((d) => ({ ...d })),
    in_group: false, in_active_group: false, has_audio: false, audio_name: '',
    caps: capsDoPlano(c),
  }
}

const CAMPOS_EDITAVEIS = ['name', 'brand', 'cloud', 'project', 'enabled', 'quality_tier', 'plan', 'youtube_key']

// PNG solido (zlib + CRC) para a "foto" da camera: sem imagem real.
function crc32(buf) {
  let c, crc = 0xffffffff
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(tipo, dados) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo), dados])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([len, corpo, crc])
}
export function pngSolido(largura, altura, [r, g, b]) {
  const linha = Buffer.concat([Buffer.from([0]), Buffer.from(Array(largura).fill([r, g, b]).flat())])
  const bruto = Buffer.concat(Array(altura).fill(linha))
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(bruto)), chunk('IEND', Buffer.alloc(0))])
}

const HTML_EMBED = '<!doctype html><html><body style="margin:0;background:#0b1220;color:#94a3b8;display:flex;'
  + 'align-items:center;justify-content:center;height:100vh;font-family:sans-serif">Imagem de exemplo</body></html>'

export function rotas(estado) {
  return [
    { metodo: 'GET', padrao: /^\/api\/me$/, resposta: () => ({ json: CLIENTE }) },
    { metodo: 'GET', padrao: /^\/api\/cameras\?mine=1$/, resposta: () => ({ json: estado.cameras.map((c) => ({ ...c })) }) },
    {
      metodo: 'POST', padrao: /^\/api\/cameras$/,
      resposta: (_m, corpo) => {
        const n = estado.proximo++
        const c = { camera_id: `MAADEMO${n}`, name: (corpo?.name || 'Nova câmera'), enabled: true, is_streaming: false,
          youtube_relay_active: false, group_name: null, plan: corpo?.plan || 'basico', location: '', project: corpo?.project || '',
          brand: corpo?.brand || '', cloud: corpo?.cloud || '', youtube_key: '', lat: null, lng: null, quality_tier: corpo?.quality_tier || '1080p',
          stream_key: `demo-nova${String(n).padStart(2, '0')}`, playback_id: `demo-pb-${n}` }
        estado.cameras.push(c)
        return { json: { camera_id: c.camera_id, name: c.name, stream_key: c.stream_key, rtmp_url: rtmpUrl(c),
          hls_url: `https://play.livebybit.com/hls/${c.stream_key}.m3u8` } }
      },
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: { ...c } })),
    },
    {
      metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        for (const k of CAMPOS_EDITAVEIS) if (corpo && k in corpo) c[k] = corpo[k]
        return { json: { ...c } }
      }),
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/security$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: seguranca(c, estado) })),
    },
    {
      metodo: 'PUT', padrao: /^\/api\/cameras\/([^/?]+)\/security\/privacy$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        c.stream_privacy = corpo?.stream_privacy === 'private' ? 'private' : 'public'
        return { json: { stream_privacy: c.stream_privacy } }
      }),
    },
    {
      metodo: 'POST', padrao: /^\/api\/cameras\/([^/?]+)\/security\/domains$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const d = { id: estado.seq++, domain: String(corpo?.domain || '').trim() }
        segDe(estado, c.camera_id).domains.push(d)
        return { json: d }
      }),
    },
    {
      metodo: 'POST', padrao: /^\/api\/cameras\/([^/?]+)\/security\/ips$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const i = { id: estado.seq++, cidr: String(corpo?.cidr || '').trim(), label: String(corpo?.label || '').trim() }
        segDe(estado, c.camera_id).ips.push(i)
        return { json: i }
      }),
    },
    {
      metodo: 'POST', padrao: /^\/api\/cameras\/([^/?]+)\/security\/tokens$/,
      resposta: (m, corpo) => comCamera(estado, m[1], (c) => {
        const n = estado.seq++
        const t = { id: n, label: String(corpo?.label || '').trim(), token: `demo-tk${String(n).padStart(2, '0')}a1b2c3d4e5f6a7b8` }
        segDe(estado, c.camera_id).tokens.push(t)
        return { json: t }
      }),
    },
    {
      metodo: 'DELETE', padrao: /^\/api\/cameras\/([^/?]+)\/security\/(domains|ips|tokens)\/(\d+)$/,
      resposta: (m) => comCamera(estado, m[1], (c) => {
        const s = segDe(estado, c.camera_id)
        s[m[2]] = s[m[2]].filter((x) => String(x.id) !== m[3])
        return { json: { ok: true } }
      }),
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/caps$/,
      resposta: (m) => comCamera(estado, m[1], (c) => ({ json: capsDoPlano(c) })),
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/snapshot\.jpg/,
      resposta: () => ({ imagem: pngSolido(320, 180, [30, 41, 59]) }),
    },
    { metodo: 'GET', padrao: /^\/api\/groups$/, resposta: () => ({ json: [] }) },
    {
      metodo: 'GET', padrao: /^\/api\/monitoring\?mine=1$/,
      resposta: () => ({ json: estado.cenario === 'atencao' ? PROBLEMAS.map((p) => ({ ...p })) : [] }),
    },
    { metodo: 'GET', padrao: /^\/embed\/[^/?]+/, resposta: () => ({ html: HTML_EMBED }) },
    { metodo: 'POST', padrao: /^\/auth\/v1\/otp(\?.*)?$/, resposta: () => ({ json: {} }) },
    ...rotasLote2(estado, comCamera),
  ]
}
