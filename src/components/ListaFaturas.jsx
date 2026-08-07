import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext.jsx'
import DetalheCobranca from './DetalheCobranca.jsx'

const API_URL = 'https://api.livebybit.com'
const money = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const hojeMes = () => new Date().toISOString().slice(0, 7)
const venc7 = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10) }
const fmtData = (s) => { if (!s) return '—'; const p = String(s).slice(0, 10).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s }
const fmtComp = (s) => { if (!s) return ''; const p = String(s).split('-'); return p.length >= 2 ? `${p[1]}/${p[0]}` : s }

const BADGE = {
  pendente: 'bg-amber-500/15 text-amber-300',
  paga: 'bg-emerald-500/15 text-emerald-300',
  vencida: 'bg-red-500/15 text-red-300',
  cancelada: 'bg-slate-600/40 text-slate-400',
}
const LABEL = { pendente: 'Pendente', paga: 'Paga', vencida: 'Vencida', cancelada: 'Cancelada' }

// Lista de faturas reutilizavel. mode='admin' mostra o gerador + acoes; mode='cliente' e so-leitura.
export default function ListaFaturas({ mode = 'cliente', userId = null }) {
  const isAdmin = mode === 'admin'
  const { session } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const [flash, setFlash] = useState('')
  const [comp, setComp] = useState(hojeMes())
  const [venc, setVenc] = useState(venc7())
  const [gerando, setGerando] = useState(false)
  const [abertoId, setAbertoId] = useState(null)
  const [detalhe, setDetalhe] = useState(null)
  const [detLoading, setDetLoading] = useState(false)

  const listUrl = isAdmin ? `/api/admin/billing/${userId}/invoices` : '/api/billing/invoices'

  async function carregar() {
    setLoading(true); setError('')
    try {
      const d = await api.get(listUrl)
      setInvoices(Array.isArray(d?.invoices) ? d.invoices : [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar faturas.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { carregar() }, [userId, mode])  // eslint-disable-line

  async function gerar() {
    setGerando(true); setError(''); setFlash('')
    try {
      const r = await api.post(`/api/admin/billing/${userId}/invoices`, { competencia: comp, vencimento: venc })
      setFlash(r?.message || 'Fatura gerada.')
      await carregar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha ao gerar fatura.')
    } finally {
      setGerando(false)
    }
  }

  async function acao(id, path, label) {
    setBusy(id); setError(''); setFlash('')
    try {
      const r = await api.post(`/api/admin/invoices/${id}/${path}`, {})
      setFlash(r?.message || `${label} ok.`)
      await carregar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Falha: ${label}.`)
    } finally {
      setBusy(null)
    }
  }

  async function baixarPdf(id) {
    if (!session?.access_token) { setError('Sessão expirada, faça login novamente.'); return }
    const url = isAdmin ? `${API_URL}/api/admin/invoices/${id}/pdf` : `${API_URL}/api/billing/invoices/${id}/pdf`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) throw new Error(`Falha ao gerar PDF (HTTP ${res.status}).`)
      const blob = await res.blob()
      const u = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = u; a.download = 'fatura-livebybit.pdf'
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(u)
    } catch (e) {
      setError(e.message || 'Erro ao baixar PDF.')
    }
  }

  async function toggleDetalhe(id) {
    if (abertoId === id) { setAbertoId(null); setDetalhe(null); return }
    setAbertoId(id); setDetalhe(null); setDetLoading(true); setError('')
    const url = isAdmin ? `/api/admin/invoices/${id}` : `/api/billing/invoices/${id}`
    try {
      setDetalhe(await api.get(url))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar detalhe.')
    } finally {
      setDetLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t border-slate-700 pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {isAdmin ? 'Faturas' : 'Minhas faturas'}
      </p>

      {isAdmin && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">Competência</label>
            <input type="month" value={comp} onChange={(e) => setComp(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-400">Vencimento</label>
            <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <button onClick={gerar} disabled={gerando}
            className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
            {gerando ? 'Gerando…' : 'Gerar fatura'}
          </button>
        </div>
      )}

      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}
      {flash && <p className="mb-2 text-sm text-emerald-300">{flash}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Carregando…</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma fatura ainda.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((f) => {
            const st = f.status_efetivo || f.status
            return (
              <div key={f.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[st] || BADGE.pendente}`}>{LABEL[st] || st}</span>
                    <span className="text-sm text-white">{fmtComp(f.competencia)}</span>
                    <span className="text-sm font-semibold text-white">{money(f.total)}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">venc. {fmtData(f.vencimento)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => baixarPdf(f.id)}
                    className="rounded border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-white hover:border-blue-500">PDF</button>
                  <button onClick={() => toggleDetalhe(f.id)}
                    className="rounded border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-white hover:border-blue-500">{abertoId === f.id ? 'Ocultar' : 'Detalhes'}</button>
                  {isAdmin && (
                    <>
                      <button onClick={() => acao(f.id, 'send', 'Enviar')} disabled={busy === f.id || f.status === 'cancelada'}
                        className="rounded bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-40">Enviar</button>
                      {f.status === 'pendente' && (
                        <button onClick={() => acao(f.id, 'pay', 'Marcar paga')} disabled={busy === f.id}
                          className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40">Marcar paga</button>
                      )}
                      {f.status === 'paga' && (
                        <button onClick={() => acao(f.id, 'reopen', 'Reabrir')} disabled={busy === f.id}
                          className="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700/50 disabled:opacity-40">Reabrir</button>
                      )}
                      {f.status !== 'cancelada' && (
                        <button onClick={() => acao(f.id, 'cancel', 'Cancelar')} disabled={busy === f.id}
                          className="rounded border border-red-900 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40">Cancelar</button>
                      )}
                    </>
                  )}
                </div>
                {abertoId === f.id && (
                  <div className="mt-3 border-t border-slate-700 pt-3">
                    {detLoading || !detalhe ? (
                      <p className="text-sm text-slate-400">Carregando detalhe…</p>
                    ) : (
                      <DetalheCobranca
                        itens={detalhe.itens?.itens_por_plano || []}
                        grupos={detalhe.itens?.grupos || []}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
