import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const VAZIO = {
  tipo: 'PF', nome: '', cpf_cnpj: '', email_cobranca: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
}

// Formulario dos dados fiscais/cobranca do proprio cliente (colapsavel).
// Le e grava em /api/billing/info. UF em dropdown; rotulos mudam com PF/PJ.
export default function DadosCobranca({ getUrl = '/api/billing/info', putUrl = '/api/billing/info', defaultOpen = false }) {
  const [form, setForm] = useState(VAZIO)
  const [open, setOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

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

  async function salvar() {
    setSaving(true); setError('')
    try {
      await api.put(putUrl, form)
      setSaved(true)
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

          <div>
            <label className={labelCls}>E-mail de cobrança <span className="text-slate-600">(se vazio, usa o e-mail da conta)</span></label>
            <input type="email" className={inputCls} value={form.email_cobranca} onChange={set('email_cobranca')} />
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
              <label className={labelCls}>Complemento</label>
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

          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={salvar} disabled={saving}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
              {saving ? 'Salvando…' : 'Salvar dados de cobrança'}
            </button>
            {saved && <span className="text-sm text-emerald-300">✓ Salvo</span>}
          </div>
        </div>
      )}
    </div>
  )
}
