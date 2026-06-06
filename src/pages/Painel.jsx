import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

const API_URL = 'https://api.maaxcam.com.br'

export default function Painel() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [apiResult, setApiResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setStatsLoading(true)
      setStatsError('')
      try {
        const data = await api.get('/api/cameras')
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

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const me = await api.get('/api/me')
        if (active) setIsAdmin(!!me?.is_admin)
      } catch { /* silencioso */ }
    })()
    return () => { active = false }
  }, [])

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

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
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <h1 className="font-display text-2xl font-bold text-white">Você está logado</h1>
          <p className="mt-2 text-slate-300">
            Bem-vindo, <span className="text-white">{user?.email}</span>.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Câmeras" value={statsLoading ? '…' : (stats?.total ?? '—')} />
            <Stat label="Ativas" value={statsLoading ? '…' : (stats?.ativas ?? '—')} />
            <Stat label="No ar" value={statsLoading ? '…' : (stats?.noAr ?? '—')} accent />
          </div>
          {statsError && <p className="mt-3 text-sm text-red-300">{statsError}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/painel/cameras')}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Câmeras
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/painel/admin')}
                className="rounded-lg border border-blue-500 px-4 py-2 font-medium text-blue-200 hover:bg-blue-500 hover:text-white"
              >
                Admin
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/painel/grupos')}
                className="rounded-lg border border-blue-500 px-4 py-2 font-medium text-blue-200 hover:bg-blue-500 hover:text-white"
              >
                Grupos
              </button>
            )}
            <button
              onClick={testApi}
              disabled={testing}
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500 disabled:opacity-50"
            >
              {testing ? 'Testando...' : 'Testar conexão com a API'}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500"
            >
              Sair
            </button>
          </div>

          {apiResult && (
            <pre className="mt-4 overflow-auto rounded-lg border border-slate-600 bg-slate-900 p-4 text-xs text-emerald-300">
              {apiResult}
            </pre>
          )}
        </div>
      </main>
    </>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 p-4 text-center">
      <div className={`text-3xl font-bold ${accent ? 'text-red-300' : 'text-white'}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  )
}
