import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import LocationEditor from '../LocationEditor.jsx'

const PLAY_BASE = 'https://play.livebybit.com'
const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')

function Icon({ path, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

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

function Card({ title, icon, badge, children }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      {(title || badge) && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
            {icon && <Icon path={icon} className="h-5 w-5 text-slate-400" />}
            {title}
          </h2>
          {badge}
        </div>
      )}
      {children}
    </section>
  )
}

function LockedNote({ children }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/50 px-3 py-3 text-sm text-slate-400 flex items-start gap-2">
      <Icon path="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4" className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{children}</span>
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
  const [tab, setTab] = useState('edit')
  const [newDomain, setNewDomain] = useState('')
  const [newCidr, setNewCidr] = useState('')
  const [newCidrLabel, setNewCidrLabel] = useState('')
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [ytKey, setYtKey] = useState('')
  const [edit, setEdit] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const sec = await api.get(`/api/cameras/${id}/security`)
      try { sec.caps = await api.get(`/api/cameras/${id}/caps`) } catch {}
      setData(sec)
    }
    catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (data) setYtKey(data.youtube_key || '') }, [data])

  useEffect(() => {
    let alive = true
    api.get('/api/cameras?mine=1')
      .then((all) => {
        const list = Array.isArray(all) ? all : (all?.cameras ?? [])
        const c = list.find((x) => x.camera_id === id)
        if (alive && c) setEdit({ name: c.name || '', brand: c.brand || '', cloud: c.cloud || '', project: c.project || '', enabled: !!c.enabled })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [id])

  async function saveEdit() {
    if (!edit || !edit.name.trim()) { setEditError('O nome é obrigatório.'); return }
    setEditSaving(true); setEditError('')
    try {
      await api.put(`/api/cameras/${id}`, { name: edit.name.trim(), brand: edit.brand.trim(), cloud: edit.cloud.trim(), project: edit.project.trim(), enabled: edit.enabled })
      await load()
    } catch (e) { setEditError(msg(e)) }
    finally { setEditSaving(false) }
  }

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

  if (loading) return <div className="min-h-screen text-slate-300 p-6">Carregando…</div>
  if (!data) return (
    <div className="min-h-screen text-slate-300 p-6 space-y-2">
      <p className="text-red-400">{error || 'Não foi possível carregar.'}</p>
      <button onClick={() => navigate('/painel/cameras')} className="text-blue-400 underline">← Voltar</button>
    </div>
  )

  const isPrivate = data.stream_privacy === 'private'
  const embedUrl = `${PLAY_BASE}/embed/${data.playback_id}`
  const previewUrl = data.preview_token ? `${embedUrl}?token=${data.preview_token}` : embedUrl
  const iframeSnippet = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen allow="autoplay; fullscreen"></iframe>`

  // Plano: o backend pode mandar data.caps = { embed, youtube, audio }.
  // Enquanto não mandar, libera tudo (mesmo comportamento de hoje, sem regressão).
  const caps = data.caps || { embed: true, youtube: true, audio: true, snapshot: true }
  const firstToken = (data.tokens && data.tokens[0] && data.tokens[0].token) || ''
  const snapshotBase = `https://api.livebybit.com/api/cameras/${id}/snapshot.jpg`
  const snapshotLink = isPrivate && firstToken ? `${snapshotBase}?key=${firstToken}` : snapshotBase

  return (
    <div className="h-screen overflow-y-auto text-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6 relative z-10">

        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={() => navigate('/painel/cameras')} className="mb-1 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <Icon path="M15 18l-6-6 6-6" className="h-4 w-4" /> Câmeras
            </button>
            <h1 className="font-display text-2xl font-bold text-white">{data.name || data.camera_id}</h1>
            <div className="text-xs text-slate-500">{data.camera_id}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPrivate ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {isPrivate ? 'Privado' : 'Público'}
          </span>
        </div>

        {error && <div className="rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-3 py-2">{error}</div>}

        <div className="flex gap-6 border-b border-slate-700">
          {[['edit', 'Editar'], ['stream', 'Transmissão'], ['security', 'Segurança'], ['local', 'Localização']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${tab === key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'edit' ? (
          <div className="max-w-2xl">
            <Card title="Dados da câmera" icon="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z">
              {!edit ? (
                <p className="text-sm text-slate-400">Carregando…</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Nome *</div>
                    <input value={edit.name} onChange={(e) => setEdit((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: Portão da frente"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Marca <span className="lowercase text-slate-500">(opcional)</span></div>
                    <input value={edit.brand} onChange={(e) => setEdit((p) => ({ ...p, brand: e.target.value }))} placeholder="Ex.: Intelbras, Hikvision"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Cloud <span className="lowercase text-slate-500">(opcional)</span></div>
                    <input value={edit.cloud} onChange={(e) => setEdit((p) => ({ ...p, cloud: e.target.value }))} placeholder="Ex.: iCSee, Tuya, própria"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-slate-400">Projeto/Cliente <span className="lowercase text-slate-500">(opcional)</span></div>
                    <input value={edit.project} onChange={(e) => setEdit((p) => ({ ...p, project: e.target.value }))} placeholder="Ex.: Condomínio X"
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={edit.enabled} onChange={(e) => setEdit((p) => ({ ...p, enabled: e.target.checked }))} className="size-4" />
                    <span className="text-sm text-slate-300">Câmera ativa</span>
                  </label>
                  {editError && <p className="text-sm text-red-400">{editError}</p>}
                  <div>
                    <button disabled={editSaving} onClick={saveEdit}
                      className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-sm text-white">
                      {editSaving ? 'Salvando…' : 'Salvar'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">A localização fica na aba <strong>Localização</strong> e a chave do YouTube na aba <strong>Transmissão</strong>.</p>
                </div>
              )}
            </Card>
          </div>
        ) : tab === 'stream' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 items-start">

            <div className="space-y-5">
              <Card title="Verificar transmissão" icon="M5 3l14 9-14 9V3z">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                  <iframe key={data.playback_id + data.stream_privacy} src={previewUrl} className="w-full h-full" allow="autoplay; fullscreen" />
                </div>
                <p className="text-xs text-slate-500">Se a imagem aparecer, a câmera está enviando para o servidor.</p>
              </Card>

              <Card title="Transmissão (RTMP)" icon="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12">
                <Field label="URL RTMP" value={data.rtmp_url} hint="Cole isto na sua câmera IP (campo de servidor/URL RTMP) para começar a transmitir." />
              </Card>

              <Card title="Link da foto (time-lapse)" icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10">
                {!caps.snapshot ? (
                  <LockedNote>O link da foto (time-lapse) está disponível nos planos Pro e Premium.</LockedNote>
                ) : (<>
                  <p className="text-sm text-slate-400">Link que sempre devolve a última foto da câmera (atualiza a cada 30 min). Use no seu site ou time-lapse.</p>
                  <div className="flex gap-2 items-start">
                    <code className="flex-1 break-all rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-emerald-300">{snapshotLink}</code>
                    <CopyButton text={snapshotLink} />
                  </div>
                  {isPrivate && !firstToken && <p className="text-xs text-amber-300">Câmera privada: gere um token na aba Segurança e acrescente <code>?key=SEU_TOKEN</code> ao final do link.</p>}
                  {isPrivate && firstToken && <p className="text-xs text-slate-500">Câmera privada: o link já inclui um token de acesso.</p>}
                </>)}
              </Card>
            </div>

            <div className="space-y-5">
              <Card title="Retransmissão YouTube" icon="M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8Zm8 1 5 3-5 3V9Z"
                badge={caps.youtube ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${data.relay_running ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-300'}`}>
                    {data.relay_running ? 'No ar' : 'Parado'}
                  </span>
                ) : null}>
                {!caps.youtube ? (
                  <LockedNote>Retransmissão para o YouTube não está incluída no seu plano atual.</LockedNote>
                ) : (<>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-slate-400">URL de transmissão do YouTube</div>
                    <div className="flex gap-2 items-center">
                      <input value={ytKey} onChange={e => setYtKey(e.target.value)} placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx-xxxx-xxxx"
                        className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}`, { youtube_key: ytKey.trim() }))}
                        className="shrink-0 rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white">Salvar</button>
                    </div>
                    <div className="text-xs text-slate-500">No YouTube Studio: Transmitir → junte a "URL do servidor" + a "chave de transmissão" no formato rtmp://.../live2/sua-chave.</div>
                  </div>

                  {data.in_active_group ? (
                    <div className="rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm px-3 py-2">
                      Esta câmera está num <strong>grupo ativo</strong> — o grupo controla a transmissão dela. Pare o grupo para transmitir esta câmera sozinha.
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
                </>)}
              </Card>

              <Card title="Áudio da transmissão" icon="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z">
                {!caps.audio ? (
                  <LockedNote>Áudio personalizado não está incluído no seu plano atual.</LockedNote>
                ) : (<>
                  {data.has_audio ? (
                    <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2 text-sm">
                      <span className="truncate flex items-center gap-2"><Icon path="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" className="h-4 w-4 text-slate-400 shrink-0" /> {data.audio_name}</span>
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
                </>)}
              </Card>

              <Card title="Player & incorporação" icon="M16 18l6-6-6-6M8 6l-6 6 6 6">
                <Field label="URL HLS pública" value={data.hls_url} hint={isPrivate ? 'Câmera privada: só funciona com token (aba Segurança) e de um IP autorizado.' : 'Câmera pública: funciona direto.'} />
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Incorporar no site (iframe)</div>
                  {!caps.embed ? (
                    <LockedNote>O player para incorporar em site (iframe) não está incluído no seu plano atual.</LockedNote>
                  ) : (<>
                    <div className="flex gap-2 items-start">
                      <code className="flex-1 break-all rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-emerald-300">{iframeSnippet}</code>
                      <CopyButton text={iframeSnippet} />
                    </div>
                    <p className="text-xs text-slate-500">A chave real nunca aparece — só o identificador público.</p>
                  </>)}
                </div>
              </Card>

            </div>
          </div>
        ) : tab === 'security' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <div className="space-y-5">
              <Card title="Privacidade" icon="M6 21h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2ZM8 11V7a4 4 0 0 1 8 0v4">
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}/security/privacy`, { stream_privacy: 'public' }))}
                    className={`rounded-md px-4 py-2 text-sm ${!isPrivate ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Público</button>
                  <button disabled={busy} onClick={() => run(() => api.put(`/api/cameras/${id}/security/privacy`, { stream_privacy: 'private' }))}
                    className={`rounded-md px-4 py-2 text-sm ${isPrivate ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Privado</button>
                </div>
                <p className="text-xs text-slate-500">{isPrivate ? 'Privado: você controla quem assiste — libere sites (domínios) e servidores (IPs/tokens) abaixo.' : 'Público: qualquer pessoa com o link ou o iframe assiste. Selecione Privado para liberar os controles de acesso.'}</p>
              </Card>

              {isPrivate && (
                <Card title="Domínios autorizados (sites)" icon="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z">
                  <p className="text-xs text-slate-500">Quando privada, o iframe só toca nestes domínios.</p>
                  <div className="flex gap-2">
                    <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="exemplo.com.br"
                      className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
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
                </Card>
              )}
            </div>

            {isPrivate && (
              <div className="space-y-5">
                <Card title="IPs / faixas autorizadas (servidores)" icon="M4 6h16M4 12h16M4 18h16">
                  <p className="text-xs text-slate-500">Quando privada, o HLS via token só funciona destes IPs. Ex.: 203.0.113.4 ou 203.0.113.0/24.</p>
                  <div className="flex gap-2 flex-wrap">
                    <input value={newCidr} onChange={e => setNewCidr(e.target.value)} placeholder="203.0.113.0/24"
                      className="flex-1 min-w-[140px] rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                    <input value={newCidrLabel} onChange={e => setNewCidrLabel(e.target.value)} placeholder="rótulo (opcional)"
                      className="flex-1 min-w-[140px] rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
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
                </Card>

                <Card title="Tokens permanentes (HLS em outros servidores)" icon="M21 2l-2 2m-7.6 7.6a5 5 0 1 0-1.4 1.4l4-4M13 9l4 4">
                  <p className="text-xs text-slate-500">Cada token gera uma URL HLS com ?key= para usar em outro serviço/servidor.</p>
                  <div className="flex gap-2">
                    <input value={newTokenLabel} onChange={e => setNewTokenLabel(e.target.value)} placeholder="rótulo (ex.: Servidor A)"
                      className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
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
                </Card>
              </div>
            )}
          </div>
        ) : (
          <LocationEditor cameraId={id} />
        )}
      </div>
    </div>
  )
}
