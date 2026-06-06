import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const EMPTY_FORM = { name: '', youtube_key: '', transition_seconds: 5, enabled: false }

export default function Grupos() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // null = form fechado | 'new' = criando | número = editando aquele id
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const meData = await api.get('/api/me')
      setMe(meData)
      if (meData?.is_admin) {
        const data = await api.get('/api/groups')
        setGroups(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(EMPTY_FORM)
    setFormError('')
    setEditing('new')
  }

  function openEdit(g) {
    setForm({
      name: g.name || '',
      youtube_key: '',
      transition_seconds: g.transition_seconds ?? 5,
      enabled: !!g.enabled,
    })
    setFormError('')
    setEditing(g.id)
  }

  function closeForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  async function save() {
    if (!form.name.trim()) {
      setFormError('O nome é obrigatório.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const body = {
        name: form.name.trim(),
        transition_seconds: Number(form.transition_seconds) || 5,
      }
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

  const inputClass =
    'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none'

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-lg border-2 border-blue-500 bg-slate-700 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-white">Grupos</h1>
            <button
              onClick={() => navigate('/painel')}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500"
            >
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
                  <button
                    onClick={openNew}
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
                  >
                    Novo grupo
                  </button>
                )}
              </div>

              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

              {editing !== null && (
                <div className="mt-4 rounded-lg border border-blue-500 bg-slate-800 p-4">
                  <h2 className="font-semibold text-white">
                    {editing === 'new' ? 'Novo grupo' : 'Editar grupo'}
                  </h2>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Nome</label>
                      <input
                        className={inputClass}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex.: Grupo Centro"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">
                        YouTube key{editing !== 'new' ? ' (deixe em branco para manter a atual)' : ''}
                      </label>
                      <input
                        className={inputClass}
                        value={form.youtube_key}
                        onChange={(e) => setForm({ ...form, youtube_key: e.target.value })}
                        placeholder={editing === 'new' ? 'opcional' : '••••••••'}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Transição (segundos)</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={form.transition_seconds}
                        onChange={(e) => setForm({ ...form, transition_seconds: e.target.value })}
                      />
                    </div>
                    {editing !== 'new' && (
                      <label className="flex items-center gap-2 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          className="accent-blue-500"
                          checked={form.enabled}
                          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                        />
                        Habilitado
                      </label>
                    )}
                  </div>
                  {formError && <p className="mt-3 text-sm text-red-300">{formError}</p>}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Salvando…' : 'Salvar'}
                    </button>
                    <button
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:border-blue-500 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {groups.map((g) => (
                  <div key={g.id} className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-white">
                          {g.name || '(sem nome)'}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {g.relay_active ? (
                            <span className="rounded bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">No ar</span>
                          ) : (
                            <span className="rounded bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-200">Parado</span>
                          )}
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              g.enabled ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200'
                            }`}
                          >
                            {g.enabled ? 'Habilitado' : 'Desabilitado'}
                          </span>
                          {!g.youtube_key && (
                            <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">Sem YouTube key</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right text-xs text-slate-400">
                          <div>transição: {g.transition_seconds}s</div>
                          <div>{g.cameras?.length ?? 0} câmera(s)</div>
                        </div>
                        <button
                          onClick={() => openEdit(g)}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:border-blue-500"
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    {g.cameras?.length > 0 && (
                      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3">
                        {g.cameras.map((c, i) => (
                          <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-slate-200">
                              {i + 1}. {c.camera_name || c.camera_id}
                            </span>
                            <span className="shrink-0 text-slate-400">{c.duration_seconds}s</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {groups.length === 0 && !error && (
                  <p className="text-slate-400">Nenhum grupo cadastrado.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
