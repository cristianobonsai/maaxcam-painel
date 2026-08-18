import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../auth/AuthContext.jsx'

const API_URL = 'https://api.livebybit.com'

// Tipos de relatório. 'perm' = flag necessária; dias = opções de período.
const TIPOS = [
  { key: 'uptime', label: 'Disponibilidade', perm: 'canViewUptime', endpoint: '/api/reports/uptime', dias: [7, 30, 90] },
  { key: 'drops', label: 'Quedas', perm: 'canViewDrops', endpoint: '/api/reports/drops', dias: [7, 30, 90, 180] },
  { key: 'access', label: 'Acessos', perm: 'canViewAccessLogs', endpoint: '/api/reports/access-logs', dias: [7, 30, 90] },
]

export default function Relatorios() {
  const perms = usePermissions()
  const { session } = useAuth()
  const [baixando, setBaixando] = useState(false)
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

  async function baixarPdf() {
    if (!tipo) return
    if (!session?.access_token) { setError('Sessão expirada, faça login novamente.'); return }
    setBaixando(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/reports/${tipo.key}/pdf?dias=${dias}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) throw new Error(`Falha ao gerar PDF (HTTP ${res.status}).`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${tipo.key}-livebybit.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message || 'Erro ao baixar PDF.')
    } finally {
      setBaixando(false)
    }
  }

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

        <button onClick={baixarPdf} disabled={baixando || loading || !data}
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-blue-500 disabled:opacity-50">
          {baixando ? 'Gerando…' : 'Exportar PDF'}
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
  const [busca, setBusca] = useState('')
  const comDados = cams.filter((c) => c.pct_online !== null && c.nome.toLowerCase().includes(busca.toLowerCase()))
  return (
    <div className="mt-5">
      <SlaPeriodo />
      <input type="text" placeholder="Buscar camera..." value={busca} onChange={(e) => setBusca(e.target.value)}
        className="mb-3 w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
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

function formatExcedente(seg) {
  seg = Math.round(seg)
  const dias = Math.floor(seg / 86400)
  const horas = Math.floor((seg % 86400) / 3600)
  const minutos = Math.floor((seg % 3600) / 60)
  if (dias > 0) return `${dias}d ${horas}h do limite`
  if (horas > 0) return `${horas}h ${minutos}min do limite`
  return `${minutos}min do limite`
}

function SlaPeriodo() {
  const hoje = new Date().toISOString().slice(0, 10)
  const [dataInicio, setDataInicio] = useState(hoje)
  const [dataFim, setDataFim] = useState(hoje)
  const [slaDias, setSlaDias] = useState('')
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function consultar() {
    if (!dataInicio || !dataFim) { setErro('Escolha as duas datas.'); return }
    if (dataFim < dataInicio) { setErro('A data final nao pode ser antes da data inicial.'); return }
    setCarregando(true); setErro(''); setResultado(null)
    try {
      const r = await api.get(`/api/reports/uptime/periodo?data_inicio=${dataInicio}&data_fim=${dataFim}`)
      setResultado(r)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao consultar o periodo.')
    } finally {
      setCarregando(false)
    }
  }

  const limiteSeg = slaDias !== '' && !isNaN(Number(slaDias)) ? Number(slaDias) * 86400 : null

  return (
    <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Conferencia de SLA por periodo</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Data inicio</label>
          <input type="date" value={dataInicio} max={dataFim} onChange={(e) => setDataInicio(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Data fim</label>
          <input type="date" value={dataFim} min={dataInicio} max={hoje} onChange={(e) => setDataFim(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">SLA (dias de tolerancia)</label>
          <input type="number" min="0" step="0.5" placeholder="ex: 4" value={slaDias} onChange={(e) => setSlaDias(e.target.value)}
            className="w-28 rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <button onClick={consultar} disabled={carregando}
          className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50">
          {carregando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {erro && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{erro}</p>}

      {resultado && (
        <div className="mt-4">
          <p className="mb-3 text-[11px] text-slate-500">
            Periodo: {resultado.data_inicio} a {resultado.data_fim}.
            {resultado.coletando_desde ? ` Dados coletados desde ${resultado.coletando_desde}.` : ''}
          </p>
          <div className="overflow-hidden rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Camera</th>
                  <th className="px-4 py-2.5 text-right font-medium">Maior queda continua</th>
                  <th className="px-4 py-2.5 text-right font-medium">SLA</th>
                </tr>
              </thead>
              <tbody>
                {resultado.cameras.map((c) => {
                  const estourou = limiteSeg !== null && c.maior_queda_seg !== null && c.maior_queda_seg > limiteSeg
                  return (
                    <tr key={c.camera_id} className={`border-t border-slate-800 ${estourou ? 'bg-red-500/10' : ''}`}>
                      <td className="px-4 py-2.5 text-slate-200">{c.nome}</td>
                      <td className={`px-4 py-2.5 text-right font-medium ${estourou ? 'text-red-300' : 'text-slate-300'}`}>
                        {c.maior_queda_fmt ?? 'sem dados'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs">
                        {limiteSeg === null ? (
                          <span className="text-slate-500">defina o SLA</span>
                        ) : c.maior_queda_seg === null ? (
                          <span className="text-slate-500">--</span>
                        ) : estourou ? (
                          <span className="font-medium text-red-400">Extrapolou o SLA</span>
                        ) : (
                          <span className="text-green-400">Dentro do limite</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Quedas (ranking + detalhe ao clicar) ----------
function Drops({ data, dias }) {
  const cams = data.cameras || []
  const [busca, setBusca] = useState('')
  const camsFiltradas = cams.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
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
      <PeriodoQuedas cams={cams} />
      <input type="text" placeholder="Buscar camera..." value={busca} onChange={(e) => setBusca(e.target.value)}
        className="mb-3 mt-6 w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
      <p className="mb-2 text-xs text-slate-500">Total de {data.total_quedas} {data.total_quedas === 1 ? 'queda' : 'quedas'} nos últimos {data.dias} {data.dias === 1 ? 'dia' : 'dias'}. Clique numa câmera para ver todas as quedas dela.</p>
      <p className="mb-3 text-[11px] text-slate-500">O histórico de quedas fica disponível por até 180 dias.</p>
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
            {camsFiltradas.map((c) => (
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

// ---------- Quedas: consulta por periodo customizado ----------
function PeriodoQuedas({ cams }) {
  const hoje = new Date().toISOString().slice(0, 10)
  const [camId, setCamId] = useState(cams[0]?.camera_id || '')
  const [dataInicio, setDataInicio] = useState(hoje)
  const [dataFim, setDataFim] = useState(hoje)
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function consultar() {
    if (!camId) { setErro('Escolha uma camera.'); return }
    if (!dataInicio || !dataFim) { setErro('Escolha as duas datas.'); return }
    if (dataFim < dataInicio) { setErro('A data final nao pode ser antes da data inicial.'); return }
    setCarregando(true); setErro(''); setResultado(null)
    try {
      const r = await api.get(`/api/reports/drops/${camId}/periodo?data_inicio=${dataInicio}&data_fim=${dataFim}`)
      setResultado(r)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro ao consultar o periodo.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/40 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Consultar periodo especifico</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Camera</label>
          <select value={camId} onChange={(e) => setCamId(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none">
            {cams.map((c) => <option key={c.camera_id} value={c.camera_id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Data inicio</label>
          <input type="date" value={dataInicio} max={dataFim} onChange={(e) => setDataInicio(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Data fim</label>
          <input type="date" value={dataFim} min={dataInicio} max={hoje} onChange={(e) => setDataFim(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
        </div>
        <button onClick={consultar} disabled={carregando}
          className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50">
          {carregando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {erro && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{erro}</p>}

      {resultado && (
        <div className="mt-4">
          <p className="mb-3 text-sm text-slate-200">
            <span className="font-medium text-white">{resultado.nome}</span> ficou{' '}
            <span className="font-medium text-amber-300">{resultado.total_offline_fmt}</span> offline entre{' '}
            {resultado.data_inicio} e {resultado.data_fim} ({resultado.total_quedas} {resultado.total_quedas === 1 ? 'queda' : 'quedas'}).
          </p>
          {resultado.coletando_desde && (
            <p className="mb-3 text-[11px] text-slate-500">Dados coletados desde {resultado.coletando_desde}.</p>
          )}
          {resultado.quedas.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma queda no periodo.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Caiu em</th>
                    <th className="px-4 py-2.5 text-left font-medium">Voltou em</th>
                    <th className="px-4 py-2.5 text-right font-medium">Duracao</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.quedas.map((q, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      <td className="px-4 py-2.5 text-slate-200">{q.caiu}</td>
                      <td className="px-4 py-2.5 text-slate-200">
                        {q.ainda_offline ? <span className="text-red-400">ainda offline</span> : q.voltou}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300">{q.duracao_fmt}</td>
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
}

// ---------- Acessos (lista) ----------
function Access({ data }) {
  const logins = data.logins || []
  const [busca, setBusca] = useState('')
  const loginsFiltrados = logins.filter((l) => (l.email || '').toLowerCase().includes(busca.toLowerCase()))
  return (
    <div className="mt-5">
      <input type="text" placeholder="Buscar usuario..." value={busca} onChange={(e) => setBusca(e.target.value)}
        className="mb-3 w-full max-w-xs rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none" />
      <p className="mb-3 text-xs text-slate-500">{data.total} {data.total === 1 ? 'acesso' : 'acessos'} nos últimos {data.dias} dias.</p>
      {loginsFiltrados.length === 0 ? (
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
              {loginsFiltrados.map((l, i) => (
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
