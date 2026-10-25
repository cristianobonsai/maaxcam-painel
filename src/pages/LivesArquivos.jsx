import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api'

const BTN = 'rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_PRIMARY = `${BTN} bg-blue-600 text-white hover:bg-blue-500`
const BTN_GHOST = `${BTN} border border-slate-600 text-slate-200 hover:bg-slate-700/60`
const BTN_DANGER = `${BTN} border border-red-500/50 text-red-300 hover:bg-red-500/10`
const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'
const CARD = 'rounded-xl border border-slate-700 bg-slate-800/60 p-4'

const VIDEO_ACCEPT = '.mp4,.mov,.mkv,.webm,.avi,.m4v,video/*'
const AUDIO_ACCEPT = '.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,audio/*'

const ASSET_STATUS = {
  enviando: { label: 'Enviando', cls: 'bg-slate-600/40 text-slate-300' },
  na_fila: { label: 'Na fila para converter', cls: 'bg-amber-500/15 text-amber-300' },
  convertendo: { label: 'Convertendo', cls: 'bg-amber-500/15 text-amber-300' },
  pronto: { label: 'Pronto', cls: 'bg-emerald-500/15 text-emerald-300' },
  erro: { label: 'Erro', cls: 'bg-red-500/15 text-red-300' },
}

