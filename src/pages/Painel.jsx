import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

export default function Painel() {
  const { user } = useAuth()
  const [cams, setCams] = useState([])
  const [groups, setGroups] = useState([])
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
      // Grupos: tolerante a falha — cliente sem acesso a grupos não quebra o dashboard.
      try {
        const g = await api.get('/api/groups')
        if (active) setGroups(Array.isArray(g) ? g : [])
      } catch {
        if (active) setGroups([])
      }
    })()
    return () => { active = false }
  }, [])

  const total = cams.length
  const ativas = cams.filter((c) => c.enabled).length
  const noAr = cams.filter((c) => c.is_streaming).length

  const ytCams = cams.filter((c) => c.youtube_key)
  const ytNoAr = cams.filter((c) => c.youtube_relay_active).length
  const ytParados = Math.max(0, ytCams.length - ytNoAr)

  const gruposTotal = groups.length
  const gruposNoAr = groups.filter((g) => g.relay_active).length
  const gruposParados = Math.max(0, gruposTotal - gruposNoAr)

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">Bem-vindo, <span className="text-slate-200">{user?.email}</span>.</p>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Câmeras" value={loading ? '…' : total} />
        <Kpi label="Ativas" value={loading ? '…' : ativas} />
        <Kpi label="No ar" value={loading ? '…' : noAr} accent="green"
          badge={<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">● LIVE</span>} />
        <Kpi label="Grupos" value={loading ? '…' : gruposTotal} accent="blue"
          sub={loading ? null : `${gruposNoAr} no ar · ${gruposParados} parados`} />
        <Kpi label="YouTube no ar" value={loading ? '…' : ytNoAr} accent="red"
          sub={loading ? null : `${ytNoAr} no ar · ${ytParados} parados`} />
      </div>

      <div className="mt-6">
        <AtencaoBanner />
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
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
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
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
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

function Kpi({ label, value, accent, badge, sub }) {
  const valCls = accent === 'green' ? 'text-emerald-300' : accent === 'red' ? 'text-red-300' : accent === 'blue' ? 'text-blue-300' : 'text-white'
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{label}</span>{badge}
      </div>
      <div className={`mt-2 font-display text-3xl font-bold ${valCls}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
