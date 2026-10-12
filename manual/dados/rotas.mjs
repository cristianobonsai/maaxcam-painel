// rotas.mjs - respostas FICTICIAS da API para o capitulo "Primeiros passos" (cliente "Padaria Exemplo").
// Nada aqui pode ser real: a varredura (robo/seguranca.mjs) roda nos testes e na integracao.
import { deflateSync } from 'node:zlib'

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
    youtube_key: '', quality_tier: '1080p', stream_key: 'demo-entrada01', playback_id: 'demo-pb-1' },
  { camera_id: 'MAADEMO2', name: 'Estacionamento', enabled: true, is_streaming: false, youtube_relay_active: false,
    group_name: null, plan: 'basico', location: 'Centro', project: 'Padaria Exemplo', brand: 'Hikvision', cloud: '',
    youtube_key: '', quality_tier: '1080p', stream_key: 'demo-estac02', playback_id: 'demo-pb-2' },
]

export function estadoInicial() {
  return { cameras: CAMERAS_INICIAIS.map((c) => ({ ...c })), proximo: 3 }
}

const rtmpUrl = (c) => `rtmp://ingest.livebybit.com/live/${c.stream_key}`
const hlsUrl = (c) => `https://play.livebybit.com/v2/hls/${c.playback_id}.m3u8`
const achar = (estado, id) => estado.cameras.find((c) => c.camera_id === id)

const CAPS = { embed: true, youtube: true, audio: true, snapshot: true }

function seguranca(c) {
  return {
    camera_id: c.camera_id, name: c.name, rtmp_url: rtmpUrl(c), hls_url: hlsUrl(c), stream_privacy: 'public',
    playback_id: c.playback_id, preview_token: '', relay_running: false, youtube_key: c.youtube_key || '',
    tokens: [], ips: [], domains: [], in_group: false, in_active_group: false, has_audio: false, audio_name: '',
    caps: CAPS,
  }
}

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
          brand: corpo?.brand || '', cloud: corpo?.cloud || '', youtube_key: '', quality_tier: corpo?.quality_tier || '1080p',
          stream_key: `demo-nova${String(n).padStart(2, '0')}`, playback_id: `demo-pb-${n}` }
        estado.cameras.push(c)
        return { json: { camera_id: c.camera_id, name: c.name, stream_key: c.stream_key, rtmp_url: rtmpUrl(c),
          hls_url: `https://play.livebybit.com/hls/${c.stream_key}.m3u8` } }
      },
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)$/,
      resposta: (m) => ({ json: { ...achar(estado, m[1]) } }),
    },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/security$/,
      resposta: (m) => ({ json: seguranca(achar(estado, m[1])) }),
    },
    { metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/caps$/, resposta: () => ({ json: CAPS }) },
    {
      metodo: 'GET', padrao: /^\/api\/cameras\/([^/?]+)\/snapshot\.jpg/,
      resposta: () => ({ imagem: pngSolido(320, 180, [30, 41, 59]) }),
    },
    { metodo: 'GET', padrao: /^\/api\/groups$/, resposta: () => ({ json: [] }) },
    { metodo: 'GET', padrao: /^\/api\/monitoring\?mine=1$/, resposta: () => ({ json: [] }) },
    { metodo: 'GET', padrao: /^\/embed\/[^/?]+/, resposta: () => ({ html: HTML_EMBED }) },
    { metodo: 'POST', padrao: /^\/auth\/v1\/otp(\?.*)?$/, resposta: () => ({ json: {} }) },
  ]
}
