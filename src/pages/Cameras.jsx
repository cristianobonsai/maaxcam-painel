import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // formulário de criação
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [streamKey, setStreamKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [created, setCreated] = useState(null)

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

  function resetForm() {
    setName('')
    setLocation('')
    setStreamKey('')
    setFormError('')
  }

  async function handleCreate() {
    if (!name.trim()) {
      setFormError('O nome é obrigatório.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      const body = { name: name.trim(), location: location.trim() }
      if (streamKey.trim()) body.stream_key = streamKey.trim()
      const result = await api.post('/api/cameras', body)
      setCreated(result)
      resetForm()
      setShowForm(false)
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Erro ao criar câmera.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-6 py-4">
        <Link to="/painel" className="text-sm text-slate-400 hover:text-slate-200">← Painel</Link>
        <h1 className="text-lg font-semibold">Câmeras</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={load}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
          >
            Atualizar
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); setCreated(null) }}
            className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
          >
            {showForm ? 'Cancelar' : 'Nova câmera'}
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        {showForm && (
          <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-base font-semibold">Nova câmera</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Nome *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Ex.: Portão da frente"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Localização</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Ex.: Biguaçu"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm text-slate-400">
                  Stream key <span className="text-slate-600">(opcional — vazio = gerado automaticamente)</span>
                </span>
                <input
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="deixe vazio para gerar"
                />
              </label>
            </div>
            {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? 'Criando…' : 'Criar câmera'}
              </button>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Cancelar
              </button>
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
            <button
              onClick={() => setCreated(null)}
              className="mt-4 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
            >
              Fechar
            </button>
          </div>
        )}

        {loading && <p className="text-slate-400">Carregando…</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && cameras.length === 0 && (
          <p className="text-slate-400">Nenhuma câmera ainda.</p>
        )}

        {!loading && !error && cameras.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cameras.map((c) => (
              <li key={c.camera_id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{c.name || c.camera_id}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.enabled ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {c.enabled ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-400">{c.camera_id}</div>
                {c.location && <div className="mt-1 text-sm text-slate-500">{c.location}</div>}
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
