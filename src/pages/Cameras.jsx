import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const EMPTY = { name: '', streamKey: '', brand: '', cloud: '', project: '', qualityTier: '1080p', plan: 'basico' }

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todas')

  const [mode, setMode] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState(null)
  const [relayBusy, setRelayBusy] = useState(null)

  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [planBusy, setPlanBusy] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/cameras?mine=1')
      setCameras(Array.isArray(data) ? data : (data?.cameras ?? []))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar câmeras.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  function openCreate() {
    setMode('create'); setForm(EMPTY); setFormError(''); setCreated(null)
  }
  function closeForm() { setMode(null); setForm(EMPTY); setFormError('') }

  async function handleSubmit() {
    if (!form.name.trim()) { setFormError('O nome é obrigatório.'); return }
    setSubmitting(true); setFormError('')
    try {
      const body = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        cloud: form.cloud.trim(),
        project: form.project.trim(),
        quality_tier: form.qualityTier || '1080p',
        plan: form.plan || 'basico',
      }
      if (form.streamKey.trim()) body.stream_key = form.streamKey.trim()
      setCreated(await api.post('/api/cameras', body))
      closeForm()
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Erro ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.del(`/api/cameras/${deleting.camera_id}`)
      setDeleting(null)
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Erro ao excluir.')
    } finally {
      setDeleteBusy(false)
    }
  }

  async function handleRelayStart(c) {
    const ok = window.confirm(
      `Iniciar o relay da câmera "${c.name || c.camera_id}" para o YouTube?\n\n` +
      `ATENÇÃO: o servidor tem 1 núcleo. Este comando NÃO para o grupo automaticamente. ` +
      `Se houver transmissão de grupo no ar, iniciar um relay individual pode sobrecarregar o servidor.`
    )
    if (!ok) return
    setRelayBusy(c.camera_id)
    try {
      await api.post(`/api/cameras/${c.camera_id}/relay/start`)
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Erro ao iniciar relay.')
    } finally {
      setRelayBusy(null)
    }
  }

  async function handleRelayStop(c) {
    setRelayBusy(c.camera_id)
    try {
      await api.post(`/api/cameras/${c.camera_id}/relay/stop`)
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Erro ao parar relay.')
    } finally {
      setRelayBusy(null)
    }
  }

  async function handlePlanChange(c, novoPlan) {
    setPlanBusy(c.camera_id)
    try {
      await api.put(`/api/cameras/${c.camera_id}`, { plan: novoPlan })
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Erro ao mudar plano.')
    } finally {
      setPlanBusy(null)
    }
  }

  const inputCls = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500'

  const q = query.trim().toLowerCase()
  const visible = cameras
    .filter((c) => {
      if (!q) return true
      return [c.name, c.camera_id, c.location, c.brand, c.cloud, c.project].some((v) => (v || '').toLowerCase().includes(q))
    })
    .filter((c) => {
      if (statusFilter === 'todas') return true
      if (statusFilter === 'no_ar') return !!c.is_streaming
      if (statusFilter === 'ativa') return !!c.enabled
      if (statusFilter === 'inativa') return !c.enabled
      if (statusFilter === 'youtube') return !!c.youtube_relay_active
      return true
    })
    .sort((a, b) => (a.name || a.camera_id).localeCompare(b.name || b.camera_id, 'pt', { sensitivity: 'base' }))

  const planCounts = cameras.reduce((acc, c) => {
    const p = c.plan || 'basico'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})
  const planLabels = { basico: 'Básico', pro: 'Pro', premium: 'Premium' }
  const planSummary = Object.entries(planCounts)
    .map(([p, n]) => `${planLabels[p] || p}: ${n}`)
    .join(' · ')

  const statusFilters = [
    { key: 'todas', label: 'Todas' },
    { key: 'no_ar', label: 'No ar' },
    { key: 'ativa', label: 'Ativa' },
    { key: 'inativa', label: 'Inativa' },
    { key: 'youtube', label: 'YouTube' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold">Câmeras</h1>
        <div className="ml-auto flex gap-2">
          <Link to="/painel/mapa" className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-blue-500">Mapa</Link>
          <button onClick={load} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-700">Atualizar</button>
          <button onClick={mode === 'create' ? closeForm : openCreate} className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600">
            {mode === 'create' ? 'Cancelar' : 'Nova câmera'}
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        {mode && (
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-base font-semibold">Nova câmera</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Nome *</span>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCls} placeholder="Ex.: Portão da frente" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Plano desta câmera *</span>
                <select value={form.plan} onChange={(e) => setField('plan', e.target.value)} className={inputCls}>
                  <option value="basico">Básico — R$9,90/mês</option>
                  <option value="pro">Pro — R$29,90/mês</option>
                  <option value="premium">Premium — R$29,90/mês (permite Grupos)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Stream key <span className="text-slate-600">(opcional — vazio = gerado automaticamente)</span></span>
                <input value={form.streamKey} onChange={(e) => setField('streamKey', e.target.value)} className={inputCls} placeholder="sem espaços; deixe vazio para gerar" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Marca <span className="text-slate-600">(opcional)</span></span>
                <input value={form.brand} onChange={(e) => setField('brand', e.target.value)} className={inputCls} placeholder="Ex.: Intelbras, Hikvision" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Cloud <span className="text-slate-600">(opcional)</span></span>
                <input value={form.cloud} onChange={(e) => setField('cloud', e.target.value)} className={inputCls} placeholder="Ex.: iCSee, Tuya, própria" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Projeto/Cliente <span className="text-slate-600">(opcional)</span></span>
                <input value={form.project} onChange={(e) => setField('project', e.target.value)} className={inputCls} placeholder="Ex.: Condomínio X" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm text-slate-400">Qualidade contratada</span>
                <select value={form.qualityTier} onChange={(e) => setField('qualityTier', e.target.value)} className={inputCls}>
                  <option value="1080p">1080p ou inferior (15 fps)</option>
                  <option value="2k">2K / QHD (30 fps)</option>
                  <option value="4k">4K / UHD (30 fps)</option>
                </select>
                <span className="mt-1.5 block text-xs text-amber-300/90">
                  Qualidades acima de 1080p têm custo adicional. Sua câmera é monitorada: se enviar acima do contratado, você será avisado para ajustar ou fazer upgrade.
                </span>
              </label>
            </div>
            <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              🔊 <strong>Áudio:</strong> configure a câmera em <strong>G.711A</strong>. Evite <strong>AAC</strong> — pode causar atraso na abertura do vídeo.
            </div>
            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={handleSubmit} disabled={submitting} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {submitting ? 'Salvando…' : 'Criar câmera'}
              </button>
              <button onClick={closeForm} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Cancelar</button>
            </div>
          </div>
        )}

        {created && (
          <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/40 p-5">
            <h2 className="mb-2 text-base font-semibold text-emerald-300">Câmera criada! ✅</h2>
            <p className="mb-3 text-sm text-slate-400">Guarde estes dados para configurar a transmissão:</p>
            <dl className="space-y-1 text-sm">
              <Row label="ID" value={created.camera_id} />
              <Row label="Nome" value={created.name} />
              <Row label="Stream key" value={created.stream_key} />
              <Row label="RTMP" value={created.rtmp_url} />
              <Row label="HLS" value={created.hls_url} />
            </dl>
            <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              🔊 <strong>Áudio:</strong> configure a câmera em <strong>G.711A</strong>. Evite <strong>AAC</strong> — pode causar atraso na abertura do vídeo.
            </div>
            <button onClick={() => setCreated(null)} className="mt-4 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">Fechar</button>
          </div>
        )}

        {loading && <p className="text-slate-400">Carregando…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && cameras.length === 0 && <p className="text-slate-400">Nenhuma câmera ainda.</p>}

        {!loading && !error && cameras.length > 0 && (
          <>
            {planSummary && (
              <p className="mb-3 text-sm text-slate-400">{planSummary}</p>
            )}

            <div className="mb-3 flex flex-wrap gap-2">
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    statusFilter === f.key
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-700 text-slate-300 hover:border-blue-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mb-4 max-w-md">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar câmera por nome…"
                className={inputCls}
              />
            </div>

            {visible.length === 0 ? (
              <p className="text-slate-400">Nenhuma câmera encontrada para “{query}”.</p>
            ) : (
              <ul className="space-y-2">
                {visible.map((c) => (
                  <li key={c.camera_id} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{c.name || c.camera_id}</span>
                        {c.is_streaming && <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs font-medium text-red-300">● No ar</span>}
                        {c.youtube_relay_active && <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-300">YouTube</span>}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.enabled ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                          {c.enabled ? 'Ativa' : 'Inativa'}
                        </span>
                        {c.group_name && (
                          <span className="rounded-full bg-indigo-900 px-2 py-0.5 text-xs font-medium text-indigo-300">
                            Grupo: {c.group_name}
                          </span>
                        )}
                        <select
                          value={c.plan || 'basico'}
                          disabled={planBusy === c.camera_id}
                          onChange={(e) => handlePlanChange(c, e.target.value)}
                          className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200 outline-none hover:border-blue-500 disabled:opacity-50"
                        >
                          <option value="basico">Básico</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {c.camera_id}{c.location ? ` · ${c.location}` : ''}{c.project ? ` · ${c.project}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
                      {c.youtube_relay_active ? (
                        <button onClick={() => handleRelayStop(c)} disabled={relayBusy === c.camera_id}
                          className="rounded-md border border-red-700 px-3 py-1 text-xs text-red-300 hover:border-red-500 disabled:opacity-50">
                          {relayBusy === c.camera_id ? '…' : 'Parar relay'}
                        </button>
                      ) : c.youtube_key ? (
                        <button onClick={() => handleRelayStart(c)} disabled={relayBusy === c.camera_id}
                          className="rounded-md border border-emerald-700 px-3 py-1 text-xs text-emerald-300 hover:border-emerald-500 disabled:opacity-50">
                          {relayBusy === c.camera_id ? '…' : 'Iniciar relay'}
                        </button>
                      ) : null}
                      <button onClick={() => setDeleting(c)} className="rounded-md border border-slate-700 px-3 py-1 text-xs text-red-300 hover:border-red-500">Excluir</button>
                      <Link to={`/painel/cameras/${c.camera_id}/seguranca`} className="rounded-md border border-slate-700 px-3 py-1 text-xs text-blue-300 hover:border-blue-500">Gerenciar</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => !deleteBusy && setDeleting(null)}>
          <div className="w-full max-w-md rounded-xl border border-red-900/60 bg-slate-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-red-300">Excluir câmera</h2>
            <p className="mt-2 text-sm text-slate-300">
              Você está prestes a excluir <b className="text-white">{deleting.name || deleting.camera_id}</b>.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Esta ação <b className="text-red-300">não pode ser desfeita</b>: a câmera, sua chave de transmissão e as configurações são removidas em definitivo. Transmissões e embeds dessa câmera deixam de funcionar.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleteBusy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteBusy ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-slate-500">{label}</dt>
      <dd className="break-all text-slate-200">{value}</dd>
    </div>
  )
}
