import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { usePermissions } from '../hooks/usePermissions'

// Tipos de relatório. 'perm' = flag necessária; dias = opções de período.
const TIPOS = [
  { key: 'uptime', label: 'Disponibilidade', perm: 'canViewUptime', endpoint: '/api/reports/uptime', dias: [7, 30, 90] },
  { key: 'drops', label: 'Quedas', perm: 'canViewDrops', endpoint: '/api/reports/drops', dias: [1, 3, 7] },
  { key: 'access', label: 'Acessos', perm: 'canViewAccessLogs', endpoint: '/api/reports/access-logs', dias: [7, 30, 90] },
]

export default function Relatorios() {
  const perms = usePermissions()
  const disponiveis = useMemo(
    () => TIPOS.filter((t) => perms[t.perm]),
    [perms.canViewUptime, perms.canViewDrops, perms.canViewAccessLogs] // eslint-disable-line
  )

  const [tipo, setTipo] = useState(null)
  const [dias, setDias] = useState(7)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // escolhe o primeiro tipo disponível assim que as permissões carregam
  useEffect(() => {
    if (!tipo && disponiveis.length) { setTipo(disponiveis[0]); setDias(disponiveis[0].dias[0]) }
  }, [disponiveis]) // eslint-disable-line

  useEffect(() => {
    if (!tipo) return
    let active = true
    setLoading(true); setError(''); setData(null)
    ;(async () => {
      try {
        const r = await api.get(`${tipo.endpoint}?dias=${dias}`)
        if (active) setData(r)
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : 'Erro ao carregar o relatório.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [tipo, dias])

  if (perms.loading) {
    return <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8"><p className="text-slate-400">Carregando…</p></main>
  }

  if (!disponiveis.length) {
    return (
      <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-white">Relatórios</h1>
        <p className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
          Você não tem permissão para ver relatórios. Peça ao dono da conta para liberar.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Relatórios</h1>
      <p className="mt-1 text-sm text-slate-400">Acompanhe acessos, quedas e disponibilidade das suas câmeras.</p>

      {/* seletor de tipo + período + PDF */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-800/60 p-1">
          {disponiveis.map((t) => (
            <button key={t.key}
              onClick={() => { setTipo(t); setDias(t.dias[0]) }}
              className={`rounded-md px-3.5 py-1.5 text-sm ${tipo?.key === t.key ? 'bg-blue-500 font-medium text-white' : 'text-slate-300 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <select value={dias} onChange={(e) => setDias(Number(e.target.value))}
          className="ml-auto rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
          {(tipo?.dias || [7]).map((d) => <option key={d} value={d}>Últimos {d} {d === 1 ? 'dia' : 'dias'}</option>)}
        </select>

        <button disabled title="Exportação em PDF em breve"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-500">
          Exportar PDF
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {loading && <p className="mt-4 text-sm text-slate-400">Carregando relatório…</p>}

      {!loading && data && tipo?.key === 'uptime' && <Uptime data={data} />}
      {!loading && data && tipo?.key === 'drops' && <Drops data={data} dias={dias} />}
      {!loading && data && tipo?.key === 'access' && <Access data={data} />}
    </main>
  )
}

// ---------- Disponibilidade (barras) ----------
function Uptime({ data }) {
  const cams = data.cameras || []
  const comDados = cams.filter((c) => c.pct_online !== null)
  return (
    <div className="mt-5">
      {data.coletando_desde
        ? <p className="mb-3 text-xs text-slate-500">Disponibilidade calculada com dados coletados desde {data.coletando_desde}.</p>
        : <p className="mb-3 rounded-lg border border-amber-700/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-300/90">A coleta de disponibilidade começou recentemente — os dados vão ganhar precisão conforme os dias passarem.</p>}
      {comDados.length === 0 ? (
        <p className="text-sm text-slate-500">Ainda não há dados de disponibilidade para o período.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {comDados.map((c) => {
            const pct = c.pct_online
            const cor = pct >= 95 ? '#4ade80' : pct >= 80 ? '#fbbf24' : '#f87171'
            return (
              <div key={c.camera_id} className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-white">{c.nome}</span>
                  <span className="text-sm" style={{ color: cor }}>{pct}% online</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-950">
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: cor }} />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500">
                  {c.horas_online}h online · {c.horas_offline}h offline
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------- Quedas (ranking + detalhe ao clicar) ----------
function Drops({ data, dias }) {
  const cams = data.cameras || []
  const [aberta, setAberta] = useState(null)     // camera_id expandida
  const [detalhe, setDetalhe] = useState(null)   // { quedas: [...] }
  const [carregando, setCarregando] = useState(false)

  async function abrir(cam) {
    if (aberta === cam.camera_id) { setAberta(null); setDetalhe(null); return }
    setAberta(cam.camera_id); setDetalhe(null)
    if (cam.quedas === 0) return
    setCarregando(true)
    try {
      const r = await api.get(`/api/reports/drops/${cam.camera_id}?dias=${dias}`)
      setDetalhe(r)
    } catch { setDetalhe({ quedas: [] }) }
    finally { setCarregando(false) }
  }

  return (
    <div className="mt-5">
      <p className="mb-3 text-xs text-slate-500">Total de {data.total_quedas} {data.total_quedas === 1 ? 'queda' : 'quedas'} nos últimos {data.dias} {data.dias === 1 ? 'dia' : 'dias'}. Clique numa câmera para ver todas as quedas dela.</p>
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Câmera</th>
              <th className="px-4 py-2.5 text-right font-medium">Quedas</th>
              <th className="px-4 py-2.5 text-right font-medium">Última queda</th>
            </tr>
          </thead>
          <tbody>
            {cams.map((c) => (
              <>
                <tr key={c.camera_id}
                  onClick={() => abrir(c)}
                  className={`border-t border-slate-800 ${c.quedas > 0 ? 'cursor-pointer hover:bg-slate-800/40' : ''}`}>
                  <td className="px-4 py-2.5 text-slate-200">
                    {c.quedas > 0 && <span className="mr-2 text-slate-500">{aberta === c.camera_id ? '▾' : '▸'}</span>}
                    {c.nome}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-medium ${c.quedas > 0 ? 'text-amber-300' : 'text-slate-500'}`}>{c.quedas}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{c.ultima_queda || '—'}</td>
                </tr>
                {aberta === c.camera_id && (
                  <tr key={c.camera_id + '-det'} className="border-t border-slate-800 bg-slate-950/40">
                    <td colSpan={3} className="px-4 py-3">
                      {carregando ? (
                        <span className="text-xs text-slate-400">Carregando quedas…</span>
                      ) : detalhe && detalhe.quedas?.length ? (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Todas as quedas ({detalhe.total})</p>
                          <ul className="flex flex-col gap-1">
                            {detalhe.quedas.map((q, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                {q.quando}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Sem quedas registradas no período.</span>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------- Acessos (lista) ----------
function Access({ data }) {
  const logins = data.logins || []
  return (
    <div className="mt-5">
      <p className="mb-3 text-xs text-slate-500">{data.total} {data.total === 1 ? 'acesso' : 'acessos'} nos últimos {data.dias} dias.</p>
      {logins.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum acesso no período.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Usuário</th>
                <th className="px-4 py-2.5 text-left font-medium">IP</th>
                <th className="px-4 py-2.5 text-right font-medium">Quando</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((l, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="px-4 py-2.5 text-slate-200">{l.email}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{l.ip}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{l.quando}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
