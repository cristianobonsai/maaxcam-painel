import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const EMPTY = { name: '', location: '', streamKey: '', youtubeKey: '', enabled: true }

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [mode, setMode] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState(null)
  const [relayBusy, setRelayBusy] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/cameras')
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
    setMode('create'); setEditingId(null); setForm(EMPTY); setFormError(''); setCreated(null)
  }
  function openEdit(c) {
    setMode('edit'); setEditingId(c.camera_id); setFormError(''); setCreated(null)
    setForm({
      name: c.name || '', location: c.location || '', streamKey: '',
      youtubeKey: c.youtube_key || '', enabled: !!c.enabled,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function closeForm() { setMode(null); setEditingId(null); setForm(EMPTY); setFormError('') }

  async function handleSubmit() {
    if (!form.name.trim()) { setFormError('O nome é obrigatório.'); return }
    setSubmitting(true); setFormError('')
    try {
      if (mode === 'create') {
        const body = { name: form.name.trim(), location: form.location.trim() }
        if (form.streamKey.trim()) body.stream_key = form.streamKey.trim()
        setCreated(await api.post('/api/cameras', body))
      } else {
        await api.put(`/api/cameras/${editingId}`, {
          name: form.name.trim(), location: form.location.trim(),
          youtube_key: form.youtubeKey.trim(), enabled: form.enabled,
        })
      }
      closeForm()
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Erro ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Excluir a câmera "${c.name || c.camera_id}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api.del(`/api/cameras/${c.camera_id}`)
      await load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Erro ao excluir.')
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

  const inputCls = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-6 py-4">
        <Link to="/painel" className="text-sm text-slate-400 hover:text-slate-200">← Painel</Link>
        <h1 className="text-lg font-semibold">Câmeras</h1>
        <div className="ml-auto flex gap-2">
          <button onClick={load} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-700">Atualizar</button>
          <button onClick={mode === 'create' ? closeForm : openCreate} className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600">
            {mode === 'create' ? 'Cancelar' : 'Nova câmera'}
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        {mode && (
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-base font-semibold">{mode === 'create' ? 'Nova câmera' : `Editar — ${editingId}`}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Nome *</span>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputCls} placeholder="Ex.: Portão da frente" />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Localização</span>
                <input value={form.location} onChange={(e) => setField('location', e.target.value)} className={inputCls} placeholder="Ex.: Biguaçu" />
              </label>
              {mode === 'create' && (
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm text-slate-400">Stream key <span className="text-slate-600">(opcional — vazio = gerado automaticamente)</span></span>
                  <input value={form.streamKey} onChange={(e) => setField('streamKey', e.target.value)} className={inputCls} placeholder="deixe vazio para gerar" />
                </label>
              )}
              {mode === 'edit' && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-sm text-slate-400">YouTube key <span className="text-slate-600">(opcional)</span></span>
                    <input value={form.youtubeKey} onChange={(e) => setField('youtubeKey', e.target.value)} className={inputCls} placeholder="chave de transmissão do YouTube" />
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" checked={form.enabled} onChange={(e) => setField('enabled', e.target.checked)} className="size-4" />
                    <span className="text-sm text-slate-300">Câmera ativa</span>
                  </label>
                </>
              )}
            </div>
            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={handleSubmit} disabled={submitting} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {submitting ? 'Salvando…' : (mode === 'create' ? 'Criar câmera' : 'Salvar')}
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
            <button onClick={() => setCreated(null)} className="mt-4 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">Fechar</button>
          </div>
        )}

        {loading && <p className="text-slate-400">Carregando…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {!loading && !error && cameras.length === 0 && <p className="text-slate-400">Nenhuma câmera ainda.</p>}

        {!loading && !error && cameras.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cameras.map((c) => (
              <li key={c.camera_id} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{c.name || c.camera_id}</span>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {c.is_streaming && <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs font-medium text-red-300">● No ar</span>}
                    {c.youtube_relay_active && <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-300">YouTube</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.enabled ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {c.enabled ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-sm text-slate-400">{c.camera_id}</div>
                {c.location && <div className="mt-1 text-sm text-slate-500">{c.location}</div>}

                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(c)} className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-blue-500">Editar</button>
                  <button onClick={() => handleDelete(c)} className="rounded-md border border-slate-700 px-3 py-1 text-xs text-red-300 hover:border-red-500">Excluir</button>
                </div>

                <div className="mt-2 flex gap-2">
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
                  ) : (
                    <span className="self-center text-xs text-slate-600">Sem YouTube key</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
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
