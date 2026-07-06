import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext.jsx'
import { api } from './lib/api'

function Icon({ path, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const ICONS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  cameras: 'M15 10l4.5-2.3A1 1 0 0 1 21 8.6v6.8a1 1 0 0 1-1.5.9L15 14M4 6h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
  map: 'M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3ZM9 3v15M15 6v15',
  notif: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  grupos: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  admin: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6 6 18M6 6l12 12',
  logs: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-7 6h6m-6 4h6',
  faturamento: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
}

export default function Layout() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try { const me = await api.get('/api/me'); if (active) setIsAdmin(!!me?.is_admin) } catch { /* silencioso */ }
    })()
    return () => { active = false }
  }, [])

  async function handleLogout() {
    try { await signOut() } catch { /* ignore */ }
    navigate('/login', { replace: true })
  }

  const items = [
    { to: '/painel', label: 'Dashboard', icon: ICONS.dashboard, end: true },
    { to: '/painel/cameras', label: 'Câmeras', icon: ICONS.cameras },
    { to: '/painel/mapa', label: 'Mapa', icon: ICONS.map },
    { to: '/painel/notificacoes', label: 'Notificações', icon: ICONS.notif },
    { to: '/painel/faturamento', label: 'Faturamento', icon: ICONS.faturamento },
    ...(isAdmin ? [
      { to: '/painel/grupos', label: 'Grupos', icon: ICONS.grupos },
      { to: '/painel/admin', label: 'Admin', icon: ICONS.admin },
      { to: '/painel/logs', label: 'Logs', icon: ICONS.logs },
    ] : []),
  ]

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium border-l-2 ${
      isActive
        ? 'border-blue-500 bg-blue-500/10 text-white'
        : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`

  return (
    <>
      <div className="bg-atmosphere" />

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="text-slate-200">
          <Icon path={ICONS.menu} className="h-6 w-6" />
        </button>
        <span className="font-display font-bold text-white">LiveByBit</span>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-800 bg-slate-900 p-3 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span className="font-display text-lg font-bold text-white">LiveByBit</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="text-slate-400 lg:hidden">
            <Icon path={ICONS.close} className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-3 flex flex-col gap-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} onClick={() => setOpen(false)} className={linkClass}>
              <Icon path={it.icon} className="h-5 w-5" />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200">
          <Icon path={ICONS.logout} className="h-5 w-5" />
          Sair
        </button>
      </aside>

      <div className="relative z-10 lg:pl-60">
        <Outlet />
      </div>
    </>
  )
}