const LIVE_STATUS = {
  desligada: { label: 'Desligada', cls: 'bg-slate-600/40 text-slate-300', dot: 'bg-slate-400' },
  iniciando: { label: 'Iniciando', cls: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400' },
  no_ar: { label: 'No ar', cls: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  com_problema: { label: 'Com problema', cls: 'bg-red-500/15 text-red-300', dot: 'bg-red-400' },
}

function fmtBytes(n) {
  const mb = (n || 0) / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

function fmtDur(s) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`
}

function fmtWhen(ts) {
  return ts ? new Date(ts * 1000).toLocaleString('pt-BR') : ''
}

function errMsg(e) {
  return e instanceof ApiError ? e.message : 'Algo deu errado. Tente de novo.'
}

function StatusChip({ map, value }) {
  const s = map[value] || { label: value, cls: 'bg-slate-600/40 text-slate-300' }
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.dot && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}{s.label}</span>
}

function SpaceBar({ config }) {
  if (!config) return null
  const pct = Math.min(100, Math.round((config.used_bytes / config.quota_bytes) * 100))
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>Espaço usado</span>
        <span>{fmtBytes(config.used_bytes)} de {fmtBytes(config.quota_bytes)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full ${pct >= 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AssetRow({ a, onDelete, busy }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-slate-700/60 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white" title={a.name}>{a.name}</p>
        <p className="text-xs text-slate-400">
          {[fmtBytes(a.size_bytes), fmtDur(a.duration_s), a.width && a.height ? `${a.width}×${a.height}` : ''].filter(Boolean).join(' · ')}
        </p>
        {a.status === 'erro' && a.error && <p className="mt-1 text-xs text-red-300">{a.error}</p>}
      </div>
      <StatusChip map={ASSET_STATUS} value={a.status} />
      <button className={BTN_DANGER} disabled={busy || a.status === 'enviando' || a.status === 'convertendo'} onClick={() => onDelete(a)}>
        Apagar
      </button>
    </li>
  )
}

function Biblioteca({ config, assets, reload }) {
  const [uploads, setUploads] = useState([])      // [{ key, name, pct, error }]
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const videoInput = useRef(null)
  const audioInput = useRef(null)

  const videos = assets.filter((a) => a.kind === 'video')
  const audios = assets.filter((a) => a.kind === 'audio')
  const lim = config?.limits

  async function sendFiles(kind, fileList) {
    const files = Array.from(fileList || [])
    for (const file of files) {
      const key = `${Date.now()}-${Math.random()}`
      setUploads((u) => [...u, { key, name: file.name, pct: 0, error: '' }])
      try {
        await api.uploadRaw(`/api/file-lives/assets?kind=${kind}&filename=${encodeURIComponent(file.name)}`, file,
          (p) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, pct: p } : x))))
        setUploads((u) => u.filter((x) => x.key !== key))
      } catch (e) {
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: errMsg(e) } : x)))
      }
      await reload()
    }
  }

  async function remove(a) {
    if (!window.confirm(`Apagar "${a.name}"?`)) return
    setBusy(true)
    setError('')
    try {
      await api.del(`/api/file-lives/assets/${a.id}`)
      await reload()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  // função de renderização (não componente): um componente criado aqui seria recriado a cada atualização de 10 s
  // e derrubaria o seletor de arquivos aberto
  const renderSection = ({ title, hint, items, kind, inputRef, accept, multiple }) => (
    <section key={kind} className={CARD}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
        <button className={BTN_PRIMARY} onClick={() => inputRef.current?.click()}>{kind === 'video' ? 'Enviar vídeo' : 'Enviar músicas'}</button>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={(e) => { const f = e.target.files; e.target.value = ''; sendFiles(kind, f) }} />
      </div>
      {items.length === 0
        ? <p className="py-4 text-center text-sm text-slate-500">Nenhum arquivo ainda.</p>
        : <ul>{items.map((a) => <AssetRow key={a.id} a={a} onDelete={remove} busy={busy} />)}</ul>}
    </section>
  )

  return (
    <div className="space-y-4">
      <div className={CARD}><SpaceBar config={config} /></div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {uploads.length > 0 && (
        <div className={CARD}>
          <h2 className="mb-2 text-sm font-semibold text-white">Envios</h2>
          <ul className="space-y-3">
            {uploads.map((u) => (
              <li key={u.key}>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                  <span className="truncate">{u.name}</span>
                  {u.error
                    ? <button className="text-slate-400 underline" onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}>fechar</button>
                    : <span>{Math.round(u.pct * 100)}%</span>}
                </div>
                {u.error
                  ? <p className="mt-1 text-xs text-red-300">{u.error}</p>
                  : <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full bg-blue-500" style={{ width: `${Math.round(u.pct * 100)}%` }} /></div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {renderSection({
        title: 'Vídeos', kind: 'video', items: videos, inputRef: videoInput, accept: VIDEO_ACCEPT, multiple: false,
        hint: lim ? `Até ${lim.video_max_min} min e ${lim.video_max_mb} MB por vídeo. Ele é convertido para Full HD (1080p, 30 quadros) ao enviar e roda em repetição.` : '',
      })}
      {renderSection({
        title: 'Músicas', kind: 'audio', items: audios, inputRef: audioInput, accept: AUDIO_ACCEPT, multiple: true,
        hint: lim ? `Até ${lim.audio_max_min} min e ${lim.audio_max_mb} MB por música. A playlist da live aceita até ${lim.max_tracks} músicas.` : '',
      })}
    </div>
  )
}

function MinhaLive({ live, assets, config, reload }) {
  const [name, setName] = useState(live?.name || '')
  const [keyInput, setKeyInput] = useState('')
  const [editKey, setEditKey] = useState(false)
  const [addId, setAddId] = useState('')
  const [pending, setPending] = useState(false)   // há mudança gravada que só vale depois de reiniciar a transmissão
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createName, setCreateName] = useState('')

  useEffect(() => { setName(live?.name || '') }, [live?.id, live?.name])

  const readyVideos = assets.filter((a) => a.kind === 'video' && a.status === 'pronto')
  const readyAudios = assets.filter((a) => a.kind === 'audio' && a.status === 'pronto')
  const byId = Object.fromEntries(assets.map((a) => [a.id, a]))
  const on = !!live?.enabled

  async function act(fn) {
    setBusy(true)
    setError('')
    try {
      const res = await fn()
      if (res?.restart_needed) setPending(true)
      await reload()
      return res
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const save = (fields) => act(() => api.put(`/api/file-lives/${live.id}`, { ...fields, apply: false }))
  const saveTracks = (ids) => act(() => api.put(`/api/file-lives/${live.id}/tracks`, { asset_ids: ids, apply: false }))

  if (!live) {
    return (
      <div className={CARD}>
        <h2 className="font-display text-lg font-semibold text-white">Criar minha live</h2>
        <p className="mb-3 mt-1 text-sm text-slate-400">Uma live transmite o seu vídeo em repetição, com a sua playlist de músicas, direto para o YouTube.</p>
        <div className="flex flex-wrap gap-3">
          <input className={`${INPUT} max-w-xs`} placeholder="Nome da live" value={createName} onChange={(e) => setCreateName(e.target.value)} />
          <button className={BTN_PRIMARY} disabled={busy} onClick={() => act(() => api.post('/api/file-lives', { name: createName }))}>Criar</button>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
    )
  }

  const tracks = live.tracks || []
  const move = (i, d) => {
    const ids = [...tracks]
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    saveTracks(ids)
  }

  return (
    <div className="space-y-4">
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusChip map={LIVE_STATUS} value={live.status} />
            {live.status === 'no_ar' && live.status_ts && <span className="text-xs text-slate-400">desde {fmtWhen(live.status_ts)}</span>}
          </div>
          <div className="flex gap-2">
            {!on && <button className={BTN_PRIMARY} disabled={busy} onClick={() => act(() => api.post(`/api/file-lives/${live.id}/start`))}>Ligar</button>}
            {on && <button className={BTN_GHOST} disabled={busy} onClick={() => act(() => api.post(`/api/file-lives/${live.id}/restart`))}>Reiniciar</button>}
            {on && <button className={BTN_DANGER} disabled={busy} onClick={() => { if (window.confirm('Desligar a live? A transmissão no YouTube será encerrada.')) { setPending(false); act(() => api.post(`/api/file-lives/${live.id}/stop`)) } }}>Desligar</button>}
          </div>
        </div>
        {live.status === 'com_problema' && live.paused_reason && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{live.paused_reason} Confira a chave de transmissão e se a transmissão ao vivo está habilitada no seu canal do YouTube.</p>
        )}
        {pending && on && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            <span>Você mudou a live. A mudança só vale depois de reiniciar a transmissão, o que causa um corte de alguns segundos.</span>
            <button className={BTN_PRIMARY} disabled={busy} onClick={async () => { await act(() => api.post(`/api/file-lives/${live.id}/restart`)); setPending(false) }}>Aplicar agora</button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </section>

      <section className={CARD}>
        <h2 className="mb-3 font-display text-lg font-semibold text-white">Dados da live</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nome</label>
            <div className="flex gap-2">
              <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
              <button className={BTN_GHOST} disabled={busy || !name.trim() || name === live.name} onClick={() => save({ name })}>Salvar</button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Chave de transmissão do YouTube</label>
            {live.has_youtube_key && !editKey ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-emerald-300">Chave salva ✓</span>
                <button className={BTN_GHOST} onClick={() => setEditKey(true)}>Trocar chave</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className={INPUT} type="password" autoComplete="off" placeholder="Cole a chave aqui" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
                <button className={BTN_GHOST} disabled={busy || !keyInput.trim()}
                  onClick={async () => { await save({ youtube_key: keyInput.trim() }); setKeyInput(''); setEditKey(false) }}>Salvar</button>
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500">A chave não volta a aparecer na tela depois de salva.</p>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Vídeo (roda em repetição)</label>
            <select className={INPUT} value={live.video_asset_id || ''} disabled={busy}
              onChange={(e) => e.target.value && save({ video_asset_id: Number(e.target.value) })}>
              <option value="">Escolha um vídeo da biblioteca…</option>
              {readyVideos.map((v) => <option key={v.id} value={v.id}>{v.name} ({fmtDur(v.duration_s)})</option>)}
            </select>
            {readyVideos.length === 0 && <p className="mt-1 text-xs text-slate-500">Envie um vídeo na aba Biblioteca e espere ele ficar pronto.</p>}
          </div>
        </div>
      </section>

      <section className={CARD}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-white">Playlist de músicas</h2>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={!!live.shuffle} disabled={busy} onChange={(e) => save({ shuffle: e.target.checked })} />
            Ordem aleatória
          </label>
        </div>
        {tracks.length === 0
          ? <p className="py-3 text-sm text-slate-500">Nenhuma música na playlist.</p>
          : (
            <ol className="mb-3">
              {tracks.map((id, i) => (
                <li key={id} className="flex items-center gap-2 border-t border-slate-700/60 py-2 first:border-t-0">
                  <span className="w-6 text-xs text-slate-500">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{byId[id]?.name || `Arquivo ${id}`}</span>
                  <span className="text-xs text-slate-400">{fmtDur(byId[id]?.duration_s)}</span>
                  <button className={BTN_GHOST} disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
                  <button className={BTN_GHOST} disabled={busy || i === tracks.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
                  <button className={BTN_DANGER} disabled={busy} onClick={() => saveTracks(tracks.filter((t) => t !== id))}>Tirar</button>
                </li>
              ))}
            </ol>
          )}
        <div className="flex flex-wrap gap-2">
          <select className={`${INPUT} max-w-sm`} value={addId} onChange={(e) => setAddId(e.target.value)}>
            <option value="">Adicionar música da biblioteca…</option>
            {readyAudios.filter((a) => !tracks.includes(a.id)).map((a) => <option key={a.id} value={a.id}>{a.name} ({fmtDur(a.duration_s)})</option>)}
          </select>
          <button className={BTN_GHOST} disabled={busy || !addId || tracks.length >= (config?.limits?.max_tracks || 10)}
            onClick={async () => { await saveTracks([...tracks, Number(addId)]); setAddId('') }}>Adicionar</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Até {config?.limits?.max_tracks || 10} músicas, tocadas em sequência e em repetição.</p>
      </section>

      {!on && (
        <div className="text-right">
          <button className={BTN_DANGER} disabled={busy} onClick={() => { if (window.confirm('Apagar esta live? Os arquivos da biblioteca continuam guardados.')) act(() => api.del(`/api/file-lives/${live.id}`)) }}>Apagar live</button>
        </div>
      )}
    </div>
  )
}

export default function LivesArquivos() {
  const [tab, setTab] = useState('live')
  const [config, setConfig] = useState(null)
  const [assets, setAssets] = useState([])
  const [lives, setLives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [c, a, l] = await Promise.all([api.get('/api/file-lives/config'), api.get('/api/file-lives/assets'), api.get('/api/file-lives')])
      setConfig(c)
      setAssets(a || [])
      setLives(l || [])
      setError('')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const t = setInterval(reload, 10000)
    return () => clearInterval(t)
  }, [reload])

  const live = lives[0] || null
  const tabCls = (id) => `rounded-lg px-4 py-2 text-sm font-medium ${tab === id ? 'bg-blue-500/10 text-white' : 'text-slate-400 hover:text-slate-200'}`

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-white">Lives de arquivos</h1>
      <p className="mt-1 text-sm text-slate-400">Transmita um vídeo em repetição, com uma playlist de músicas, direto para o seu canal do YouTube, 24 horas por dia.</p>
      <div className="mt-5 flex gap-2 border-b border-slate-800 pb-3">
        <button className={tabCls('live')} onClick={() => setTab('live')}>Minha live</button>
        <button className={tabCls('lib')} onClick={() => setTab('lib')}>Biblioteca</button>
      </div>
      <div className="mt-5">
        {loading && <p className="text-slate-400">Carregando…</p>}
        {!loading && error && <p className="mb-3 text-sm text-red-300">{error}</p>}
        {!loading && tab === 'live' && <MinhaLive live={live} assets={assets} config={config} reload={reload} />}
        {!loading && tab === 'lib' && <Biblioteca config={config} assets={assets} reload={reload} />}
      </div>
      <p className="mt-8 text-xs text-slate-500">
        Você é o responsável pelos vídeos e pelas músicas que envia, inclusive pelos direitos autorais. A monetização do seu canal depende das regras do YouTube.
      </p>
    </main>
  )
}
