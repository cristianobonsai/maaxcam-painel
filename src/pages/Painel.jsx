import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

export default function Painel() {
  const { user } = useAuth()
  const [cams, setCams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const data = await api.get('/api/cameras?mine=1')
        const list = Array.isArray(data) ? data : (data?.cameras ?? [])
        if (active) setCams(list)
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const total = cams.length
  const ativas = cams.filter((c) => c.enabled).length
  const noAr = cams.filter((c) => c.is_streaming).length
  const ytNoAr = cams.filter((c) => c.youtube_relay_active).length
  const ytCams = cams.filter((c) => c.youtube_key)

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">Bem-vindo, <span className="text-slate-200">{user?.email}</span>.</p>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <AtencaoBanner />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Câmeras" value={loading ? '…' : total} />
        <Kpi label="Ativas" value={loading ? '…' : ativas} />
        <Kpi label="No ar" value={loading ? '…' : noAr} accent="green"
          badge={<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">● LIVE</span>} />
        <Kpi label="YouTube no ar" value={loading ? '…' : ytNoAr} accent="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Suas câmeras</h2>
            <Link to="/painel/cameras" className="text-sm font-semibold text-blue-300 hover:text-blue-200">Ver todas</Link>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Carregando…</p>
          ) : cams.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Você ainda não tem câmeras. <Link to="/painel/cameras" className="text-blue-300 hover:text-blue-200">Adicionar a primeira</Link>.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/70 text-left text-xs text-slate-400">
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Câmera</th>
                    <th className="px-2 py-2.5 font-medium">YouTube</th>
                    <th className="px-2 py-2.5 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {cams.map((c) => {
                    const st = camStatus(c)
                    const yt = ytBadge(c)
                    return (
                      <tr key={c.camera_id} className="border-b border-slate-800">
                        <td className="px-2 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${st.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.led}`} />{st.label}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="font-medium text-white">{c.name || c.camera_id}</div>
                          {c.location && <div className="text-xs text-slate-400">{c.location}</div>}
                        </td>
                        <td className="px-2 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${yt.cls}`}>{yt.label}</span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Link to={`/painel/cameras/${c.camera_id}/seguranca`} className="text-sm font-semibold text-blue-300 hover:text-blue-200">Gerenciar</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="font-display text-base font-semibold text-white">Transmissão YouTube</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Carregando…</p>
          ) : ytCams.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Nenhuma câmera com transmissão YouTube configurada. Disponível nos planos Pro e Premium.</p>
          ) : (
            <div className="mt-2 divide-y divide-slate-800">
              {ytCams.map((c) => (
                <div key={c.camera_id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-6 w-9 place-items-center rounded-md text-[10px] font-bold text-white ${c.youtube_relay_active ? 'bg-red-500' : 'bg-slate-600'}`}>YT</span>
                    <div>
                      <div className="font-medium text-white">{c.name || c.camera_id}</div>
                      <div className="text-xs text-slate-400">{c.youtube_relay_active ? 'relay no ar' : 'chave configurada'}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${c.youtube_relay_active ? 'bg-red-500/15 text-red-300' : 'bg-slate-600/25 text-slate-400'}`}>
                    {c.youtube_relay_active ? '● Ativo' : '— Inativo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function AtencaoBanner() {
  const [mon, setMon] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let active = true
    const fetchMon = async () => {
      try { const d = await api.get('/api/monitoring?mine=1'); if (active) { setMon(Array.isArray(d) ? d : []); setReady(true) } }
      catch { if (active) setReady(true) }
    }
    fetchMon()
    const t = setInterval(fetchMon, 30000)
    return () => { active = false; clearInterval(t) }
  }, [])

  if (!ready || !mon) return null

  const problems = mon.filter((c) => c.status_geral && c.status_geral !== 'ok')
  if (problems.length === 0) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Tudo certo — todas as câmeras saudáveis.
      </div>
    )
  }

  const count = (s) => problems.filter((c) => c.status_geral === s).length
  const chips = [
    { n: count('fora_do_ar'), label: 'fora do ar', cls: 'bg-red-500/15 text-red-300' },
    { n: count('instavel'), label: 'instáveis', cls: 'bg-red-500/15 text-red-300' },
    { n: count('saida_off'), label: 'relay desligado', cls: 'bg-amber-500/15 text-amber-300' },
    { n: count('ajustar'), label: 'precisam de ajuste', cls: 'bg-orange-500/15 text-orange-300' },
  ].filter((x) => x.n > 0)

  const reasonOf = (c) => {
    if (c.status_geral === 'fora_do_ar') return 'Fora do ar'
    if (c.status_geral === 'instavel') return `Instável (${c.drops_24h} quedas/24h)`
    if (c.status_geral === 'saida_off') return 'Relay do YouTube desligado'
    if (c.status_geral === 'ajustar') return c.ajustes_motivo || 'Precisa ajustar'
    return ''
  }
  const dotOf = (c) => ((c.status_geral === 'ajustar' || c.status_geral === 'saida_off') ? 'bg-orange-400' : 'bg-red-400')

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-display text-base font-semibold text-amber-200">
          {problems.length} {problems.length === 1 ? 'câmera precisa' : 'câmeras precisam'} de atenção
        </span>
        {chips.map((ch, i) => (
          <span key={i} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ch.cls}`}>{ch.n} {ch.label}</span>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-amber-500/15">
        {problems.slice(0, 6).map((c) => (
          <li key={c.camera_id} className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotOf(c)}`} />
              <span className="truncate text-sm text-white">{c.name || c.camera_id}</span>
              <span className="truncate text-xs text-slate-400">— {reasonOf(c)}</span>
            </div>
            <Link to={`/painel/cameras/${c.camera_id}/seguranca`} className="shrink-0 text-xs font-semibold text-blue-300 hover:text-blue-200">Gerenciar</Link>
          </li>
        ))}
      </ul>
      {problems.length > 6 && (
        <div className="mt-1 text-xs text-slate-400">e mais {problems.length - 6}… <Link to="/painel/cameras" className="text-blue-300 hover:text-blue-200">ver todas</Link></div>
      )}
    </div>
  )
}

function camStatus(c) {
  if (!c.enabled) return { label: 'Desativada', badge: 'bg-slate-600/30 text-slate-300', led: 'bg-slate-400' }
  if (c.is_streaming) return { label: 'No ar', badge: 'bg-emerald-500/15 text-emerald-300', led: 'bg-emerald-400' }
  return { label: 'Ociosa', badge: 'bg-blue-500/12 text-blue-300', led: 'bg-blue-400' }
}

function ytBadge(c) {
  if (c.youtube_relay_active) return { label: '● Ativo', cls: 'bg-red-500/15 text-red-300' }
  if (c.youtube_key) return { label: '— Inativo', cls: 'bg-slate-600/25 text-slate-400' }
  return { label: '—', cls: 'bg-slate-600/20 text-slate-500' }
}

function Kpi({ label, value, accent, badge }) {
  const valCls = accent === 'green' ? 'text-emerald-300' : accent === 'red' ? 'text-red-300' : 'text-white'
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{label}</span>{badge}
      </div>
      <div className={`mt-2 font-display text-3xl font-bold ${valCls}`}>{value}</div>
    </div>
  )
}
