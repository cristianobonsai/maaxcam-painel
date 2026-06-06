import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

const API_URL = 'https://api.maaxcam.com.br'

export default function Painel() {
  const { user, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [apiResult, setApiResult] = useState(null)
  const [testing, setTesting] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function testApi() {
    setTesting(true)
    setApiResult(null)
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setApiResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setApiResult('Erro: ' + err.message)
    } finally {
      setTesting(false)
    }
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
            Acesse suas câmeras pelo botão abaixo. Mais telas (grupos, dashboard) vêm a seguir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/painel/cameras')}
              className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Câmeras
            </button>
            <button
              onClick={testApi}
              disabled={testing}
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500 disabled:opacity-50"
            >
              {testing ? 'Testando...' : 'Testar conexão com a API'}
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500"
            >
              Sair
            </button>
          </div>
          {apiResult && (
            <pre className="mt-4 overflow-auto rounded-lg border border-slate-600 bg-slate-900 p-4 text-xs text-emerald-300">
              {apiResult}
            </pre>
          )}
        </div>
      </main>
    </>
  )
}
