import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const VAZIO = {
  tipo: 'PF', nome: '', cpf_cnpj: '', email_cobranca: '', telefone: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
}

// Formata "YYYY-MM-DD HH:MM:SS" -> "DD/MM/YYYY" (sem Date, pra nao ter dor de fuso).
function fmtData(s) {
  if (!s) return ''
  const d = String(s).slice(0, 10).split('-')
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : String(s)
}

// Formulario dos dados fiscais/cobranca do proprio cliente (colapsavel).
// Le e grava em /api/billing/info. UF em dropdown; rotulos mudam com PF/PJ.
// Prop aceiteTermos (default false): quando ligada, mostra o bloco de aceite
//   dos Termos. O admin NAO passa essa prop, entao o painel de Cobranca fica igual.
export default function DadosCobranca({ getUrl = '/api/billing/info', putUrl = '/api/billing/info', defaultOpen = false, aceiteTermos = false }) {
  const [form, setForm] = useState(VAZIO)
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [aceite, setAceite] = useState(false)   // checkbox (so quando aceiteTermos e ainda nao aceitou)

  async function carregar() {
    const d = await api.get(getUrl)
    if (d) setForm({ ...VAZIO, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v != null)) })
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const d = await api.get(getUrl)
        if (alive && d) setForm({ ...VAZIO, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v != null)) })
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false) }

  // Ja aceitou os termos antes? (o backend carimba termos_aceite_em ao aceitar)
  const jaAceitou = !!(form.termos_aceite_em && String(form.termos_aceite_em).trim())
  // Trava o Salvar enquanto o aceite for obrigatorio e nao estiver marcado.
  const faltaAceite = aceiteTermos && !jaAceitou && !aceite

  async function salvar() {
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      const enviarAceite = aceiteTermos && !jaAceitou && aceite
      if (enviarAceite) {
        payload.aceite_termos = true      // o backend so grava o carimbo se isto vier true
        payload.termos_versao = '1.0'     // versao vigente dos Termos/Politica
      }
      await api.put(putUrl, payload)
      setSaved(true)
      // se acabou de aceitar, recarrega pra refletir "aceito em ..." (carimbo vem do servidor)
      if (enviarAceite) {
        try { await carregar(); setAceite(false) } catch { /* ignore */ }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const isPJ = form.tipo === 'PJ'
  const inputCls = 'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'
  const labelCls = 'mb-1 block text-xs text-slate-400'

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="font-display text-lg font-semibold text-white">Dados de cobrança</span>
        <span className="text-sm text-slate-400">{open ? 'ocultar' : (loading ? 'carregando…' : 'editar')}</span>
      </button>
      <p className="mt-1 text-xs text-slate-400">Usados na fatura que o LiveByBit envia. Preencha para aparecerem no documento.</p>

      {open && !loading && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="tipo" checked={!isPJ} onChange={() => { setForm((f) => ({ ...f, tipo: 'PF' })); setSaved(false) }} className="accent-blue-500" />
              Pessoa Física
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="radio" name="tipo" checked={isPJ} onChange={() => { setForm((f) => ({ ...f, tipo: 'PJ' })); setSaved(false) }} className="accent-blue-500" />
              Pessoa Jurídica
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{isPJ ? 'Razão social' : 'Nome completo'}</label>
              <input className={inputCls} value={form.nome} onChange={set('nome')} />
            </div>
            <div>
              <label className={labelCls}>{isPJ ? 'CNPJ' : 'CPF'}</label>
              <input className={inputCls} value={form.cpf_cnpj} onChange={set('cpf_cnpj')} placeholder={isPJ ? '00.000.000/0000-00' : '000.000.000-00'} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>E-mail de cobrança</label>
              <input type="email" className={inputCls} value={form.email_cobranca} onChange={set('email_cobranca')} placeholder="voce@exemplo.com" />
            </div>
            <div>
              <label className={labelCls}>Telefone / WhatsApp</label>
              <input className={inputCls} value={form.telefone} onChange={set('telefone')} placeholder="(48) 99999-9999" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>CEP</label>
              <input className={inputCls} value={form.cep} onChange={set('cep')} placeholder="00000-000" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Rua</label>
              <input className={inputCls} value={form.rua} onChange={set('rua')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Número</label>
              <input className={inputCls} value={form.numero} onChange={set('numero')} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Complemento <span className="text-slate-600">(opcional)</span></label>
              <input className={inputCls} value={form.complemento} onChange={set('complemento')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={inputCls} value={form.bairro} onChange={set('bairro')} />
            </div>
            <div>
              <label className={labelCls}>Cidade</label>
              <input className={inputCls} value={form.cidade} onChange={set('cidade')} />
            </div>
            <div>
              <label className={labelCls}>UF</label>
              <select className={inputCls} value={form.uf} onChange={set('uf')}>
                <option value="">—</option>
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Bloco de aceite dos termos — so aparece quando aceiteTermos=true (tela do cliente) */}
          {aceiteTermos && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
              {jaAceitou ? (
                <p className="text-sm text-emerald-300">
                  ✓ Termos aceitos em {fmtData(form.termos_aceite_em)}
                  {form.termos_versao ? ` (versão ${form.termos_versao})` : ''}
                </p>
              ) : (
                <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={aceite}
                    onChange={(e) => { setAceite(e.target.checked); setSaved(false) }}
                    className="mt-0.5 accent-blue-500" />
                  <span>
                    Li e aceito os{' '}
                    <a href="/termos.pdf" target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-blue-400 underline hover:text-blue-300">Termos de Uso</a> e a{' '}
                    <a href="/politica.pdf" target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-blue-400 underline hover:text-blue-300">Política de Pagamento</a> do LiveByBit.
                  </span>
                </label>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={salvar} disabled={saving || faltaAceite}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
              {saving ? 'Salvando…' : 'Salvar dados de cobrança'}
            </button>
            {saved && <span className="text-sm text-emerald-300">✓ Salvo</span>}
            {faltaAceite && <span className="text-sm text-slate-400">Marque o aceite dos termos para salvar.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
