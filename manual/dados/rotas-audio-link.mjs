// rotas-audio-link.mjs - respostas FICTICIAS do "Áudio ao vivo por link" (câmera e grupo) para o robô do Manual.
// Nada aqui pode ser real (a varredura de seguranca roda nos testes): o endereço é de exemplo e o selo é inventado.

const TS_LINK = Date.UTC(2026, 9, 27, 13, 5) / 1000      // 27/10/2026 10:05 (Brasilia)

const vazio = () => ({ has_link: false, url_masked: '', fallback: 'silencio', state: 'indisponivel', since: null, codec: null, kbps: null, fallback_active: false })

export function rotasAudioLink(estado) {
  if (!estado.audio_link) estado.audio_link = { camera: vazio(), group: vazio() }
  const chave = (m) => (m[1] === 'cameras' ? 'camera' : 'group')
  return [
    { metodo: 'GET', padrao: /^\/api\/(cameras|groups)\/[^/?]+\/audio-link$/, resposta: (m) => ({ json: estado.audio_link[chave(m)] }) },
    { metodo: 'PUT', padrao: /^\/api\/(cameras|groups)\/[^/?]+\/audio-link$/,
      resposta: (m, corpo) => {
        const k = chave(m)
        estado.audio_link[k] = { has_link: true, url_masked: 'https://radio.exemplo.com/ao-vivo', fallback: corpo?.fallback || 'silencio',
          state: 'no_ar', since: TS_LINK, codec: 'mp3', kbps: 128, fallback_active: false }
        return { json: estado.audio_link[k] }
      } },
    { metodo: 'DELETE', padrao: /^\/api\/(cameras|groups)\/[^/?]+\/audio-link$/,
      resposta: (m) => { estado.audio_link[chave(m)] = vazio(); return { json: estado.audio_link[chave(m)] } } },
    { metodo: 'POST', padrao: /^\/api\/audio-link\/test$/,
      resposta: () => ({ json: { ok: true, motivo: '', mensagem: 'O link respondeu com áudio.', content_type: 'audio/mpeg', codec: 'mp3', kbps: 128 } }) },
  ]
}
