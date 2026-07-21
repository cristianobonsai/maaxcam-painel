import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

const PERMS = [
  { key: 'can_add_cameras', label: 'Cadastrar câmeras' },
  { key: 'can_edit_cameras', label: 'Editar câmeras' },
  { key: 'can_change_plan', label: 'Trocar plano' },
  { key: 'can_create_groups', label: 'Criar grupos' },
  { key: 'can_edit_notif', label: 'Editar notificação' },
]

function iniciais(email) {
  const nome = (email || '').split('@')[0] || ''
  return (nome.slice(0, 2) || '?').toUpperCase()
}

export default function Usuarios() {
  const [invites, setInvites] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notOwner, setNotOwner] = useState(false)

  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  async function carregar() {
    setError('')
    try {
      const [inv, mem] = await Promise.all([
        api.get('/api/account/invites'),
        api.get('/api/account/members'),
      ])
      setInvites(Array.isArray(inv) ? inv.filter((i) => i.status === 'pending') : [])
      setMembers(Array.isArray(mem) ? mem : [])
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setNotOwner(true)   // convidado nao ve essa tela
      } else {
        setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function enviarConvite() {
    const e = email.trim()
    if (!e) return
    setInviting(true); setInviteMsg(''); setError('')
    try {
      await api.post('/api/account/invites', { email: e })
      setEmail('')
      setInviteMsg('Convite enviado.')
      await carregar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o convite.')
    } finally {
      setInviting(false)
    }
  }

  async function cancelarConvite(id) {
    setError('')
    try {
      await api.del(`/api/account/invites/${id}`)
      await carregar()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cancelar.')
    }
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8"><p className="text-slate-400">Carregando…</p></main>
  }

  if (notOwner) {
    return (
      <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-white">Usuários</h1>
        <p className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
          Apenas o dono da conta pode gerenciar usuários.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Usuários</h1>
      <p className="mt-1 text-sm text-slate-400">Convide pessoas e defina o que cada uma pode fazer na sua conta.</p>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* Convidar */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <p className="mb-2 text-sm font-medium text-slate-300">Convidar pessoa</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') enviarConvite() }}
            placeholder="email@empresa.com"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button onClick={enviarConvite} disabled={inviting}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
            {inviting ? 'Enviando…' : 'Enviar convite'}
          </button>
        </div>
        {inviteMsg && <p className="mt-2 text-xs text-emerald-300">{inviteMsg}</p>}
      </div>

      {/* Convites pendentes */}
      <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">Convites pendentes</p>
      {invites.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum convite pendente.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {invites.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-amber-400" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                <span className="text-sm text-slate-200">{i.email}</span>
                <span className="text-xs text-slate-500">aguardando aceite</span>
              </div>
              <button onClick={() => cancelarConvite(i.id)}
                className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                Cancelar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Convidados ativos */}
      <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">Convidados ativos</p>
      {members.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum convidado ainda. Envie um convite acima.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {members.map((m) => (
            <MemberCard key={m.user_id} member={m} onChanged={carregar} onError={setError} />
          ))}
        </div>
      )}
    </main>
  )
}

function MemberCard({ member, onChanged, onError }) {
  const [perms, setPerms] = useState(member.permissions || {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  function toggle(key) {
    setPerms((p) => ({ ...p, [key]: p[key] ? 0 : 1 }))
    setSaved(false)
  }

  async function salvar() {
    setSaving(true); onError('')
    try {
      await api.put(`/api/account/members/${member.user_id}/permissions`, perms)
      setSaved(true)
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível salvar as permissões.')
    } finally {
      setSaving(false)
    }
  }

  async function remover() {
    onError('')
    try {
      await api.del(`/api/account/members/${member.user_id}`)
      onChanged()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível remover.')
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-500/15 text-xs font-semibold text-blue-400">
            {iniciais(member.email)}
          </div>
          <span className="text-sm font-medium text-white">{member.email}</span>
        </div>
        {!confirmRemove ? (
          <button onClick={() => setConfirmRemove(true)}
            className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
            Remover
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Remover da conta?</span>
            <button onClick={remover} className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500">Sim</button>
            <button onClick={() => setConfirmRemove(false)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50">Não</button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-700 pt-3">
        {PERMS.map((p) => (
          <label key={p.key} className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
            <input type="checkbox" checked={!!perms[p.key]} onChange={() => toggle(p.key)}
              className="h-4 w-4 accent-blue-500" />
            {p.label}
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button onClick={salvar} disabled={saving}
          className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60">
          {saving ? 'Salvando…' : 'Salvar permissões'}
        </button>
        {saved && <span className="text-xs text-emerald-300">✓ Salvo</span>}
      </div>
    </div>
  )
}
