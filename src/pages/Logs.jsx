import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '../lib/api'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')
const fmt = (ts) => {
  try { return new Date(ts * 1000).toLocaleString('pt-BR') } catch { return '—' }
}

export default function Logs() {
  const [tab, setTab] = useState('acessos')
  const [acessos, setAcessos] = useState(null)
  const [quedas, setQuedas] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (which) => {
    setLoading(true); setError('')
    try {
      if (which === 'acessos') setAcessos(await api.get('/api/logs/acessos?days=30'))
      else setQuedas(await api.get('/api/logs/quedas?days=7'))
    } catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Logs</h1>
      <p className="mt-1 text-sm text-slate-400">Acessos de usuários e quedas de conexão das câmeras.</p>

      <div className="mt-6 flex gap-6 border-b border-slate-700">
        {[['acessos', 'Acessos'], ['quedas', 'Quedas de câmera']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${tab === key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : tab === 'acessos' ? (
          <LogTable
            rows={acessos}
            empty="Nenhum acesso registrado ainda."
            cols={['Usuário', 'IP', 'Data/hora']}
            render={(r) => [r.email || r.user_id, r.ip || '—', fmt(r.ts)]}
          />
        ) : (
          <LogTable
            rows={quedas}
            empty="Nenhuma queda registrada nos últimos 7 dias."
            cols={['Câmera', 'Data/hora']}
            render={(r) => [r.name || r.camera_id, fmt(r.ts)]}
          />
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {tab === 'acessos'
          ? 'Acessos dos últimos 30 dias (agrupados por sessão de ~30 min).'
          : 'Quedas de conexão (online→offline) dos últimos 7 dias, detectadas a cada 2 min.'}
      </p>
    </main>
  )
}

function LogTable({ rows, cols, render, empty }) {
  if (!rows) return null
  if (rows.length === 0) return <p className="text-sm text-slate-400">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
            {cols.map((c) => <th key={c} className="px-4 py-2.5 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-800 last:border-0">
              {render(r).map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'text-white' : 'text-slate-300'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
