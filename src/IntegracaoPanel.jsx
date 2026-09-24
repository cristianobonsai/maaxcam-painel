import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiError } from './lib/api'
import { usePermissions } from './hooks/usePermissions'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')

function Icon({ path, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function Card({ title, icon, badge, children }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 space-y-3">
      {(title || badge) && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-white flex items-center gap-2">
            {icon && <Icon path={icon} className="h-5 w-5 text-slate-400" />}
            {title}
          </h2>
          {badge}
        </div>
      )}
      {children}
    </section>
  )
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text || ''); setDone(true); setTimeout(() => setDone(false), 1500) } catch {} }}
      className="shrink-0 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs text-white">
      {done ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-600'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Segmented({ options, value, onChange, warnValue }) {
  return (
    <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
      {options.map(([key, label]) => {
        const active = value === key
        const warn = active && warnValue === key
        return (
          <button key={key} type="button" onClick={() => onChange(key)}
            className={`px-3 py-1.5 text-sm font-medium border-r border-slate-700 last:border-r-0 ${
              active ? (warn ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

const ICONS = {
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11m-14 0h14m-14 0a2 2 0 0 0-2 2v3a1 1 0 0 0 1 1h1m14-6a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-1m-13 0a1.5 1.5 0 1 0 3 0m7 0a1.5 1.5 0 1 0 3 0m-10 0h7',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  clock: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  chart: 'M3 3v18h18M7 14l3-3 4 4 5-6',
  foto: 'M3 16.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v9.75m-18 0A2.25 2.25 0 0 0 5.25 18.75h13.5A2.25 2.25 0 0 0 21 16.5m-18 0 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0L21 16.5M15 8.25h.008v.008H15V8.25Z',
  camera: 'M3 3v18h18M8 21V9m4 12V5m4 16v-7',
  link: 'M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 1 1 0 10h-2M8 12h8',
  pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01',
}

function minutesOf(hhmm) {
  if (!hhmm || hhmm.length !== 5) return 0
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function janelaResumo(modo, inicio, fim) {
  if (modo === '24h') return { startMin: 0, endMin: 1440, texto: 'Enviando 24 horas por dia.' }
  if (modo === 'comercial') return { startMin: 7 * 60, endMin: 18 * 60 + 30, texto: 'Enviando das 07:00 às 18:30 (horário comercial).' }
  const startMin = minutesOf(inicio || '00:00')
  const endMin = minutesOf(fim || '00:00')
  return { startMin, endMin, texto: inicio && fim ? `Enviando das ${inicio} às ${fim}.` : 'Defina o início e o fim abaixo.' }
}

const STATUS_BADGE = {
  ok: { cls: 'bg-emerald-500/20 text-emerald-300', label: 'OK' },
  erro: { cls: 'bg-red-500/20 text-red-300', label: 'Erro' },
  pulado: { cls: 'bg-amber-500/20 text-amber-300', label: 'Pulado (fora do horário)' },
}

const STATUS_CAPTURA_BADGE = {
  enviados: { cls: 'bg-emerald-500/20 text-emerald-300', label: 'Enviada' },
  erros: { cls: 'bg-red-500/20 text-red-300', label: 'Erro' },
  fora_horario: { cls: 'bg-amber-500/20 text-amber-300', label: 'Fora do horário' },
}

function formatarDataHora(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return iso
  }
}

function CapturasCarousel({ id }) {
  const [status, setStatus] = useState('todas')
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [item, setItem] = useState(null)
  const [imgUrl, setImgUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const imgUrlRef = useRef(null)

  const carregar = useCallback(async (st, idx) => {
    setLoading(true); setError('')
    try {
      const lista = await api.get(`/api/cameras/${id}/carbigdata/capturas?status=${st}&limit=1&offset=${idx}`)
      setTotal(lista.total)
      const it = (lista.items && lista.items[0]) || null
      setItem(it)
      if (it) {
        const blob = await api.getBlob(`/api/cameras/${id}/carbigdata/capturas/${it.status}/${it.filename}`)
        const novaUrl = URL.createObjectURL(blob)
        if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current)
        imgUrlRef.current = novaUrl
        setImgUrl(novaUrl)
      } else {
        if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current)
        imgUrlRef.current = null
        setImgUrl(null)
      }
    } catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { setIndex(0); carregar(status, 0) }, [status, carregar])

  useEffect(() => {
    const t = setInterval(() => { if (index === 0) carregar(status, 0) }, 15000)
    return () => clearInterval(t)
  }, [status, index, carregar])

  useEffect(() => () => { if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current) }, [])

  function irPara(novoIndex) {
    if (novoIndex < 0 || novoIndex >= total || loading) return
    setIndex(novoIndex)
    carregar(status, novoIndex)
  }

  const badge = item ? STATUS_CAPTURA_BADGE[item.status] : null

  return (
    <Card title="Capturas recebidas" icon={ICONS.foto}>
      <Segmented
        options={[['todas', 'Todas'], ['enviados', 'Enviadas'], ['erros', 'Erro'], ['fora_horario', 'Fora do horário']]}
        value={status}
        onChange={(v) => setStatus(v)}
      />

      {total === 0 && !loading ? (
        <p className="text-sm text-slate-400">Nenhuma captura encontrada pra esse filtro.</p>
      ) : (
        <div className="space-y-3">
          <div className="relative flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 min-h-[220px] overflow-hidden">
            {loading && <p className="text-sm text-slate-400">Carregando…</p>}
            {!loading && imgUrl && (
              <img src={imgUrl} alt={item?.filename || 'captura'} className="max-h-[420px] w-full object-contain" />
            )}
            {!loading && !imgUrl && !error && <p className="text-sm text-slate-400">Sem imagem.</p>}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {item && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="truncate">{item.filename}</span>
              <div className="flex items-center gap-2">
                {badge && <span className={`rounded-full px-2.5 py-1 font-medium ${badge.cls}`}>{badge.label}</span>}
                <span>{formatarDataHora(item.timestamp)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button type="button" disabled={loading || index <= 0} onClick={() => irPara(index - 1)}
              className="rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs text-white">
              ‹ Mais recente
            </button>
            <span className="text-xs text-slate-400 font-mono">{total > 0 ? `${index + 1} de ${total}` : '—'}</span>
            <button type="button" disabled={loading || index >= total - 1} onClick={() => irPara(index + 1)}
              className="rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs text-white">
              Mais antiga ›
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

function ResetVinculoModal({ id, endereco, lat, lng, onClose, onDone }) {
  const [ack, setAck] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    setSaving(true); setError('')
    try {
      await api.post(`/api/cameras/${id}/carbigdata/resetar-vinculo`, {})
      onDone()
    } catch (e) { setError(msg(e)) }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
        <div className="flex gap-3 items-start">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Icon path={ICONS.alert} className="h-4 w-4 text-red-300" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-white">Resetar vínculo da câmera</div>
            <div className="text-xs text-slate-400 mt-1">Use isso apenas ao trocar a câmera física por outra (defeito, queima, manutenção).</div>
          </div>
        </div>

        <div className="flex gap-2.5 items-start rounded-lg bg-slate-800 p-3">
          <Icon path={ICONS.pin} className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            Este código CAM está cadastrado na Carbigdata para o endereço:<br />
            <strong className="text-white">{endereco || (lat && lng ? `${lat}, ${lng}` : 'Endereço não cadastrado ainda')}</strong>
            {endereco && lat && lng && <><br /><span className="text-slate-500">({lat}, {lng})</span></>}
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          A nova câmera precisa ser instalada exatamente neste mesmo endereço. Se for instalada em outro local, as capturas serão enviadas para o lugar errado dentro da Carbigdata.
        </p>

        <label className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed cursor-pointer">
          <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>Confirmo que a câmera será instalada neste mesmo endereço</span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
            Cancelar
          </button>
          <button type="button" disabled={!ack || saving} onClick={confirmar}
            className="rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm text-white font-medium">
            {saving ? 'Resetando…' : 'Confirmar reset'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IntegracaoPanel({ id }) {
  const perms = usePermissions()
  const canEdit = perms.canEditCameras

  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [endereco, setEndereco] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const d = await api.get(`/api/cameras/${id}/carbigdata`)
      setData(d)
      setForm({
        enabled: d.enabled,
        ambiente: d.ambiente,
        tipoReconhecimento: d.tipo_reconhecimento || 'interno',
        modeloCamera: d.modelo_camera || '',
        deviceIdSandbox: d.device_id_sandbox || '',
        apiKeySandbox: '',
        deviceIdProducao: d.device_id_producao || '',
        apiKeyProducao: '',
        deviceIdQaExterno: d.device_id_qa_externo || '',
        deviceIdProducaoExterno: d.device_id_producao_externo || '',
        horarioModo: d.horario_modo,
        horarioInicio: d.horario_inicio || '07:00',
        horarioFim: d.horario_fim || '18:30',
      })
    } catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  // Endereço legível pro aviso do reset de vínculo - reaproveita a mesma
  // rota de geocodificação reversa já usada na aba Localização (Nominatim).
  // Só busca quando há lat/lng cadastrados; falha em silêncio (mostra
  // lat/lng puro no modal se a busca não voltar a tempo).
  useEffect(() => {
    if (!data?.lat || !data?.lng) { setEndereco(''); return }
    let cancelado = false
    api.get(`/api/reverse-geocode?lat=${data.lat}&lng=${data.lng}`)
      .then(r => { if (!cancelado) setEndereco(r.display_name || r.endereco || '') })
      .catch(() => {})
    return () => { cancelado = true }
  }, [data?.lat, data?.lng])

  async function salvar() {
    setSaving(true); setSaveError(''); setSaveOk(false)
    try {
      const body = {
        enabled: form.enabled,
        ambiente: form.ambiente,
        tipo_reconhecimento: form.tipoReconhecimento,
        modelo_camera: form.modeloCamera || null,
        device_id_sandbox: form.deviceIdSandbox.trim(),
        device_id_producao: form.deviceIdProducao.trim(),
        device_id_qa_externo: form.deviceIdQaExterno.trim(),
        device_id_producao_externo: form.deviceIdProducaoExterno.trim(),
        horario_modo: form.horarioModo,
      }
      if (form.apiKeySandbox.trim()) body.api_key_sandbox = form.apiKeySandbox.trim()
      if (form.apiKeyProducao.trim()) body.api_key_producao = form.apiKeyProducao.trim()
      if (form.horarioModo === 'manual') {
        body.horario_inicio = form.horarioInicio
        body.horario_fim = form.horarioFim
      }
      await api.put(`/api/cameras/${id}/carbigdata`, body)
      await load()
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (e) { setSaveError(msg(e)) }
    finally { setSaving(false) }
  }

  if (loading) return <p className="text-sm text-slate-400">Carregando…</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!data || !form) return null

  const janela = janelaResumo(form.horarioModo, form.horarioInicio, form.horarioFim)
  const leftPct = (janela.startMin / 1440) * 100
  const widthPct = Math.max(0, ((janela.endMin - janela.startMin) / 1440) * 100)

  const tipoExterno = form.tipoReconhecimento === 'externo'
  const sandboxOk = data.has_api_key_sandbox && (tipoExterno ? form.deviceIdQaExterno : data.device_id_sandbox)
  const producaoOk = data.has_api_key_producao && (tipoExterno ? form.deviceIdProducaoExterno : data.device_id_producao)
  const endpointHost = form.ambiente === 'producao' ? 'iot.carbigdata.com.br' : 'sandbox.carbigdata.com.br'
  const badge = STATUS_BADGE[data.ultimo_envio_status] || null

  return (
    <div className="max-w-3xl space-y-5">

      <Card title="Detecção de Veículos" icon={ICONS.car}
        badge={<Toggle checked={form.enabled} onChange={(v) => setForm(f => ({ ...f, enabled: v }))} />}>
        <p className="text-sm text-slate-400">
          Integração com a Carbigdata: a cada evento de linha virtual, esta câmera envia uma foto pra leitura automática de placa.
          Outras integrações vão aparecer aqui no futuro.
        </p>

        {form.enabled && (
          <div className="border-t border-slate-700 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Tipo de reconhecimento</div>
            <Segmented
              options={[['interno', 'Interno (LiveByBit)'], ['externo', 'Externo (Carbigdata)']]}
              value={form.tipoReconhecimento}
              onChange={(v) => setForm(f => ({ ...f, tipoReconhecimento: v }))}
            />
            <p className="text-xs text-slate-500">
              {tipoExterno
                ? 'A própria câmera envia a captura direto pra Carbigdata via webhook (não usa SFTP).'
                : 'A câmera manda as capturas por SFTP; o LiveByBit reenvia pra Carbigdata.'}
            </p>
          </div>
        )}
      </Card>

      <div className={`space-y-5 transition-opacity ${form.enabled ? '' : 'opacity-60'}`}>

        <Card title="Credenciais Carbigdata" icon={ICONS.lock}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Segmented
              options={[['sandbox', 'Sandbox'], ['producao', 'Produção']]}
              value={form.ambiente}
              warnValue="producao"
              onChange={(v) => setForm(f => ({ ...f, ambiente: v }))}
            />
            <div className="flex gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${sandboxOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                Sandbox {sandboxOk ? 'configurado' : 'não configurado'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${producaoOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                Produção {producaoOk ? 'configurada' : 'não configurada'}
              </span>
            </div>
          </div>

          {form.ambiente === 'sandbox' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Device ID <span className="lowercase text-slate-500">(sandbox{tipoExterno ? ' · externo' : ''})</span></div>
                {tipoExterno ? (
                  <input value={form.deviceIdQaExterno}
                    onChange={e => setForm(f => ({ ...f, deviceIdQaExterno: e.target.value }))}
                    placeholder="Cadastrado na Carbigdata pro modo Externo (sandbox)"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                ) : (
                  <input value={form.deviceIdSandbox}
                    onChange={e => setForm(f => ({ ...f, deviceIdSandbox: e.target.value }))}
                    placeholder="Ex.: CAM216066289"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Chave de API <span className="lowercase text-slate-500">(sandbox)</span></div>
                <div className="flex gap-2 items-center">
                  <input type={showKey ? 'text' : 'password'} value={form.apiKeySandbox}
                    onChange={e => setForm(f => ({ ...f, apiKeySandbox: e.target.value }))}
                    placeholder={data.has_api_key_sandbox ? 'Chave salva — digite pra trocar' : 'Ainda não cadastrada'}
                    className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowKey(s => !s)}
                    className="shrink-0 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs text-white">{showKey ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Device ID <span className="lowercase text-slate-500">(produção{tipoExterno ? ' · externo' : ''})</span></div>
                {tipoExterno ? (
                  <input value={form.deviceIdProducaoExterno}
                    onChange={e => setForm(f => ({ ...f, deviceIdProducaoExterno: e.target.value }))}
                    placeholder="Cadastrado separadamente na Carbigdata"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                ) : (
                  <input value={form.deviceIdProducao}
                    onChange={e => setForm(f => ({ ...f, deviceIdProducao: e.target.value }))}
                    placeholder="Cadastrado separadamente na Carbigdata"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Chave de API <span className="lowercase text-slate-500">(produção)</span></div>
                <div className="flex gap-2 items-center">
                  <input type={showKey ? 'text' : 'password'} value={form.apiKeyProducao}
                    onChange={e => setForm(f => ({ ...f, apiKeyProducao: e.target.value }))}
                    placeholder={data.has_api_key_producao ? 'Chave salva — digite pra trocar' : 'Ainda não cadastrada'}
                    className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  <button type="button" onClick={() => setShowKey(s => !s)}
                    className="shrink-0 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-xs text-white">{showKey ? 'Ocultar' : 'Mostrar'}</button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Endpoint usado: <code className="text-slate-400">{endpointHost}</code>.{' '}
            {form.ambiente === 'sandbox'
              ? 'Valide as capturas em sandbox antes de trocar pra produção.'
              : 'Cadastro de produção é feito separadamente na Carbigdata, depois da validação em sandbox.'}
          </p>
        </Card>

        {tipoExterno && (
          <Card title="Modelo de câmera homologado" icon={ICONS.camera}>
            <p className="text-xs text-slate-500 -mt-1">Apenas modelos já validados com o parser do webhook aparecem aqui.</p>
            <select value={form.modeloCamera}
              onChange={e => setForm(f => ({ ...f, modeloCamera: e.target.value }))}
              className="w-full max-w-md rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">Selecione o modelo…</option>
              {(data.modelos_homologados || []).map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Card>
        )}

        {tipoExterno && (
          <Card title="Webhook" icon={ICONS.link}>
            {!data.webhook_url ? (
              <p className="text-sm text-slate-400">A URL do webhook é gerada automaticamente na primeira vez que você salvar com o modo Externo ativado.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">URL do webhook</div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 truncate rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-emerald-300">{data.webhook_url}</code>
                    <CopyButton text={data.webhook_url} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Cole essa URL no campo <strong>Host URL</strong> da configuração de evento/webhook da câmera (menu de ANPR/Smart Event dela).</p>
              </>
            )}
          </Card>
        )}

        {!tipoExterno && (
          <Card title="Conexão SFTP" icon={ICONS.upload}>
            {!data.sftp_usuario ? (
              <p className="text-sm text-slate-400">O usuário e a senha SFTP são gerados automaticamente na primeira vez que você salvar com a integração ativada.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Host / Porta</div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 truncate rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-emerald-300">{data.sftp_host} : {data.sftp_port}</code>
                    <CopyButton text={`${data.sftp_host}:${data.sftp_port}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Usuário</div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 truncate rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-emerald-300">{data.sftp_usuario}</code>
                    <CopyButton text={data.sftp_usuario} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Senha</div>
                  <div className="flex gap-2 items-center">
                    <code className="flex-1 truncate rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-emerald-300">{data.sftp_senha}</code>
                    <CopyButton text={data.sftp_senha} />
                  </div>
                </div>
                <p className="text-xs text-slate-500">Cole esses dados no menu <strong>Local → FTP</strong> da câmera.</p>
              </>
            )}
          </Card>
        )}

        {tipoExterno && (
          <Card title="Vínculo de segurança" icon={ICONS.lock}>
            <p className="text-xs text-slate-500 -mt-1">
              Trava esta chave à câmera física que a utilizar primeiro, evitando que o mesmo cadastro seja reaproveitado em outro endereço.
            </p>

            {data.mac_travado ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">Câmera vinculada</div>
                    <div className="text-sm text-emerald-200/80 font-mono">MAC {data.mac_travado}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <Icon path={ICONS.pin} className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <span>
                    Endereço cadastrado:{' '}
                    <strong className="text-slate-300">
                      {endereco || (data.lat && data.lng ? `${data.lat}, ${data.lng}` : 'não cadastrado ainda')}
                    </strong>
                    {endereco && data.lat && data.lng && ` (${data.lat}, ${data.lng})`}
                  </span>
                </div>
                <button type="button" onClick={() => setShowResetModal(true)}
                  className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 px-3.5 py-2 text-sm font-semibold">
                  Resetar vínculo da câmera
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-slate-900 border border-slate-700 p-3">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-700 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">Aguardando primeira captura</div>
                  <div className="text-xs text-slate-500">O MAC da câmera será travado automaticamente assim que a primeira detecção chegar.</div>
                </div>
              </div>
            )}
          </Card>
        )}

        {!tipoExterno && (
          <Card title="Janela de envio" icon={ICONS.clock}>
            <Segmented
              options={[['24h', '24 horas'], ['comercial', 'Comercial'], ['manual', 'Manual']]}
              value={form.horarioModo}
              onChange={(v) => setForm(f => ({ ...f, horarioModo: v }))}
            />

            {form.horarioModo === 'manual' && (
              <div className="flex gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Início</div>
                  <input type="time" value={form.horarioInicio}
                    onChange={e => setForm(f => ({ ...f, horarioInicio: e.target.value }))}
                    className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Fim</div>
                  <input type="time" value={form.horarioFim}
                    onChange={e => setForm(f => ({ ...f, horarioFim: e.target.value }))}
                    className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-slate-300">{janela.texto}</p>
              <div className="relative h-8 rounded-md overflow-hidden border border-slate-700"
                style={{ background: 'linear-gradient(90deg, #0f172a 0%, #0f172a 18%, #b45309 30%, #fde68a 50%, #b45309 70%, #0f172a 82%, #0f172a 100%)' }}>
                <div className="absolute inset-y-0 border-x-2 border-blue-400 bg-blue-400/30"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-mono">
                <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
              </div>
            </div>
          </Card>
        )}

        <Card title="Status" icon={ICONS.chart}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Último envio: <span className="text-white">{data.ultimo_envio_em || '—'}</span>
            </span>
            {badge && <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.cls}`}>{badge.label}</span>}
          </div>
        </Card>

        {!tipoExterno && <CapturasCarousel id={id} />}
      </div>

      {saveError && <div className="rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-3 py-2">{saveError}</div>}

      <div className="flex items-center gap-3">
        {canEdit && (
          <button disabled={saving} onClick={salvar}
            className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-sm text-white">
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        )}
        {saveOk && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6L9 17l-5-5" /></svg>
            Alterações salvas
          </span>
        )}
      </div>

      {showResetModal && (
        <ResetVinculoModal
          id={id}
          endereco={endereco}
          lat={data.lat}
          lng={data.lng}
          onClose={() => setShowResetModal(false)}
          onDone={async () => { setShowResetModal(false); await load() }}
        />
      )}
    </div>
  )
}
