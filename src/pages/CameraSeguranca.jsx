import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const PLAY_BASE = 'https://play.maaxcam.com.br'
const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')

function CopyButton({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) } catch {} }}
      className="shrink-0 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs text-white">
      {done ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

function Field({ label, value, hint }) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="flex gap-2 items-center">
        <code className="flex-1 truncate rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-emerald-300">{value}</code>
        <CopyButton text={value} />
      </div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

export default function CameraSeguranca() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newCidr, setNewCidr] = useState('')
  const [newCidrLabel, setNewCidrLabel] = useState('')
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [ytKey, setYtKey] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await api.get(`/api/cameras/${id}/security`)) }
    catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (data) setYtKey(data.youtube_key || '') }, [data])

  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); await load() } catch (e) { setError(msg(e)) } finally { setBusy(false) } }

  const onAudioFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    run(async () => {
      const fd = new FormData()
      fd.append('file', file)
      await api.upload(`/api/cameras/${id}/audio`, fd)
    })
  }

  if (loading) return <div className="min-h-screen bg-atmosphere text-slate-300 p-6">Carregando…</div>
  if (!data) return (
    <div className="min-h-screen bg-atmosphere text-slate-300 p-6 space-y-2">
      <p className="text-red-400">{error || 'Não foi possível carregar.'}</p>
      <Link to="/painel/cameras" className="text-blue-400 underline">← Voltar</Link>
    </div>
  )

  const isPrivate = data.stream_privacy === 'private'
  const embedUrl = `${PLAY_BASE}/embed/${data.playback_id}`
  const previewUrl = data.preview_token ? `${embedUrl}?token=${data.preview_token}` : embedUrl
  const iframeSnippet = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`

  return (
    <div className="h-screen overflow-y-auto bg-atmosphere text-slate-200 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/painel/cameras')} className="text-sm text-blue-400 hover:underline cursor-pointer">← Câmeras</button>
            <h1 className="font-display text-2xl mt-1">{data.name || data.camera_id}</h1>
            <div className="text-xs text-slate-500">{data.camera_id}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPrivate ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isPrivate ? 'Privado' : 'Público'}
          </span>
        </div>

        {error && <div className="rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-3 py-2">{error}</div>}

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Transmissão (RTMP)</h2>
          <Field label="URL RTMP" value={data.rtmp_url} hint="Cole isto na sua câmera IP (campo de servidor/URL RTMP) para começar a transmitir." />
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Verificar transmissão</h2>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe key={data.playback_id + data.stream_privacy} src={previewUrl} className="w-full h-full" allow="autoplay; fullscreen" />
          </div>
          <p className="text-xs text-slate-500">Se a imagem aparecer, a câmera está enviando para o servidor.</p>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Transmissão YouTube</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${data.relay_running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-300'}`}>
              {data.relay_running ? 'No ar' : 'Parado'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">URL de transmissão do YouTube</div>
            <div className="flex gap-2 items-center">
              <input value={ytKey} onChange={e => setYtKey(e.target.value)} placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
                className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
              <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}`, { youtube_key: ytKey.trim() }))}
                className="shrink-0 rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white">Salvar</button>
            </div>
            <div className="text-xs text-slate-500">No YouTube Studio: Transmitir → junte a "URL do servidor" + a "chave de transmissão" no formato <code>rtmp://.../live2/sua-chave</code>.</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-400">Áudio da transmissão</div>
            {data.has_audio ? (
              <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2 text-sm">
                <span className="truncate">🎵 {data.audio_name}</span>
                <button disabled={busy} onClick={() => run(() => api.del(`/api/cameras/${id}/audio`))} className="shrink-0 ml-2 text-red-400 hover:text-red-300 text-xs">Remover</button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sem áudio: a transmissão vai com som silencioso. Envie um .mp3 para tocar em loop.</p>
            )}
            <label className={`inline-block rounded-md px-4 py-2 text-sm ${busy ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'}`}>
              {data.has_audio ? 'Trocar áudio (.mp3)' : 'Enviar áudio (.mp3)'}
              <input type="file" accept="audio/mpeg,.mp3" className="hidden" disabled={busy} onChange={onAudioFile} />
            </label>
            <p className="text-xs text-slate-500">Ao trocar ou remover, se o solo estiver no ar ele reinicia sozinho para aplicar.</p>
          </div>

          <div className="space-y-2">
            {data.in_active_group ? (
              <div className="rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm px-3 py-2">
                Esta câmera está num <strong>grupo ativo</strong> — o grupo controla a transmissão dela. Pare o grupo para transmitir esta câmera sozinha no YouTube.
              </div>
            ) : (
              <div className="flex gap-2">
                <button disabled={busy || data.relay_running || !data.youtube_key} onClick={() => run(() => api.post(`/api/cameras/${id}/relay/start`))}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2 text-sm text-white">Iniciar</button>
                <button disabled={busy || !data.relay_running} onClick={() => run(() => api.post(`/api/cameras/${id}/relay/stop`))}
                  className="rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 px-4 py-2 text-sm text-white">Parar</button>
              </div>
            )}
            {!data.in_active_group && !data.youtube_key && <p className="text-xs text-slate-500">Defina e salve a URL do YouTube acima para poder iniciar.</p>}
          </div>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Privacidade</h2>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}/security/privacy`, { stream_privacy: 'public' }))}
              className={`rounded-md px-4 py-2 text-sm ${!isPrivate ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Público</button>
            <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}/security/privacy`, { stream_privacy: 'private' }))}
              className={`rounded-md px-4 py-2 text-sm ${isPrivate ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Privado</button>
          </div>
          <p className="text-xs text-slate-500">{isPrivate ? 'Privado: você controla quem assiste — libere sites (domínios) e servidores (IPs/tokens) nas opções que aparecem abaixo.' : 'Público: qualquer pessoa com o link ou o iframe assiste. Selecione Privado para liberar os controles de acesso.'}</p>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Incorporar no site (iframe)</h2>
          <div className="flex gap-2 items-start">
            <code className="flex-1 break-all rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-emerald-300">{iframeSnippet}</code>
            <CopyButton text={iframeSnippet} />
          </div>
          <p className="text-xs text-slate-500">A chave real nunca aparece — só o identificador público.</p>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">HLS (para outros players/serviços)</h2>
          <Field label="URL HLS pública" value={data.hls_url} hint={isPrivate ? 'Câmera privada: esta URL só funciona com um token (abaixo) e de um IP autorizado.' : 'Câmera pública: funciona direto.'} />
        </section>

        {isPrivate && (<>
        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Domínios autorizados (sites)</h2>
          <p className="text-xs text-slate-500">Quando privada, o iframe só toca nestes domínios.</p>
          <div className="flex gap-2">
            <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="exemplo.com.br"
              className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
            <button disabled={busy || !newDomain.trim()} onClick={() => run(async () => { await api.post(`/api/cameras/${id}/security/domains`, { domain: newDomain.trim() }); setNewDomain('') })}
              className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white">Adicionar</button>
          </div>
          <ul className="space-y-1">
            {data.domains.map(d => (
              <li key={d.id} className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2 text-sm">
                <span>{d.domain}</span>
                <button onClick={() => run(() => api.del(`/api/cameras/${id}/security/domains/${d.id}`))} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
              </li>
            ))}
            {data.domains.length === 0 && <li className="text-xs text-slate-500">Nenhum domínio.</li>}
          </ul>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">IPs / faixas autorizadas (servidores)</h2>
          <p className="text-xs text-slate-500">Quando privada, o HLS via token só funciona destes IPs. Ex.: 203.0.113.4 ou 203.0.113.0/24.</p>
          <div className="flex gap-2 flex-wrap">
            <input value={newCidr} onChange={e => setNewCidr(e.target.value)} placeholder="203.0.113.0/24"
              className="flex-1 min-w-[140px] rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
            <input value={newCidrLabel} onChange={e => setNewCidrLabel(e.target.value)} placeholder="rótulo (opcional)"
              className="flex-1 min-w-[140px] rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
            <button disabled={busy || !newCidr.trim()} onClick={() => run(async () => { await api.post(`/api/cameras/${id}/security/ips`, { cidr: newCidr.trim(), label: newCidrLabel.trim() }); setNewCidr(''); setNewCidrLabel('') })}
              className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white">Adicionar</button>
          </div>
          <ul className="space-y-1">
            {data.ips.map(i => (
              <li key={i.id} className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2 text-sm">
                <span><code className="text-emerald-300">{i.cidr}</code>{i.label ? <span className="text-slate-400"> — {i.label}</span> : null}</span>
                <button onClick={() => run(() => api.del(`/api/cameras/${id}/security/ips/${i.id}`))} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
              </li>
            ))}
            {data.ips.length === 0 && <li className="text-xs text-slate-500">Nenhum IP (sem restrição de IP).</li>}
          </ul>
        </section>

        <section className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
          <h2 className="font-display text-lg">Tokens permanentes (HLS em outros servidores)</h2>
          <p className="text-xs text-slate-500">Cada token gera uma URL HLS com <code>?key=</code> para usar em outro serviço/servidor.</p>
          <div className="flex gap-2">
            <input value={newTokenLabel} onChange={e => setNewTokenLabel(e.target.value)} placeholder="rótulo (ex.: Servidor A)"
              className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm" />
            <button disabled={busy} onClick={() => run(async () => { await api.post(`/api/cameras/${id}/security/tokens`, { label: newTokenLabel.trim() }); setNewTokenLabel('') })}
              className="rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white">Gerar token</button>
          </div>
          <ul className="space-y-2">
            {data.tokens.map(t => {
              const url = `${data.hls_url}?key=${t.token}`
              return (
                <li key={t.id} className="rounded-md bg-slate-900/60 px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t.label || '(sem rótulo)'}</span>
                    <button onClick={() => run(() => api.del(`/api/cameras/${id}/security/tokens/${t.id}`))} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 truncate rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs text-emerald-300">{url}</code>
                    <CopyButton text={url} />
                  </div>
                </li>
              )
            })}
            {data.tokens.length === 0 && <li className="text-xs text-slate-500">Nenhum token.</li>}
          </ul>
        </section>
        </>)}
      </div>
    </div>
  )
}
