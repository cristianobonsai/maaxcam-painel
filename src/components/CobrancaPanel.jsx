import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import DadosCobranca from './DadosCobranca.jsx'
import ListaFaturas from './ListaFaturas.jsx'
import DetalheCobranca from './DetalheCobranca.jsx'

const API_URL = 'https://api.livebybit.com'
const money = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const PLAN_LABELS = { basico: 'Básico', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }

// Aba "Cobrança" do Admin: lista clientes (donos) com total, detalhe com resumo,
// baixar PDF (com dados fiscais), enviar por email (PDF anexado) e editar dados fiscais.
export default function CobrancaPanel() {
  const { session } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [sel, setSel] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [flash, setFlash] = useState('')

  async function carregar() {
    setLoading(true); setError('')
    try {
      const d = await api.get('/api/admin/billing')
      setClientes(Array.isArray(d?.clientes) ? d.clientes : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { carregar() }, [])

  async function abrir(uid) {
    setSel(uid); setDetail(null); setDetailLoading(true); setFlash(''); setError('')
    try {
      setDetail(await api.get(`/api/admin/billing/${uid}`))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar cliente.')
    } finally {
      setDetailLoading(false)
    }
  }

  async function baixarPdf(uid) {
    if (!session?.access_token) { setError('Sessão expirada, faça login novamente.'); return }
    setDownloading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/billing/${uid}/pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error(`Falha ao gerar PDF (HTTP ${res.status}).`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'faturamento-livebybit.pdf'
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Erro ao baixar PDF.')
    } finally {
      setDownloading(false)
    }
  }

  async function enviar(uid) {
    setSending(true); setError(''); setFlash('')
    try {
      const r = await api.post(`/api/admin/billing/${uid}/send`, {})
      setFlash(r?.message || 'Fatura enviada.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha ao enviar.')
    } finally {
      setSending(false)
    }
  }

  const lista = clientes.filter((c) =>
    !filter ||
    (c.email || '').toLowerCase().includes(filter.toLowerCase()) ||
    (c.nome || '').toLowerCase().includes(filter.toLowerCase()))

  if (loading) return <p className="mt-6 text-sm text-slate-400">Carregando…</p>

  return (
    <div className="mt-6">
      {error && <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por nome ou e-mail…"
        className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-sm text-slate-500">Nenhum cliente.</p>}
        {lista.map((c) => (
          <div key={c.user_id} className="rounded-xl border border-slate-700 bg-slate-800/60">
            <button onClick={() => (sel === c.user_id ? setSel(null) : abrir(c.user_id))}
              className="flex w-full items-center justify-between gap-3 p-4 text-left">
              <div className="min-w-0">
                <div className="truncate text-white">{c.nome || c.email}</div>
                {c.nome && <div className="truncate text-xs text-slate-400">{c.email}</div>}
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold text-white">{money(c.total_geral)}</div>
                <div className="text-xs text-slate-400">{sel === c.user_id ? 'fechar' : 'abrir'}</div>
              </div>
            </button>

            {sel === c.user_id && (
              <div className="border-t border-slate-700 p-4">
                {detailLoading || !detail ? (
                  <p className="text-sm text-slate-400">Carregando detalhe…</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <DetalheCobranca itens={detail.resumo.itens_por_plano} grupos={detail.resumo.grupos} />
                      <div className="flex justify-between border-t border-slate-700 pt-2 font-semibold text-white">
                        <span>Total</span><span>{money(detail.resumo.total_geral)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button onClick={() => baixarPdf(c.user_id)} disabled={downloading}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white hover:border-blue-500 disabled:opacity-50">
                        {downloading ? 'Gerando…' : 'Baixar PDF'}
                      </button>
                      <button onClick={() => enviar(c.user_id)} disabled={sending}
                        className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                        {sending ? 'Enviando…' : 'Enviar por e-mail'}
                      </button>
                      {flash && <span className="text-sm text-emerald-300">{flash}</span>}
                    </div>

                    <DadosCobranca
                      key={c.user_id}
                      getUrl={`/api/admin/billing/${c.user_id}/info`}
                      putUrl={`/api/admin/billing/${c.user_id}/info`}
                      defaultOpen
                    />
                    <ListaFaturas mode="admin" userId={c.user_id} />
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
