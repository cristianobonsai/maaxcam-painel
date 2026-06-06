import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

export default function Admin() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const meData = await api.get('/api/me')
      setMe(meData)
      if (meData?.is_admin) {
        const usersData = await api.get('/api/admin/users')
        setUsers(Array.isArray(usersData) ? usersData : [])
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    setBusyId(u.user_id)
    setError('')
    try {
      await api.put(`/api/admin/users/${u.user_id}/role`, { role: newRole })
      setUsers((prev) =>
        prev.map((x) => (x.user_id === u.user_id ? { ...x, role: newRole } : x))
      )
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao alterar o papel.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-white">Admin · Usuários</h1>
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
                {users.length} usuário(s) cadastrado(s).
              </p>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-4 space-y-3">
                {users.map((u) => (
                  <div
                    key={u.user_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-600 bg-slate-800 p-4"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-white">{u.email || '(sem email)'}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            u.role === 'admin'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-600 text-slate-200'
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.user_id === me.user_id && (
                          <span className="text-xs text-slate-400">(você)</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRole(u)}
                      disabled={busyId === u.user_id}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50"
                    >
                      {busyId === u.user_id
                        ? '...'
                        : u.role === 'admin'
                        ? 'Rebaixar p/ usuário'
                        : 'Promover a admin'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
