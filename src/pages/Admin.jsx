import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')

function healthBar(p) {
  return p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
}

function SystemHealth() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    async function tick() {
      try {
        const d = await api.get('/api/admin/system')
        if (alive) { setData(d); setError('') }
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : 'Erro inesperado.')
      }
    }
    tick()
    const id = setInterval(tick, 5000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  if (error) return <p className="mt-6 text-sm text-red-300">{error}</p>
  if (!data) return <p className="mt-6 text-sm text-slate-400">Carregando saúde do servidor…</p>
  const cpu = data.cpu || {}, mem = data.mem || {}, disk = data.disk || {}
  const net = data.net || {}, viewers = data.viewers || {}, cap = data.capacity || {}
  const cards = [
    { label: `CPU (${cpu.ncpu ?? '?'} vCPU)`, pct: cpu.pct ?? 0, detail: `carga ${cpu.load1 ?? 0} de ${cpu.ncpu ?? 0}` },
    { label: 'Memória', pct: mem.pct ?? 0, detail: `${mem.used_mb ?? 0} de ${mem.total_mb ?? 0} MB` },
    { label: 'Disco', pct: disk.pct ?? 0, detail: `${disk.used_gb ?? 0} de ${disk.total_gb ?? 0} GB` },
    { label: 'Banda (upload)', pct: net.pct ?? 0, detail: `${net.tx_mbps ?? 0} de ${net.cap_mbps ?? 1000} Mbps` },
  ]
  const upDays = Math.floor((data.uptime_secs || 0) / 86400)
  const upHours = Math.floor(((data.uptime_secs || 0) % 86400) / 3600)
  const maxView = cap.viewers_max_estimado ?? 0
  const restView = cap.viewers_restantes ?? 0
  const usadoView = Math.max(maxView - restView, 0)
  const pctView = maxView > 0 ? Math.round((usadoView / maxView) * 100) : 0
  const topCams = Array.isArray(viewers.por_camera) ? viewers.por_camera : []
  return (
    <div className="mt-6">
      <p className="text-sm text-slate-400">Atualiza a cada 5 segundos.</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{c.pct}%</div>
            <div className="mt-0.5 text-xs text-slate-500">{c.detail}</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div className={`h-full rounded-full ${healthBar(c.pct)}`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Capacidade de espectadores */}
      <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-xs uppercase tracking-wide text-slate-400">Capacidade de espectadores</div>
          <div className="text-xs text-slate-500">~{cap.mbps_por_espectador ?? '?'} Mbps por espectador</div>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{restView}</span>
          <span className="text-sm text-slate-400">livres de ~{maxView} simultâneos</span>
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          pico de hoje: {viewers.hoje_pico_total ?? 0} espectador(es) · estimativa baseada na banda de {net.cap_mbps ?? 1000} Mbps
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div className={`h-full rounded-full ${healthBar(pctView)}`} style={{ width: `${Math.min(pctView, 100)}%` }} />
        </div>
        {topCams.length > 0 && (
          <div className="mt-3 border-t border-slate-700 pt-3">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Mais assistidas hoje (pico)</div>
            <ul className="space-y-1">
              {topCams.map((c) => (
                <li key={c.camera_id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate pr-2">{c.name || c.camera_id}</span>
                  <span className="text-slate-400 tabular-nums">{c.pico}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm">
        <span className="text-slate-400">No ar há </span>
        <span className="text-slate-200">{upDays} dias e {upHours} h sem reiniciar</span>
      </div>
    </div>
  )
}
const PLAN_LABELS = { basico: 'Básico', pro: 'Pro', premium: 'Premium', grupo: 'Grupo (por grupo criado)' }

function DiscountsPanel({ users }) {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [plan, setPlan] = useState('basico')
  const [preco, setPreco] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const data = await api.get('/api/admin/discounts')
      setDiscounts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(msg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function discountFor(userId, plan) {
    const d = discounts.find((x) => x.user_id === userId && x.plan === plan)
    return d ? d.preco_customizado : null
  }

  function selectUser(u) {
    setSelectedUser(u)
    setPlan('basico')
    const atual = discountFor(u.user_id, 'basico')
    setPreco(atual != null ? String(atual) : '')
    setSaveError('')
  }

  function changePlan(newPlan) {
    setPlan(newPlan)
    const atual = discountFor(selectedUser.user_id, newPlan)
    setPreco(atual != null ? String(atual) : '')
  }

  async function salvar() {
    if (!selectedUser) return
    setSaving(true); setSaveError('')
    try {
      const valor = preco.trim() === '' ? null : Number(preco)
      await api.put(`/api/admin/discounts/${selectedUser.user_id}/${plan}`, { preco_customizado: valor })
      await load()
    } catch (e) {
      setSaveError(msg(e))
    } finally {
      setSaving(false)
    }
  }

  async function remover() {
    if (!selectedUser) return
    setSaving(true); setSaveError('')
    try {
      await api.put(`/api/admin/discounts/${selectedUser.user_id}/${plan}`, { preco_customizado: null })
      setPreco('')
      await load()
    } catch (e) {
      setSaveError(msg(e))
    } finally {
      setSaving(false)
    }
  }

  const visibleUsers = users.filter((u) => (u.email || '').toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-[0.95fr_1.7fr] gap-5 items-start">
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">Usuários</div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por email…"
          className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        <div className="space-y-2">
          {visibleUsers.map((u) => {
            const sel = selectedUser?.user_id === u.user_id
            const temDesconto = discounts.some((d) => d.user_id === u.user_id)
            return (
              <button key={u.user_id} onClick={() => selectUser(u)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left ${sel ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}>
                <div className="min-w-0">
                  <div className="truncate text-sm text-slate-200">{u.email || '(sem email)'}</div>
                  {temDesconto && <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">tem desconto</span>}
                </div>
              </button>
            )
          })}
          {visibleUsers.length === 0 && <p className="text-xs text-slate-500">Nenhum usuário encontrado.</p>}
        </div>
      </div>

      <div>
        {loading && <p className="text-sm text-slate-400">Carregando descontos…</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {!selectedUser ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center text-sm text-slate-400">
            Selecione um usuário à esquerda para definir descontos.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
            <p className="text-sm text-slate-300">
              Desconto pra <strong className="text-white">{selectedUser.email || selectedUser.user_id}</strong>
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Item</span>
                <select value={plan} onChange={(e) => changePlan(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  {Object.entries(PLAN_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Preço customizado (R$) — vazio = sem desconto</span>
                <input value={preco} onChange={(e) => setPreco(e.target.value)} type="number" step="0.01" min="0"
                  placeholder="Ex.: 5.00"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
              </label>
            </div>
            {saveError && <p className="mt-3 text-sm text-red-300">{saveError}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={salvar} disabled={saving}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {saving ? 'Salvando…' : 'Salvar desconto'}
              </button>
              <button onClick={remover} disabled={saving}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-red-500 disabled:opacity-50">
                Remover desconto deste item
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [planBusy, setPlanBusy] = useState(null)

  const [tab, setTab] = useState('users')
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [cams, setCams] = useState([])
  const [camsLoading, setCamsLoading] = useState(false)
  const [camsError, setCamsError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const meData = await api.get('/api/me')
      setMe(meData)
      if (meData?.is_admin) {
        const usersData = await api.get('/api/admin/users')
        setUsers(Array.isArray(usersData) ? usersData : [])
      }
    } catch (e) {
      setError(msg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    setBusyId(u.user_id); setError('')
    try {
      await api.put(`/api/admin/users/${u.user_id}/role`, { role: newRole })
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, role: newRole } : x)))
    } catch (e) {
      setError(msg(e))
    } finally {
      setBusyId(null)
    }
  }

  async function setGroupsAddon(u, enabled) {
    setPlanBusy(u.user_id); setError('')
    try {
      await api.put(`/api/admin/users/${u.user_id}/groups-addon`, { enabled })
      setUsers((prev) => prev.map((x) => (x.user_id === u.user_id ? { ...x, groups_addon: enabled } : x)))
      if (selected?.user_id === u.user_id) setSelected((s) => ({ ...s, groups_addon: enabled }))
    } catch (e) {
      setError(msg(e))
    } finally {
      setPlanBusy(null)
    }
  }

  async function selectUser(u) {
    setSelected(u); setCams([]); setCamsError(''); setCamsLoading(true)
    try {
      const data = await api.get(`/api/cameras?user_id=${encodeURIComponent(u.user_id)}`)
      setCams(Array.isArray(data) ? data : (data?.cameras ?? []))
    } catch (e) {
      setCamsError(msg(e))
    } finally {
      setCamsLoading(false)
    }
  }

  const visible = users.filter((u) => (u.email || '').toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Admin</h1>
            <p className="mt-1 text-sm text-slate-400">Usuários e câmeras por conta.</p>
          </div>
        </div>

        {loading && <p className="mt-8 text-slate-300">Carregando…</p>}
        {!loading && me && !me.is_admin && <p className="mt-8 text-red-300">Acesso restrito a administradores.</p>}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {!loading && me?.is_admin && (
          <>
            <div className="mt-6 flex gap-6 border-b border-slate-700">
              {[['users', 'Usuários'], ['cameras', 'Câmeras por usuário'], ['discounts', 'Descontos'], ['health', 'Saúde']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${tab === key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'health' ? (
  <SystemHealth />
) : tab === 'discounts' ? (
  <DiscountsPanel users={users} />
) : tab === 'users' ? (
              <div className="mt-6">
                <p className="text-sm text-slate-400">{users.length} usuário(s) cadastrado(s).</p>
                <div className="mt-4 space-y-3">
                  {users.map((u) => (
                    <div key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                      <div className="min-w-0">
                        <div className="truncate text-white">{u.email || '(sem email)'}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-600/40 text-slate-300'}`}>{u.role}</span>
                          {u.user_id === me.user_id && <span className="text-xs text-slate-400">(você)</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-slate-400">
                          Grupos
                          <select value={u.groups_addon ? '1' : '0'} disabled={planBusy === u.user_id}
                            onChange={(e) => setGroupsAddon(u, e.target.value === '1')}
                            className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50">
                            <option value="0">Desabilitado</option>
                            <option value="1">Habilitado</option>
                          </select>
                        </label>
                        <button onClick={() => toggleRole(u)} disabled={busyId === u.user_id}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50">
                          {busyId === u.user_id ? '...' : u.role === 'admin' ? 'Rebaixar p/ usuário' : 'Promover a admin'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[0.95fr_1.7fr] gap-5 items-start">
                <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                  <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">Usuários</div>
                  <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por email…"
                    className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
                  <div className="space-y-2">
                    {visible.map((u) => {
                      const sel = selected?.user_id === u.user_id
                      return (
                        <button key={u.user_id} onClick={() => selectUser(u)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left ${sel ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}>
                          <div className="min-w-0">
                            <div className="truncate text-sm text-slate-200">{u.email || '(sem email)'}</div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${u.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-600/40 text-slate-300'}`}>{u.role}</span>
                              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                {u.groups_addon ? 'Grupos ✓' : 'Sem grupos'}
                              </span>
                              {u.user_id === me.user_id && <span className="text-[11px] text-slate-500">(você)</span>}
                            </div>
                          </div>
                          {sel && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-blue-400"><path d="M9 18l6-6-6-6" /></svg>}
                        </button>
                      )
                    })}
                    {visible.length === 0 && <p className="text-xs text-slate-500">Nenhum usuário encontrado.</p>}
                  </div>
                </div>

                <div>
                  {!selected ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center text-sm text-slate-400">
                      Selecione um usuário à esquerda para ver as câmeras dele.
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01" /></svg>
                        <span>Visão de administrador — você está vendo as câmeras de <strong className="text-white">{selected.email || selected.user_id}</strong>, não as suas.</span>
                      </div>

                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
                        <div className="text-sm text-slate-300">
                          Grupos de <strong className="text-white">{selected.email || selected.user_id}</strong>
                          <span className="ml-2 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-300">
                            {selected.groups_addon ? 'Habilitado' : 'Desabilitado'}
                          </span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                          Grupos habilitado
                          <select value={selected.groups_addon ? '1' : '0'} disabled={planBusy === selected.user_id}
                            onChange={(e) => setGroupsAddon(selected, e.target.value === '1')}
                            className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50">
                            <option value="0">Desabilitado</option>
                            <option value="1">Habilitado</option>
                          </select>
                        </label>
                      </div>

                      {camsLoading && <p className="text-sm text-slate-400">Carregando câmeras…</p>}
                      {camsError && <p className="text-sm text-red-300">{camsError}</p>}
                      {!camsLoading && !camsError && cams.length === 0 && <p className="text-sm text-slate-400">Este usuário não tem câmeras.</p>}

                      {!camsLoading && cams.length > 0 && (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {cams.map((c) => (
                            <li key={c.camera_id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-white">{c.name || c.camera_id}</span>
                                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                  {c.is_streaming && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">● No ar</span>}
                                  {c.youtube_relay_active && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">YouTube</span>}
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-600/40 text-slate-300'}`}>{c.enabled ? 'Ativa' : 'Inativa'}</span>
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-slate-400">{c.camera_id}</div>
                              {c.location && <div className="mt-0.5 text-sm text-slate-500">{c.location}</div>}
                              <Link to={`/painel/cameras/${c.camera_id}/seguranca`}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-blue-300 hover:border-blue-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                                Abrir
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
