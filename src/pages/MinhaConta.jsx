import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

// Tela "Minha conta": mostra o email e permite sair/excluir a conta (autoexclusão).
// Comportamento adapta ao perfil:
//  - convidado: sai da conta na hora (1 confirmação)
//  - dono sem câmeras: precisa digitar EXCLUIR
//  - dono com câmeras: backend bloqueia (mostra a mensagem)
export default function MinhaConta() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)      // abriu a área de exclusão
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const m = await api.get('/api/me')
        if (active) setMe(m)
      } catch { /* silencioso */ }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const isGuest = !!me?.owner_id  // convidado tem owner_id preenchido

  async function excluir() {
    setBusy(true); setError('')
    try {
      // dono precisa mandar confirm="EXCLUIR"; convidado não precisa (backend ignora)
      await api.post('/api/account/self-delete', isGuest ? {} : { confirm: confirmText })
      // deu certo: desloga e manda pro login
      try { await signOut() } catch { /* ignore */ }
      navigate('/login', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível concluir.')
      setBusy(false)
    }
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-[800px] px-4 sm:px-6 py-8"><p className="text-slate-400">Carregando…</p></main>
  }

  return (
    <main className="mx-auto w-full max-w-[800px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Minha conta</h1>
      <p className="mt-1 text-sm text-slate-400">Suas informações de acesso.</p>

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <p className="text-xs text-slate-500">E-mail</p>
        <p className="mt-0.5 text-sm text-slate-200">{user?.email}</p>
        <p className="mt-3 text-xs text-slate-500">Tipo de acesso</p>
        <p className="mt-0.5 text-sm text-slate-200">{isGuest ? 'Convidado' : 'Dono da conta'}</p>
        {isGuest && me?.owner_email && (
          <>
            <p className="mt-3 text-xs text-slate-500">Conta de</p>
            <p className="mt-0.5 text-sm text-slate-200">{me.owner_email}</p>
          </>
        )}
      </div>

      {/* Zona de perigo */}
      <div className="mt-8 rounded-xl border border-red-900/60 bg-red-500/5 p-4">
        <p className="text-sm font-semibold text-red-300">
          {isGuest ? 'Sair da conta' : 'Excluir minha conta'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {isGuest
            ? 'Você deixará de ter acesso às câmeras desta conta. Seu e-mail ficará livre para criar uma conta própria ou receber outro convite.'
            : 'Isso remove sua conta e libera seu e-mail. Só é possível se você não tiver câmeras cadastradas — caso tenha, exclua as câmeras e cancele o plano antes.'}
        </p>

        {!open ? (
          <button onClick={() => setOpen(true)}
            className="mt-3 rounded-lg border border-red-800 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">
            {isGuest ? 'Sair da conta' : 'Excluir minha conta'}
          </button>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            {!isGuest && (
              <>
                <p className="text-xs text-slate-300">Para confirmar, digite <span className="font-mono font-bold text-red-300">EXCLUIR</span> abaixo:</p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-red-500 focus:outline-none"
                />
              </>
            )}
            {isGuest && (
              <p className="text-xs text-slate-300">Tem certeza que deseja sair desta conta?</p>
            )}

            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

            <div className="mt-3 flex gap-2">
              <button onClick={excluir} disabled={busy || (!isGuest && confirmText.trim().toUpperCase() !== 'EXCLUIR')}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
                {busy ? 'Processando…' : (isGuest ? 'Sim, sair' : 'Excluir definitivamente')}
              </button>
              <button onClick={() => { setOpen(false); setConfirmText(''); setError('') }} disabled={busy}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
