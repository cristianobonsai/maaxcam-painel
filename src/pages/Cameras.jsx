import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

export default function Cameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-6 py-4">
        <Link to="/painel" className="text-sm text-slate-400 hover:text-slate-200">← Painel</Link>
        <h1 className="text-lg font-semibold">Câmeras</h1>
        <button
          onClick={load}
          className="ml-auto rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-700"
        >
          Atualizar
        </button>
      </header>

      <main className="px-6 py-6">
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
