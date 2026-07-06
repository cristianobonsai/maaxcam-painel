import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')
const PLAN_LABELS = { basico: 'Básico', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }
const money = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Faturamento() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      setData(await api.get('/api/billing/summary'))
    } catch (e) {
      setError(msg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 relative z-10">
        <h1 className="font-display text-2xl font-bold text-white">Faturamento</h1>
        <p className="mt-1 text-sm text-slate-400">Resumo de cobrança das suas câmeras e grupos.</p>

        {loading && <p className="mt-8 text-slate-300">Carregando…</p>}
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {!loading && !error && data && (
          <>
            <div className="mt-6 space-y-3">
              {data.itens_por_plano.length === 0 && (
                <p className="text-slate-400">Você ainda não tem câmeras cadastradas.</p>
              )}
              {data.itens_por_plano.map((item) => {
                const temDesconto = item.preco_unitario < item.preco_cheio
                return (
                  <div key={item.plan} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-display font-semibold text-white">{PLAN_LABELS[item.plan] || item.plan}</span>
                        <span className="ml-2 text-sm text-slate-400">{item.quantidade} câmera(s)</span>
                      </div>
                      <div className="text-right">
                        {temDesconto ? (
                          <div>
                            <span className="text-sm text-slate-500 line-through">{money(item.preco_cheio)}/câmera</span>
                            <span className="ml-2 text-sm font-medium text-emerald-300">{money(item.preco_unitario)}/câmera</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-300">{money(item.preco_unitario)}/câmera</span>
                        )}
                        <div className="mt-0.5 font-semibold text-white">{money(item.subtotal)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {data.groups_addon && (
              <div className="mt-6">
                <h2 className="font-display text-lg font-semibold text-white">Grupos</h2>
                <div className="mt-3 space-y-3">
                  {data.grupos.length === 0 && <p className="text-slate-400">Nenhum grupo criado ainda.</p>}
                  {data.grupos.map((g) => {
                    const temDesconto = g.preco < g.preco_cheio
                    return (
                      <div key={g.id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-white">{g.name || `Grupo ${g.id}`}</span>
                          <div className="text-right">
                            {temDesconto ? (
                              <div>
                                <span className="text-sm text-slate-500 line-through">{money(g.preco_cheio)}</span>
                                <span className="ml-2 font-semibold text-emerald-300">{money(g.preco)}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-white">{money(g.preco)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-blue-500/40 bg-blue-500/10 p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-white">Total do ciclo</span>
                <span className="font-display text-2xl font-bold text-white">{money(data.total_geral)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Cobrança manual — você receberá a fatura com os dados de pagamento por e-mail/WhatsApp.
              </p>
            </div>
          </>
        )}
      </main>
    </>
  )
}
