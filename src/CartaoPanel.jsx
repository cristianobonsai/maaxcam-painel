import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiError } from './lib/api'
import { usePermissions } from './hooks/usePermissions'

const msg = (e) => (e instanceof ApiError ? e.message : 'Erro inesperado.')

// "city_state" e "weather" existem no motor mas ficam em pausa por enquanto
// (ver plano_cartoes_intercalados.md - a WeatherAPI errava a localização em
// cidades litorâneas pequenas). Reativar aqui é só acrescentar na lista.
// "camera_status" só faz sentido no cartão de offline (mostra "Câmera offline"
// e troca sozinho pra "Em manutenção" depois do tempo configurado abaixo).
const DYNAMIC_SOURCES = [
  { value: 'camera_name', label: 'Nome da câmera' },
  { value: 'datetime', label: 'Data e hora' },
  { value: 'camera_status', label: 'Status da câmera (Offline / Em manutenção)', offlineOnly: true },
]
function dynamicSourcesFor(tab) {
  return DYNAMIC_SOURCES.filter((s) => !s.offlineOnly || tab === 'offline')
}

// Famílias de fonte instaladas no servidor (/opt/camera-relay/fonts/) — cada uma com
// versão Regular e Negrito. "dejavu" é a fonte original (padrão pros itens já salvos
// antes desta funcionalidade existir). "pacifico" não tem negrito (fonte script de
// peso único) — o servidor usa a regular nos dois casos.
const FONT_FAMILIES = [
  { value: 'dejavu', label: 'DejaVu Sans (padrão)' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'oswald', label: 'Oswald (condensada)' },
  { value: 'playfair', label: 'Playfair Display (serifada)' },
  { value: 'jetbrains', label: 'JetBrains Mono (monoespaçada)' },
  { value: 'pacifico', label: 'Pacifico (manuscrita)' },
]

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

