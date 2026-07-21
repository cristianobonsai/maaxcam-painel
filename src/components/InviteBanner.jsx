import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

// Banner de convite pendente. Aparece no topo do Dashboard quando o /api/me
// indica que o usuario logado tem um convite esperando resposta.
// Aceitar -> vira convidado e recarrega. Recusar -> pede confirmacao, descarta o convite.
export default function InviteBanner() {
  const [invite, setInvite] = useState(null)   // { owner_email } | null
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const me = await api.get('/api/me')
        if (active) setInvite(me?.pending_invite ?? null)
      } catch {
        // silencioso: se /api/me falhar, o resto do painel ja trata
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function aceitar() {
    setBusy(true); setError('')
    try {
      await api.post('/api/account/accept-invite')
      // recarrega pra o painel reconstruir tudo ja como convidado
      window.location.reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível aceitar o convite.')
      setBusy(false)
    }
  }

  async function recusar() {
    setBusy(true); setError('')
    try {
      await api.post('/api/account/decline-invite')
      setInvite(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível recusar o convite.')
    } finally {
      setBusy(false)
      setConfirmDecline(false)
    }
  }

  if (loading || !invite) return null

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-blue-500/15 text-blue-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <path d="m22 7-10 5L2 7" />
          </svg>
        </div>
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-semibold text-white">Você recebeu um convite</p>
          <p className="mt-0.5 text-xs text-slate-400">
            <span className="text-slate-200">{invite.owner_email}</span> convidou você para a conta dele.
          </p>
        </div>

        {!confirmDecline ? (
          <div className="flex gap-2">
            <button onClick={aceitar} disabled={busy}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
              {busy ? 'Aceitando…' : 'Aceitar'}
            </button>
            <button onClick={() => setConfirmDecline(true)} disabled={busy}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 disabled:opacity-60">
              Recusar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Recusar o convite?</span>
            <button onClick={recusar} disabled={busy}
              className="rounded-lg bg-red-500/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">
              {busy ? 'Recusando…' : 'Sim, recusar'}
            </button>
            <button onClick={() => setConfirmDecline(false)} disabled={busy}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 disabled:opacity-60">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      <p className="mt-3 text-[11px] text-slate-500">
        Ao aceitar, você passa a acessar as câmeras que o dono liberar. Ao recusar, o convite é descartado e você segue com sua própria conta.
      </p>
    </div>
  )
}
