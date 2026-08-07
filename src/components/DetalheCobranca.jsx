import { useState } from 'react'

const money = (v) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const PLAN_LABELS = { basico: 'Básico', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise' }
const fmtDia = (s) => { if (!s) return '—'; const p = String(s).slice(0, 10).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s }

// Resumo de cobranca EXPANSIVEL. Cada plano/grupo abre e mostra as cameras (nome, ID, criacao, plano-desde).
// showPricing=true mostra o preco/camera (com desconto riscado) no cabecalho — usado no Faturamento do cliente.
export default function DetalheCobranca({ itens = [], grupos = [], showPricing = false }) {
  const [aberto, setAberto] = useState({})
  const toggle = (k) => setAberto((a) => ({ ...a, [k]: !a[k] }))

  if ((!itens || itens.length === 0) && (!grupos || grupos.length === 0)) {
    return <p className="text-sm text-slate-500">Nada cobrado.</p>
  }

  return (
    <div className="space-y-3">
      {itens.map((it) => {
        const k = `plano-${it.plan}`
        const cams = it.cameras || []
        const desconto = showPricing && it.preco_unitario < it.preco_cheio
        return (
          <div key={k} className="rounded-xl border border-slate-700 bg-slate-800/60">
            <button onClick={() => toggle(k)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">{aberto[k] ? '▾' : '▸'}</span>
                <span className="font-display font-semibold text-white">{PLAN_LABELS[it.plan] || it.plan}</span>
                <span className="text-sm text-slate-400">{it.quantidade} câmera(s)</span>
              </span>
              <span className="text-right">
                {showPricing && (
                  desconto ? (
                    <div>
                      <span className="text-sm text-slate-500 line-through">{money(it.preco_cheio)}/câmera</span>
                      <span className="ml-2 text-sm font-medium text-emerald-300">{money(it.preco_unitario)}/câmera</span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300">{money(it.preco_unitario)}/câmera</div>
                  )
                )}
                <div className="mt-0.5 font-semibold text-white">{money(it.subtotal)}</div>
              </span>
            </button>
            {aberto[k] && (
              <div className="border-t border-slate-700 px-4 py-3">
                {cams.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem detalhe de câmeras nesta fatura.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="py-1 pr-3 font-medium">Câmera</th>
                          <th className="py-1 pr-3 font-medium">ID</th>
                          <th className="py-1 pr-3 font-medium">Criada em</th>
                          <th className="py-1 font-medium">Plano desde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cams.map((c) => (
                          <tr key={c.camera_id} className="border-t border-slate-800">
                            <td className="py-1 pr-3">{c.name || c.camera_id}</td>
                            <td className="py-1 pr-3 text-slate-500">{c.camera_id}</td>
                            <td className="py-1 pr-3">{fmtDia(c.created_at)}</td>
                            <td className="py-1">{fmtDia(c.plano_desde || c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {grupos && grupos.length > 0 && grupos.map((g) => {
        const k = `grupo-${g.id}`
        const cams = g.cameras || []
        const desconto = showPricing && g.preco < g.preco_cheio
        return (
          <div key={k} className="rounded-xl border border-slate-700 bg-slate-800/60">
            <button onClick={() => toggle(k)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">{aberto[k] ? '▾' : '▸'}</span>
                <span className="font-medium text-white">Grupo de transmissão: {g.name || `Grupo ${g.id}`}</span>
                <span className="text-sm text-slate-400">{cams.length} câmera(s)</span>
              </span>
              <span className="text-right font-semibold text-white">
                {desconto && <span className="mr-2 text-sm font-normal text-slate-500 line-through">{money(g.preco_cheio)}</span>}
                {money(g.preco)}
              </span>
            </button>
            {aberto[k] && (
              <div className="border-t border-slate-700 px-4 py-3">
                <p className="mb-1 text-xs text-slate-500">Grupo criado em {fmtDia(g.created_at)}</p>
                {cams.length === 0 ? (
                  <p className="text-xs text-slate-500">Sem câmeras no grupo.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="py-1 pr-3 font-medium">Câmera</th>
                          <th className="py-1 pr-3 font-medium">ID</th>
                          <th className="py-1 font-medium">Criada em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cams.map((c) => (
                          <tr key={c.camera_id} className="border-t border-slate-800">
                            <td className="py-1 pr-3">{c.name || c.camera_id}</td>
                            <td className="py-1 pr-3 text-slate-500">{c.camera_id}</td>
                            <td className="py-1">{fmtDia(c.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
