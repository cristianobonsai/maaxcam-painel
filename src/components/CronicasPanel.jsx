import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')
const LEVELS = { cuidado: 'Cuidado', protecao: 'Proteção', economico: 'Econômico' }
const LEVEL_COLOR = {
  cuidado: 'bg-amber-500/20 text-amber-300',
  protecao: 'bg-orange-500/20 text-orange-300',
  economico: 'bg-red-500/20 text-red-300',
  normal: 'bg-slate-600/40 text-slate-300',
}
const fmtDate = (ts) => (ts ? new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—')
const fmtDateTime = (ts) => (ts ? new Date(ts * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')
const ms = (v) => (v == null ? '—' : `${Math.round(v * 10) / 10} ms`)
const btn = 'rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50'

// Aba "Crônicas" do Admin (Etapa 3B): só consulta + Isentar + Forçar modo normal. Não envia nenhum aviso ao administrador.
export default function CronicasPanel() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('todos')
  const [busy, setBusy] = useState('')

  const carregar = useCallback(async () => {
    try { setError(''); setData(await api.get('/api/admin/chronic')) }
    catch (e) { setError(msg(e)) }
  }, [])
  useEffect(() => { carregar(); const t = setInterval(carregar, 60000); return () => clearInterval(t) }, [carregar])

  async function acao(camera, tipo, body) {
    setBusy(camera + tipo); setError('')
    try {
      await api.post(`/api/admin/chronic/${camera}/${tipo}`, body)
      await carregar()
    } catch (e) { setError(msg(e)) }
    finally { setBusy('') }
  }
  function forcar(c) {
    if (window.confirm(`Forçar modo normal em "${c.name}"? Os freios e o modo econômico saem agora e a câmera fica 7 dias sem voltar à Proteção.`)) acao(c.camera_id, 'force-normal')
  }

  if (error && !data) return <p className="mt-6 text-sm text-red-300">{error}</p>
  if (!data) return <p className="mt-6 text-sm text-slate-400">Carregando câmeras crônicas…</p>

  const cams = (data.cameras || []).filter((c) => filter === 'todos' || c.level === filter || (filter === 'isentas' && c.exempt))
  const m = data.metrics || {}
  const saved = data.saved_24h || {}

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Módulo" value={data.mode === 'on' ? 'Ligado' : data.mode === 'dry' ? 'Só observando (dry)' : 'Desligado'} />
        <Stat label="Passo do porteiro (24 h)" value={`${ms(m.tick_notice_ms?.avg)} · pior ${ms(m.tick_notice_ms?.max)}`} />
        <Stat label="Avaliação horária (24 h)" value={`${ms(m.tick_chronic_ms?.avg)} · pior ${ms(m.tick_chronic_ms?.max)}`} />
        <Stat label="Trabalho evitado (24 h)" value={`${saved.photo ?? 0} fotos · ${saved.probe ?? 0} checagens · ${saved.card ?? 0} cartões`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[['todos', 'Todas'], ['cuidado', 'Cuidado'], ['protecao', 'Proteção'], ['economico', 'Econômico'], ['isentas', 'Isentas']].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${filter === k ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {label}
          </button>
        ))}
        <span className="text-xs text-slate-500">{cams.length} câmera(s)</span>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {cams.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma câmera crônica neste filtro.</p>
      ) : (
        <div className="space-y-3">
          {cams.map((c) => (
            <div key={c.camera_id} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-white">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.camera_id}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLOR[c.level] || LEVEL_COLOR.normal}`}>{LEVELS[c.level] || 'Normal'}</span>
                    {c.exempt && <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">Isenta</span>}
                    {c.forced_until && <span className="rounded-full bg-slate-600/40 px-2.5 py-0.5 text-xs font-medium text-slate-300">Forçada a normal até {fmtDate(c.forced_until)}</span>}
                    {!c.acting && <span className="rounded-full bg-slate-600/40 px-2.5 py-0.5 text-xs text-slate-400">só observando</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{c.owner_email || '(sem e-mail)'}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {c.drops_7d} quedas em 7 dias (média {c.avg_per_day}/dia, {c.days_bad} dias ruins) · nível desde {fmtDate(c.since_ts)}
                    {c.protect_since_ts ? ` · em proteção desde ${fmtDate(c.protect_since_ts)}` : ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Freios: {c.throttles.length ? c.throttles.join(', ') : 'nenhum'} · Último resumo: {fmtDateTime(c.last_summary_ts)}
                    {c.summary_off ? ' · cliente parou de receber o resumo' : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btn} disabled={busy === c.camera_id + 'exempt'}
                    onClick={() => acao(c.camera_id, 'exempt', { on: !c.exempt })}>
                    {c.exempt ? 'Tirar isenção' : 'Isentar'}
                  </button>
                  <button type="button" className={btn} disabled={busy === c.camera_id + 'force-normal' || !(c.level === 'protecao' || c.level === 'economico')}
                    onClick={() => forcar(c)}>
                    Forçar modo normal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}
