import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

export default function Grupos() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const meData = await api.get('/api/me')
      setMe(meData)
      if (meData?.is_admin) {
        const data = await api.get('/api/groups')
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-white">Grupos</h1>
            <button
              onClick={() => navigate('/painel')}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500"
            >
              Voltar
            </button>
          </div>

          {loading && <p className="mt-6 text-slate-300">Carregando…</p>}

          {!loading && me && !me.is_admin && (
            <p className="mt-6 text-red-300">Acesso restrito a administradores.</p>
          )}

          {!loading && me?.is_admin && (
            <>
              <p className="mt-2 text-sm text-slate-400">
                {groups.length} grupo(s) cadastrado(s).
              </p>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-4 space-y-3">
                {groups.map((g) => (
                  <div key={g.id} className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-white">
                          {g.name || '(sem nome)'}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {g.relay_active ? (
                            <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">No ar</span>
                          ) : (
                            <span className="rounded bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-200">Parado</span>
                          )}
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              g.enabled ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200'
                            }`}
                          >
                            {g.enabled ? 'Habilitado' : 'Desabilitado'}
                          </span>
                          {!g.youtube_key && (
                            <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Sem YouTube key</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-slate-400">
                        <div>transição: {g.transition_seconds}s</div>
                        <div>{g.cameras?.length ?? 0} câmera(s)</div>
                      </div>
                    </div>

                    {g.cameras?.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3">
                        {g.cameras.map((c, i) => (
                          <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-slate-200">
                              {i + 1}. {c.camera_name || c.camera_id}
                            </span>
                            <span className="shrink-0 text-slate-400">{c.duration_seconds}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {groups.length === 0 && !error && (
                  <p className="text-slate-400">Nenhum grupo cadastrado.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
