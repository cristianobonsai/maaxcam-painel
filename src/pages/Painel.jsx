import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

const API_URL = 'https://api.maaxcam.com.br'

export default function Painel() {
  const { user, session } = useAuth()
  const [apiResult, setApiResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setStatsLoading(true)
      setStatsError('')
      try {
        const data = await api.get('/api/cameras?mine=1')
        const list = Array.isArray(data) ? data : (data?.cameras ?? [])
        if (!active) return
        setStats({
          total: list.length,
          ativas: list.filter((c) => c.enabled).length,
          noAr: list.filter((c) => c.is_streaming).length,
        })
      } catch (e) {
        if (active) setStatsError(e instanceof ApiError ? e.message : 'Erro ao carregar dados.')
      } finally {
        if (active) setStatsLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function testApi() {
    setTesting(true)
    setApiResult(null)
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setApiResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setApiResult('Erro: ' + err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-slate-400">Bem-vindo, <span className="text-slate-200">{user?.email}</span>.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Câmeras" value={statsLoading ? '…' : (stats?.total ?? '—')} />
        <Stat label="Ativas" value={statsLoading ? '…' : (stats?.ativas ?? '—')} />
        <Stat label="No ar" value={statsLoading ? '…' : (stats?.noAr ?? '—')} accent />
      </div>
      {statsError && <p className="mt-3 text-sm text-red-300">{statsError}</p>}

      <div className="mt-6">
        <button onClick={testApi} disabled={testing}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50">
          {testing ? 'Testando...' : 'Testar conexão com a API'}
        </button>
      </div>

      {apiResult && (
        <pre className="mt-4 overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-4 text-xs text-emerald-300">
          {apiResult}
        </pre>
      )}
    </main>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-center">
      <div className={`text-3xl font-bold ${accent ? 'text-red-300' : 'text-white'}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  )
}