function itemSummary(item) {
  const p = item.position || {}
  if (item.type === 'image') {
    return `Imagem — ${item.width_pct ?? 15}% de largura, (${p.x ?? 0}%, ${p.y ?? 0}%)`
  }
  const label = item.mode === 'dynamic'
    ? (DYNAMIC_SOURCES.find((s) => s.value === item.source)?.label || item.source || 'Dinâmico')
    : (item.content || '(vazio)')
  return `"${label}" — ${item.style?.size ?? 32}px, (${p.x ?? 0}%, ${p.y ?? 0}%)`
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const emptyDraft = () => ({
  type: 'text',
  mode: 'fixed',
  content: '',
  source: 'camera_name',
  style: { font: 'regular', font_family: 'dejavu', size: 32, color: '#FFFFFF', align: 'left' },
  position: { x: 5, y: 5 },
  image_path: '',
  width_pct: 15,
})

// Painel do cartão de introdução/offline, usado como aba dentro de
// CameraSeguranca.jsx (igual MonitorPanel e LocationEditor). Recebe o id da
// câmera via prop, não via rota própria — não é mais uma página separada.
export default function CartaoPanel({ id }) {
  const perms = usePermissions()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [tab, setTab] = useState('intro')
  const [itemsByType, setItemsByType] = useState({ intro: [], offline: [] })
  const [duration, setDuration] = useState(5)
  const [offlineTimeout, setOfflineTimeout] = useState(30)
  const [snapshotBgByType, setSnapshotBgByType] = useState({ intro: false, offline: false })

  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewNonce, setPreviewNonce] = useState(0)

  const [draft, setDraft] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)
  const [uploadingItemImage, setUploadingItemImage] = useState(false)
  const previewBoxRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [bgUploading, setBgUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const card = await api.get(`/api/cameras/${id}/card`)
      const cam = await api.get(`/api/cameras/${id}`)
      setData({ ...card, name: cam.name, camera_id: cam.camera_id, group_name: cam.group_name })
      setItemsByType({ intro: card.items_intro || [], offline: card.items_offline || [] })
      setDuration(card.card_duration_seconds || 5)
      setOfflineTimeout(card.card_offline_timeout_minutes || 30)
      setSnapshotBgByType({ intro: !!card.card_intro_use_snapshot, offline: !!card.card_offline_use_snapshot })
    } catch (e) { setError(msg(e)) }
    finally { setLoading(false) }
  }, [id])

  const refreshStatus = useCallback(async () => {
    try {
      const card = await api.get(`/api/cameras/${id}/card`)
      setData((prev) => ({ ...prev, ...card }))
    } catch (e) { setError(msg(e)) }
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let alive = true
    let objectUrl = null
    setPreviewLoading(true)
    api.getBlob(`/api/cameras/${id}/card/preview?card_type=${tab}&_=${previewNonce}`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (alive) setPreviewUrl(objectUrl)
      })
      .catch(() => { if (alive) setPreviewUrl(null) })
      .finally(() => { if (alive) setPreviewLoading(false) })
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [id, tab, previewNonce])

  const run = async (fn) => { setBusy(true); setError(''); try { await fn(); await refreshStatus() } catch (e) { setError(msg(e)) } finally { setBusy(false) } }

  async function saveItems() {
    setSaving(true); setSaveError(''); setSaveOk(false)
    try {
      const body = { card_type: tab, items: itemsByType[tab], use_snapshot_bg: snapshotBgByType[tab] }
      if (tab === 'intro') body.duration_seconds = duration
      if (tab === 'offline') body.offline_timeout_minutes = offlineTimeout
      await api.put(`/api/cameras/${id}/card/items`, body)
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
      setPreviewNonce((n) => n + 1)
      await load()
    } catch (e) { setSaveError(msg(e)) }
    finally { setSaving(false) }
  }

  function openAddItem() { setDraft(emptyDraft()); setEditingIndex(null); setSaveError('') }
  function openEditItem(i) { setDraft(JSON.parse(JSON.stringify(itemsByType[tab][i]))); setEditingIndex(i); setSaveError('') }
  function cancelDraft() { setDraft(null); setEditingIndex(null) }

  function confirmDraft() {
    const list = itemsByType[tab]
    if (editingIndex === null && list.length >= 10) { setSaveError('Máximo de 10 itens por cartão.'); return }
    const next = [...list]
    if (editingIndex === null) next.push(draft)
    else next[editingIndex] = draft
    setItemsByType((p) => ({ ...p, [tab]: next }))
    setDraft(null); setEditingIndex(null)
  }

  function removeItem(i) {
    if (!window.confirm('Remover este item do cartão?')) return
    setItemsByType((p) => ({ ...p, [tab]: p[tab].filter((_, idx) => idx !== i) }))
  }

  function onBgFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    run(async () => {
      setBgUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('duration_seconds', String(duration))
        await api.upload(`/api/cameras/${id}/card`, fd)
        setPreviewNonce((n) => n + 1)
      } finally { setBgUploading(false) }
    })
  }

  function onItemImageFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !draft) return
    setUploadingItemImage(true)
    const fd = new FormData()
    fd.append('file', file)
    api.upload(`/api/cameras/${id}/card/item-image`, fd)
      .then((res) => setDraft((d) => ({ ...d, image_path: res.image_path })))
      .catch((e) => setSaveError(msg(e)))
      .finally(() => setUploadingItemImage(false))
  }

  // Arrastar o item na pré-visualização (v2 do editor — antes só dava pra digitar
  // X/Y em %). O ponto azul representa exatamente o pixel-âncora que o servidor usa
  // (canto superior esquerdo pra imagem; depende do alinhamento pro texto — ver a
  // dica de alinhamento mais abaixo). Os campos numéricos continuam existindo como
  // ajuste fino/preciso.
  function posFromPointer(e) {
    const rect = previewBoxRef.current.getBoundingClientRect()
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  }
  function handleMarkerPointerDown(e) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  function handleMarkerPointerMove(e) {
    if (!dragging) return
    setDraft((d) => (d ? { ...d, position: posFromPointer(e) } : d))
  }
  function handleMarkerPointerUp(e) {
    setDragging(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignora */ }
  }

  if (loading) return <p className="text-sm text-slate-400">Carregando cartão…</p>
  if (!data) return <p className="text-sm text-red-400">{error || 'Não foi possível carregar.'}</p>

  const items = itemsByType[tab]

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-6 border-b border-slate-700 flex-1">
          {[['intro', 'Cartão de introdução'], ['offline', 'Cartão de offline']].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setDraft(null); setEditingIndex(null) }}
              className={`pb-3 text-sm font-semibold border-b-2 -mb-px ${tab === key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'intro' && (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${data.card_enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-600/40 text-slate-300'}`}>
            {data.card_enabled ? 'Ativo no ar' : 'Desativado'}
          </span>
        )}
      </div>

      {error && <div className="rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-3 py-2">{error}</div>}

      {tab === 'intro' && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-200/90">
          O cartão de introdução só aparece no ar se esta câmera fizer parte de um <strong>grupo</strong> (rodízio) — ele entra no intervalo entre uma câmera e outra do carrossel.
        </div>
      )}

      {tab === 'offline' && (
        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-200/90">
          {data.group_name
            ? <>Esta câmera faz parte do grupo <strong>{data.group_name}</strong>. A ativação automática do cartão no ar quando a câmera cai ainda não está disponível para câmeras em grupo — por enquanto funciona só pra câmeras avulsas. Dá pra configurar e pré-visualizar o cartão normalmente.</>
            : <>Esta câmera é avulsa — dá pra ativar abaixo pra que este cartão apareça automaticamente ao vivo no YouTube (no lugar do vídeo de espera genérico) quando a câmera cair.</>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-5 items-start">

        <div className="space-y-5">
          <Card title="Pré-visualização" icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10">
            <div ref={previewBoxRef} className="relative aspect-video w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
              {previewLoading ? (
                <span className="text-xs text-slate-500">Carregando…</span>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Pré-visualização do cartão" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-500 px-4 text-center">Ainda não há pré-visualização — envie uma imagem de fundo e salve os itens.</span>
              )}
              {draft && (
                <div
                  onPointerDown={handleMarkerPointerDown}
                  onPointerMove={handleMarkerPointerMove}
                  onPointerUp={handleMarkerPointerUp}
                  style={{ left: `${draft.position.x}%`, top: `${draft.position.y}%`, touchAction: 'none' }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 select-none z-10 flex flex-col items-center ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 border-white shadow-lg ${dragging ? 'bg-blue-400 scale-110' : 'bg-blue-500'}`} />
                  <div className="mt-1 whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] text-white">
                    {dragging ? `${draft.position.x}%, ${draft.position.y}%` : 'Arraste'}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {draft
                ? 'Arraste o ponto azul pra posicionar o item que você está editando — os campos X/Y abaixo se ajustam sozinhos, e continuam disponíveis pra ajuste fino.'
                : "A pré-visualização atualiza depois que você salva. O YouTube adiciona a marca d'água dele por cima — ela não aparece aqui."}
            </p>
            {perms.canEditCameras && (
              <div className="flex items-center gap-3">
                <button disabled={saving} onClick={saveItems}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm text-white">
                  {saving ? 'Salvando…' : 'Salvar e atualizar pré-visualização'}
                </button>
                {saveOk && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6L9 17l-5-5" /></svg>
                    Salvo
                  </span>
                )}
              </div>
            )}
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </Card>

          <Card title="Imagem de fundo" icon="M4 5h16v14H4z">
            <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2.5">
              <div>
                <div className="text-sm text-slate-200">Usar foto automática da câmera</div>
                <div className="text-xs text-slate-500">
                  {tab === 'offline'
                    ? "Atualiza sozinha (a cada 15 min, ou na hora quando a câmera fica ao vivo). Sai levemente escurecida/dessaturada."
                    : "Atualiza sozinha (a cada 15 min, ou na hora quando a câmera fica ao vivo). Aparece com a imagem real, sem filtro."}
                </div>
              </div>
              <button disabled={busy} onClick={() => setSnapshotBgByType((p) => ({ ...p, [tab]: !p[tab] }))}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${snapshotBgByType[tab] ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                {snapshotBgByType[tab] ? 'Ativado' : 'Desativado'}
              </button>
            </div>
            <p className="text-xs text-slate-500">{data.card_image_path ? 'Já existe uma imagem de fundo configurada.' : 'Nenhuma imagem de fundo ainda.'}</p>
            <label className={`inline-block rounded-md px-4 py-2 text-sm ${bgUploading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'}`}>
              {data.card_image_path ? 'Trocar imagem de fundo' : 'Enviar imagem de fundo'}
              <input type="file" accept="image/*" className="hidden" disabled={bgUploading || busy} onChange={onBgFile} />
            </label>
            <p className="text-xs text-slate-500">Depois de trocar a imagem de fundo, clique em <strong>Salvar cartão</strong> de novo pra reaplicar seus itens em cima dela.</p>
            <p className="text-xs text-amber-300/90">
              {snapshotBgByType[tab]
                ? 'Com a foto automática ativada, ela é usada no lugar da imagem enviada aqui em cima (que fica como reserva, caso a foto automática ainda não exista pra esta câmera).'
                : 'Sem a foto automática, este cartão usa a imagem de fundo enviada aqui em cima — a mesma imagem vale pros dois cartões (introdução e offline), a não ser que um deles ative a foto automática.'}
            </p>
          </Card>

          {tab === 'intro' && (
            <Card title="Duração e ativação" icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Duração do cartão: {duration}s</div>
                <input type="range" min="1" max="10" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" />
                <p className="text-xs text-slate-500">Quanto tempo o cartão fica na tela dentro do rodízio do grupo. Salva junto com os itens.</p>
              </div>
              <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2.5">
                <span className="text-sm text-slate-300">Cartão ativo no rodízio</span>
                <button disabled={busy || !data.card_video_path}
                  onClick={() => run(() => api.put(`/api/cameras/${id}/card/toggle`, { enabled: !data.card_enabled }))}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${data.card_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  {data.card_enabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>
              {!data.card_video_path && <p className="text-xs text-slate-500">Salve pelo menos um item (com a imagem de fundo configurada) antes de ativar.</p>}
            </Card>
          )}

          {tab === 'offline' && (
            <Card title="Tempo até 'Em manutenção'" icon="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-400">Depois de {offlineTimeout} minuto{offlineTimeout === 1 ? '' : 's'} offline, o texto troca sozinho</div>
                <input type="number" min="1" max="1440" value={offlineTimeout}
                  onChange={(e) => setOfflineTimeout(Math.max(1, Math.min(1440, Number(e.target.value) || 1)))}
                  className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                <p className="text-xs text-slate-500">
                  Usa o item "Status da câmera" (adicione um item de texto dinâmico com essa opção). Antes desse tempo mostra "Câmera offline", depois muda pra "Em manutenção". Salva junto com os itens.
                </p>
              </div>
            </Card>
          )}

          {tab === 'offline' && !data.group_name && (
            <Card title="Cartão automático na transmissão" icon="M15 10l4.55-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.45.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z">
              <div className="flex items-center justify-between rounded-md bg-slate-900/60 px-3 py-2.5">
                <div>
                  <div className="text-sm text-slate-200">Ativar cartão automático na transmissão</div>
                  <div className="text-xs text-slate-500">Quando a câmera cair, este cartão aparece ao vivo no YouTube no lugar do vídeo de espera genérico. Some sozinho assim que a câmera volta.</div>
                </div>
                <button disabled={busy || !data.card_offline_video_exists}
                  onClick={() => run(() => api.put(`/api/cameras/${id}/card/offline-live-toggle`, { enabled: !data.card_offline_live_enabled }))}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${data.card_offline_live_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                  {data.card_offline_live_enabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>
              {!data.card_offline_video_exists && (
                <p className="text-xs text-slate-500">Salve o cartão de offline (com a imagem de fundo configurada) pelo menos uma vez antes de ativar isso.</p>
              )}
              <p className="text-xs text-amber-300/90">Ao ativar, o serviço da câmera reinicia automaticamente (~15s de instabilidade no vídeo). Ao desativar, nada é reiniciado.</p>
            </Card>
          )}

          {perms.canEditCameras && data.card_video_path && (
            <Card title="Remover cartão" icon="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16">
              <p className="text-xs text-slate-500">Apaga a imagem de fundo, o vídeo gerado e desativa o cartão. Os itens configurados continuam salvos.</p>
              <button disabled={busy} onClick={() => { if (window.confirm('Apagar a imagem de fundo e o vídeo deste cartão?')) run(() => api.del(`/api/cameras/${id}/card`)) }}
                className="rounded-md border border-red-700 px-4 py-2 text-sm text-red-300 hover:border-red-500">Apagar cartão</button>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title={`Itens do cartão (${items.length}/10)`} icon="M4 6h16M4 12h16M4 18h7">
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-slate-900/60 px-3 py-2 text-sm">
                  <span className="truncate text-slate-200">{itemSummary(item)}</span>
                  {perms.canEditCameras && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditItem(i)} className="text-blue-300 hover:text-blue-200 text-xs">Editar</button>
                      <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 text-xs">Remover</button>
                    </div>
                  )}
                </li>
              ))}
              {items.length === 0 && <li className="text-xs text-slate-500">Nenhum item ainda.</li>}
            </ul>

            {perms.canEditCameras && !draft && (
              <button disabled={items.length >= 10} onClick={openAddItem}
                className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 text-sm text-white">
                + Adicionar item
              </button>
            )}

            {draft && (
              <div className="rounded-lg border border-slate-600 bg-slate-900/70 p-4 space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-slate-300">
                    <input type="radio" checked={draft.type === 'text'} onChange={() => setDraft((d) => ({ ...d, type: 'text' }))} /> Texto
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-slate-300">
                    <input type="radio" checked={draft.type === 'image'} onChange={() => setDraft((d) => ({ ...d, type: 'image' }))} /> Imagem
                  </label>
                </div>

                {draft.type === 'text' ? (
                  <>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-sm text-slate-300">
                        <input type="radio" checked={draft.mode === 'fixed'} onChange={() => setDraft((d) => ({ ...d, mode: 'fixed' }))} /> Fixo
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-slate-300">
                        <input type="radio" checked={draft.mode === 'dynamic'} onChange={() => setDraft((d) => ({ ...d, mode: 'dynamic' }))} /> Dinâmico
                      </label>
                    </div>
                    {draft.mode === 'fixed' ? (
                      <input value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} placeholder="Texto a exibir"
                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                    ) : (
                      <select value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                        {dynamicSourcesFor(tab).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    )}
                    {draft.mode === 'dynamic' && draft.source === 'camera_status' && (
                      <p className="text-xs text-amber-300/90">
                        Na pré-visualização sempre aparece "Câmera offline" (é só um exemplo — não reflete o status real agora). O texto só calcula certo ("Câmera offline" logo após cair, "Em manutenção" depois do tempo configurado) quando a câmera realmente estiver no ar mostrando este cartão.
                      </p>
                    )}
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Família da fonte</div>
                      <select value={draft.style.font_family || 'dejavu'} onChange={(e) => setDraft((d) => ({ ...d, style: { ...d.style, font_family: e.target.value } }))}
                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                        {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Peso</div>
                        <select value={draft.style.font} onChange={(e) => setDraft((d) => ({ ...d, style: { ...d.style, font: e.target.value } }))}
                          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option value="regular">Regular</option>
                          <option value="bold">Negrito</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Tamanho (px)</div>
                        <input type="number" min="8" max="200" value={draft.style.size}
                          onChange={(e) => setDraft((d) => ({ ...d, style: { ...d.style, size: Number(e.target.value) } }))}
                          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Cor</div>
                        <input type="color" value={draft.style.color}
                          onChange={(e) => setDraft((d) => ({ ...d, style: { ...d.style, color: e.target.value } }))}
                          className="w-full h-9 rounded-md bg-slate-900 border border-slate-700" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Alinhamento</div>
                        <select value={draft.style.align} onChange={(e) => setDraft((d) => ({ ...d, style: { ...d.style, align: e.target.value } }))}
                          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label className={`inline-block rounded-md px-4 py-2 text-sm ${uploadingItemImage ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer'}`}>
                      {uploadingItemImage ? 'Enviando…' : (draft.image_path ? 'Trocar imagem' : 'Enviar imagem')}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingItemImage} onChange={onItemImageFile} />
                    </label>
                    {draft.image_path && <p className="text-xs text-emerald-400">Imagem enviada ✓</p>}
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Largura (% da tela)</div>
                      <input type="number" min="2" max="100" value={draft.width_pct}
                        onChange={(e) => setDraft((d) => ({ ...d, width_pct: Number(e.target.value) }))}
                        className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Posição X (%)</div>
                    <input type="number" min="0" max="100" value={draft.position.x}
                      onChange={(e) => setDraft((d) => ({ ...d, position: { ...d.position, x: Number(e.target.value) } }))}
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Posição Y (%)</div>
                    <input type="number" min="0" max="100" value={draft.position.y}
                      onChange={(e) => setDraft((d) => ({ ...d, position: { ...d.position, y: Number(e.target.value) } }))}
                      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">0% é o canto esquerdo/superior, 100% é o canto direito/inferior da tela (1920×1080) — dá pra digitar aqui ou arrastar o ponto azul na pré-visualização ao lado.</p>
                {draft.type === 'text' && (
                  <p className="text-xs text-amber-300/90">
                    {draft.style.align === 'right'
                      ? 'Alinhamento "Direita": o X marca a borda DIREITA do texto — o texto fica todo à esquerda desse ponto. Pra encostar na borda direita da tela, use X perto de 90-95.'
                      : draft.style.align === 'center'
                        ? 'Alinhamento "Centro": o X marca o CENTRO do texto — ele fica metade pra cada lado desse ponto.'
                        : 'Alinhamento "Esquerda": o X marca a borda esquerda do texto — ele fica todo à direita desse ponto.'}
                  </p>
                )}

                <div className="flex gap-3">
                  <button onClick={confirmDraft} disabled={draft.type === 'image' && !draft.image_path}
                    className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-4 py-2 text-sm text-white">
                    {editingIndex === null ? 'Adicionar item' : 'Atualizar item'}
                  </button>
                  <button onClick={cancelDraft} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500">Cancelar</button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
              {perms.canEditCameras && (
                <button disabled={saving} onClick={saveItems}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm text-white">
                  {saving ? 'Salvando…' : 'Salvar cartão'}
                </button>
              )}
              {saveOk && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6L9 17l-5-5" /></svg>
                  Cartão salvo e atualizado
                </span>
              )}
            </div>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
            <p className="text-xs text-slate-500">Salvar recompõe a imagem e o vídeo do cartão na hora — a mudança aparece no rodízio em até ~2 ciclos.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
