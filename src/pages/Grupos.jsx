import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, ApiError } from '../lib/api'

const API_URL = 'https://api.maaxcam.com.br'
const EMPTY_FORM = { name: '', youtube_key: '', transition_seconds: 5, enabled: false }

function minDuration(nCams) {
  if (nCams <= 4) return 6
  if (nCams <= 7) return 8
  return 10
}

export default function Grupos() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [me, setMe] = useState(null)
  const [groups, setGroups] = useState([])
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [editing, setEditing] = useState(null) // null | 'new' | id
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [addingTo, setAddingTo] = useState(null)
  const [addForm, setAddForm] = useState({ camera_id: '', duration_seconds: 6 })
  const [addError, setAddError] = useState('')
  const [durEdits, setDurEdits] = useState({})

  async function load() {
    setLoading(true)
    setError('')
    try {
      const meData = await api.get('/api/me')
      setMe(meData)
      if (meData?.is_admin) {
        const [g, cams] = await Promise.all([api.get('/api/groups'), api.get('/api/cameras')])
        setGroups(Array.isArray(g) ? g : [])
        setCameras(Array.isArray(cams) ? cams : (cams?.cameras ?? []))
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(EMPTY_FORM); setFormError(''); setEditing('new') }
  function openEdit(g) {
    setForm({ name: g.name || '', youtube_key: '', transition_seconds: g.transition_seconds ?? 5, enabled: !!g.enabled })
    setFormError(''); setEditing(g.id)
  }
  function closeForm() { setEditing(null); setForm(EMPTY_FORM); setFormError('') }

  async function save() {
    if (!form.name.trim()) { setFormError('O nome é obrigatório.'); return }
    setSaving(true); setFormError('')
    try {
      const body = { name: form.name.trim(), transition_seconds: Number(form.transition_seconds) || 5 }
      if (form.youtube_key.trim()) body.youtube_key = form.youtube_key.trim()
      if (editing === 'new') {
        await api.post('/api/groups', body)
      } else {
        body.enabled = form.enabled
        await api.put(`/api/groups/${editing}`, body)
      }
      closeForm()
      await load()
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteGroup(g) {
    const msg = g.relay_active
      ? `Excluir "${g.name}"? Ele está NO AR — isso vai PARAR o stream no YouTube e apagar o grupo e suas câmeras.`
      : `Excluir "${g.name}"? Isso apaga o grupo e suas câmeras. Não dá pra desfazer.`
    if (!window.confirm(msg)) return
    setBusy(true); setError('')
    try {
      await api.del(`/api/groups/${g.id}`)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao excluir.')
    } finally {
      setBusy(false)
    }
  }

  async function startRelay(g) {
    if (!g.youtube_key) { setError('Configure a YouTube key do grupo antes de iniciar.'); return }
    if ((g.cameras?.length ?? 0) === 0) { setError('Adicione ao menos uma câmera antes de iniciar.'); return }
    if (!window.confirm(`Iniciar a transmissão do grupo "${g.name}" no YouTube? Isso para os relays individuais das câmeras do grupo (exclusividade) e usa mais CPU.`)) return
    setBusy(true); setError('')
    try {
      if (!g.enabled) await api.put(`/api/groups/${g.id}`, { enabled: true })
      await api.post(`/api/groups/${g.id}/relay/start`)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao iniciar o relay.')
    } finally {
      setBusy(false)
    }
  }

  async function stopRelay(g) {
    if (!window.confirm(`Parar a transmissão do grupo "${g.name}"? Tira o grupo do ar no YouTube e desabilita o grupo (pra o monitor não religar em até 2 min).`)) return
    setBusy(true); setError('')
    try {
      await api.put(`/api/groups/${g.id}`, { enabled: false })
      await api.post(`/api/groups/${g.id}/relay/stop`)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao parar o relay.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadAudio(g, inputEl) {
    const file = inputEl.files?.[0]
    if (!file) return
    if (!session?.access_token) { setError('Sessão expirada, faça login novamente.'); return }
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_URL}/api/groups/${g.id}/audio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })
      if (!res.ok) throw new Error(`Upload falhou (HTTP ${res.status}).`)
      inputEl.value = ''
      await load()
    } catch (e) {
      setError(e.message || 'Erro no upload do áudio.')
    } finally {
      setBusy(false)
    }
  }

  function openAdd(g) {
    const resultingN = (g.cameras?.length ?? 0) + 1
    setAddForm({ camera_id: '', duration_seconds: minDuration(resultingN) })
    setAddError(''); setAddingTo(g.id)
  }

  async function addCamera(g) {
    if (!addForm.camera_id) { setAddError('Selecione uma câmera.'); return }
    setBusy(true); setAddError('')
    try {
      await api.post(`/api/groups/${g.id}/cameras`, {
        camera_id: addForm.camera_id,
        duration_seconds: Number(addForm.duration_seconds) || 6,
      })
      setAddingTo(null)
      await load()
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : 'Erro ao adicionar.')
    } finally {
      setBusy(false)
    }
  }

  async function removeCamera(g, c) {
    if (!window.confirm(`Remover "${c.camera_name || c.camera_id}" do grupo?`)) return
    setBusy(true); setError('')
    try {
      await api.del(`/api/groups/${g.id}/cameras/${c.id}`)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao remover.')
    } finally {
      setBusy(false)
    }
  }

  async function saveDuration(g, c) {
    const dur = Number(durEdits[c.id])
    if (!dur) return
    setBusy(true); setError('')
    try {
      await api.put(`/api/groups/${g.id}/cameras/${c.id}`, { duration_seconds: dur })
      setDurEdits((prev) => { const n = { ...prev }; delete n[c.id]; return n })
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao salvar duração.')
    } finally {
      setBusy(false)
    }
  }

  async function moveCamera(g, index, dir) {
    const cams = g.cameras || []
    const j = index + dir
    if (j < 0 || j >= cams.length) return
    const a = cams[index], b = cams[j]
    setBusy(true); setError('')
    try {
      await api.put(`/api/groups/${g.id}/cameras/${a.id}`, { order_index: b.order_index })
      await api.put(`/api/groups/${g.id}/cameras/${b.id}`, { order_index: a.order_index })
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao reordenar.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-white">Grupos</h1>
            <button onClick={() => navigate('/painel')}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500">
              Voltar
            </button>
          </div>

          {loading && <p className="mt-6 text-slate-300">Carregando…</p>}

          {!loading && me && !me.is_admin && (
            <p className="mt-6 text-red-300">Acesso restrito a administradores.</p>
          )}

          {!loading && me?.is_admin && (
            <>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-400">{groups.length} grupo(s) cadastrado(s).</p>
                {editing === null && (
                  <button onClick={openNew}
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600">
                    Novo grupo
                  </button>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

              {editing !== null && (
                <div className="mt-4 rounded-lg border border-blue-500 bg-slate-800 p-4">
                  <h2 className="font-semibold text-white">{editing === 'new' ? 'Novo grupo' : 'Editar grupo'}</h2>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Nome</label>
                      <input className={inputClass} value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Grupo Centro" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        YouTube key{editing !== 'new' ? ' (deixe em branco para manter a atual)' : ''}
                      </label>
                      <input className={inputClass} value={form.youtube_key}
                        onChange={(e) => setForm({ ...form, youtube_key: e.target.value })}
                        placeholder={editing === 'new' ? 'opcional' : '••••••••'} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Transição (segundos)</label>
                      <input type="number" className={inputClass} value={form.transition_seconds}
                        onChange={(e) => setForm({ ...form, transition_seconds: e.target.value })} />
                    </div>
                    {editing !== 'new' && (
                      <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input type="checkbox" className="accent-blue-500" checked={form.enabled}
                          onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                        Habilitado
                      </label>
                    )}
                  </div>
                  {formError && <p className="mt-3 text-sm text-red-300">{formError}</p>}
                  <div className="mt-4 flex gap-3">
                    <button onClick={save} disabled={saving}
                      className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                      {saving ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button onClick={closeForm} disabled={saving}
                      className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500 disabled:opacity-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {groups.map((g) => {
                  const cams = g.cameras || []
                  const used = new Set(cams.map((c) => c.camera_id))
                  const available = cameras.filter((c) => !used.has(c.camera_id))
                  return (
                    <div key={g.id} className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-semibold text-white">{g.name || '(sem nome)'}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {g.relay_active ? (
                              <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">No ar</span>
                            ) : (
                              <span className="rounded bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-200">Parado</span>
                            )}
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${g.enabled ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
                              {g.enabled ? 'Habilitado' : 'Desabilitado'}
                            </span>
                            {!g.youtube_key && (
                              <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Sem YouTube key</span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right text-xs text-slate-400">
                            <div>transição: {g.transition_seconds}s</div>
                            <div>{cams.length} câmera(s)</div>
                          </div>
                          <button onClick={() => openEdit(g)} disabled={busy}
                            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50">
                            Editar
                          </button>
                          <button onClick={() => deleteGroup(g)} disabled={busy}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50">
                            Excluir
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                        {cams.length === 0 && <p className="text-sm text-slate-400">Nenhuma câmera neste grupo.</p>}
                        {cams.map((c, i) => {
                          const changed = durEdits[c.id] !== undefined && Number(durEdits[c.id]) !== c.duration_seconds
                          return (
                            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                                {i + 1}. {c.camera_name || c.camera_id}
                                <span className="ml-2 text-xs text-slate-500">{c.camera_id}</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <input type="number"
                                  className="w-16 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                                  value={durEdits[c.id] ?? c.duration_seconds}
                                  onChange={(e) => setDurEdits((prev) => ({ ...prev, [c.id]: e.target.value }))} />
                                <span className="text-xs text-slate-400">s</span>
                                {changed && (
                                  <button onClick={() => saveDuration(g, c)} disabled={busy}
                                    className="rounded border border-blue-500 px-2 py-1 text-xs text-blue-200 hover:bg-blue-500 hover:text-white disabled:opacity-50">
                                    Salvar
                                  </button>
                                )}
                                <button onClick={() => moveCamera(g, i, -1)} disabled={busy || i === 0}
                                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-blue-500 disabled:opacity-30">↑</button>
                                <button onClick={() => moveCamera(g, i, 1)} disabled={busy || i === cams.length - 1}
                                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:border-blue-500 disabled:opacity-30">↓</button>
                                <button onClick={() => removeCamera(g, c)} disabled={busy}
                                  className="rounded border border-red-500 px-2 py-1 text-xs text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50">×</button>
                              </div>
                            </div>
                          )
                        })}

                        {addingTo === g.id ? (
                          <div className="mt-2 rounded-lg border border-blue-500 bg-slate-900 p-3">
                            <div className="flex flex-wrap items-end gap-2">
                              <div className="min-w-0 flex-1">
                                <label className="mb-1 block text-xs text-slate-400">Câmera</label>
                                <select className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                  value={addForm.camera_id} onChange={(e) => setAddForm({ ...addForm, camera_id: e.target.value })}>
                                  <option value="">Selecione…</option>
                                  {available.map((c) => (
                                    <option key={c.camera_id} value={c.camera_id}>{(c.name || c.camera_id)} — {c.camera_id}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-24">
                                <label className="mb-1 block text-xs text-slate-400">Duração (s)</label>
                                <input type="number" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                  value={addForm.duration_seconds} onChange={(e) => setAddForm({ ...addForm, duration_seconds: e.target.value })} />
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Múltiplo de 2; mínimo {minDuration(cams.length + 1)}s para {cams.length + 1} câmera(s).
                            </p>
                            {available.length === 0 && <p className="mt-1 text-xs text-slate-400">Todas as câmeras já estão neste grupo.</p>}
                            {addError && <p className="mt-2 text-sm text-red-300">{addError}</p>}
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => addCamera(g)} disabled={busy || !addForm.camera_id}
                                className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                                Adicionar
                              </button>
                              <button onClick={() => setAddingTo(null)} disabled={busy}
                                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => openAdd(g)} disabled={busy}
                            className="mt-1 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500 disabled:opacity-50">
                            + Adicionar câmera
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-700 pt-3">
                        {g.relay_active ? (
                          <button onClick={() => stopRelay(g)} disabled={busy}
                            className="rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50">
                            Parar relay
                          </button>
                        ) : (
                          <button onClick={() => startRelay(g)} disabled={busy || !g.youtube_key || cams.length === 0}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                            Iniciar relay
                          </button>
                        )}
                        {!g.relay_active && (!g.youtube_key || cams.length === 0) && (
                          <span className="text-xs text-slate-400">
                            {!g.youtube_key && cams.length === 0
                              ? 'configure a YouTube key e adicione câmeras para iniciar'
                              : !g.youtube_key
                              ? 'configure a YouTube key para iniciar'
                              : 'adicione câmeras para iniciar'}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                          <span>Áudio: <span className="text-slate-300">{g.audio_file ? g.audio_file.split('/').pop() : 'nenhum'}</span></span>
                          <label className="cursor-pointer rounded-lg border border-slate-600 px-2 py-1 text-slate-300 hover:border-blue-500">
                            Enviar .mp3
                            <input type="file" accept="audio/mpeg,.mp3" className="hidden" disabled={busy}
                              onChange={(e) => uploadAudio(g, e.target)} />
                          </label>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {groups.length === 0 && !error && <p className="text-slate-400">Nenhum grupo cadastrado.</p>}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
