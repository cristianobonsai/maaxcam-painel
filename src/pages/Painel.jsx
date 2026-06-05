import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Painel() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <h1 className="font-display text-2xl font-bold text-white">Você está logado</h1>
          <p className="mt-2 text-slate-300">
            Bem-vindo, <span className="text-white">{user?.email}</span>.
          </p>
          <p className="mt-4 text-sm text-slate-400">
            As telas de câmeras e grupos chegam na Fase 4. Por enquanto, isto confirma que o
            login está funcionando de ponta a ponta.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500"
          >
            Sair
          </button>
        </div>
      </main>
    </>
  )
}
