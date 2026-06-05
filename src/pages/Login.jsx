import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Login() {
  const { session, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  // já logado? vai direto pro painel
  if (session) return <Navigate to="/painel" replace />

  async function handleSubmit() {
    if (!email) return
    setStatus('sending')
    setErrorMsg('')
    const { error } = await signInWithEmail(email.trim())
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h1 className="font-display text-xl font-bold text-white">Entrar no painel</h1>
          <p className="mt-2 text-sm text-slate-400">
            Digite seu email e enviamos um link de acesso. Sem senha.
          </p>

          {status === 'sent' ? (
            <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              Link enviado. Confira seu email (e a caixa de spam) e clique no link para entrar.
            </div>
          ) : (
            <div className="mt-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="voce@email.com"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSubmit}
                disabled={status === 'sending'}
                className="mt-3 w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {status === 'sending' ? 'Enviando…' : 'Enviar link de acesso'}
              </button>
              {status === 'error' && <p className="mt-3 text-sm text-red-400">{errorMsg}</p>}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
