import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'

// Aba "Convidados" dentro de Notificacoes.
// Dono escolhe quais convidados recebem alerta de camera (queda/retorno),
// por quais canais (email/telegram) e de quais cameras (grupos de acesso e/ou avulsas).
// Listas de grupos/cameras tem busca + cap de exibicao (aguenta centenas de cameras).
// Atalho por grupo: aplica de uma vez aos membros atuais de um grupo de acesso.
export default function NotifConvidados() {
  const [guests, setGuests] = useState([])
  const [groups, setGroups] = useState([])
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notOwner, setNotOwner] = useState(false)

  async function carregar() {
    setError('')
    try {
      const [g, gs, cams] = await Promise.all([
        api.get('/api/notifications/guests'),
        api.get('/api/access-groups'),
        api.get('/api/cameras?mine=1'),
      ])
      setGuests(Array.isArray(g?.guests) ? g.guests : [])
      setGroups(Array.isArray(gs) ? gs : [])
      const lista = Array.isArray(cams) ? cams : []
      lista.sort((a, b) => (a.name || a.camera_id).localeCompare(b.name || b.camera_id, 'pt-BR'))
      setCameras(lista)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) setNotOwner(true)
      else setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { carregar() }, [])  // eslint-disable-line

  if (loading) return <p className="mt-6 text-slate-400">Carregando…</p>
  if (notOwner) return (
    <p className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
      Apenas o dono da conta pode configurar notificações de convidados.
    </p>
  )

  return (
    <div className="mt-6">
      <p className="text-sm text-slate-400">
        Escolha quais convidados recebem alertas de câmera (queda e retorno) e por quais canais.
      </p>
      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <AtalhoGrupo groups={groups} guests={guests} onApplied={carregar} onError={setError} />

      <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">Convidados</p>
      {guests.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum convidado ainda. Convide pessoas na tela de Usuários.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3">
          {guests.map((g) => (
            <GuestCard key={g.user_id} guest={g} groups={groups} cameras={cameras} onError={setError} />
          ))}
        </div>
      )}
    </div>
  )
}

// Lista com busca (nome + codigo), contador, "so selecionadas" e cap de exibicao.
function PickList({ items, selected, onToggle, placeholder, emptyText, cap = 50 }) {
  const [q, setQ] = useState('')
  const [onlySel, setOnlySel] = useState(false)
  const query = q.trim().toLowerCase()

  const match = (it) =>
    !query ||
    (it.label || '').toLowerCase().includes(query) ||
    (it.code || '').toLowerCase().includes(query)

  const selItems = items.filter((it) => selected.has(String(it.id)))
  const selCount = selItems.length

  let shown = []
  let hiddenCount = 0
  if (onlySel) {
    shown = selItems.filter(match)
  } else {
    const sel = selItems.filter(match)
    const unsel = items.filter((it) => !selected.has(String(it.id)) && match(it))
    const capUnsel = unsel.slice(0, cap)
    hiddenCount = unsel.length - capUnsel.length
    shown = [...sel, ...capUnsel]
  }

  if (items.length === 0) return <p className="text-xs text-slate-500">{emptyText}</p>

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-[13px] text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <span className="shrink-0 text-[11px] text-slate-400">{selCount} selecionada{selCount === 1 ? '' : 's'}</span>
      </div>
      {selCount > 0 && (
        <label className="mb-1.5 flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-400">
          <input type="checkbox" checked={onlySel} onChange={() => setOnlySel((v) => !v)} className="h-3.5 w-3.5 accent-blue-500" />
          mostrar só as selecionadas
        </label>
      )}
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/40 p-2">
        {shown.length === 0 ? (
          <p className="px-1 py-2 text-xs text-slate-500">Nada encontrado.</p>
        ) : (
          shown.map((it) => (
            <label key={it.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[13px] text-slate-300 hover:bg-slate-800/60">
              <input type="checkbox" checked={selected.has(String(it.id))} onChange={() => onToggle(it.id)} className="h-4 w-4 shrink-0 accent-blue-500" />
              <span className="truncate">{it.label}</span>
              {it.code && it.code !== it.label && <span className="shrink-0 text-[11px] text-slate-500">{it.code}</span>}
            </label>
          ))
        )}
        {hiddenCount > 0 && (
          <p className="px-1 pt-1 text-[11px] text-slate-500">…e mais {hiddenCount}. Refine a busca para ver.</p>
        )}
      </div>
    </div>
  )
}

function GuestCard({ guest, groups, cameras, onError }) {
  const [enabled, setEnabled] = useState(!!guest.enabled)
  const [viaEmail, setViaEmail] = useState(!!guest.via_email)
  const [viaTelegram, setViaTelegram] = useState(!!guest.via_telegram)
  const [scopeGroups, setScopeGroups] = useState(
    new Set((guest.scope || []).filter((s) => s.type === 'group').map((s) => String(s.id)))
  )
  const [scopeCams, setScopeCams] = useState(
    new Set((guest.scope || []).filter((s) => s.type === 'camera').map((s) => String(s.id)))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleGroup(id) {
    setSaved(false)
    setScopeGroups((prev) => { const n = new Set(prev); const k = String(id); n.has(k) ? n.delete(k) : n.add(k); return n })
  }
  function toggleCam(id) {
    setSaved(false)
    setScopeCams((prev) => { const n = new Set(prev); const k = String(id); n.has(k) ? n.delete(k) : n.add(k); return n })
  }

  async function salvar() {
    setSaving(true); onError('')
    const scope = [
      ...[...scopeGroups].map((id) => ({ type: 'group', id })),
      ...[...scopeCams].map((id) => ({ type: 'camera', id })),
    ]
    try {
      await api.put(`/api/notifications/guests/${guest.user_id}`, {
        enabled, via_email: viaEmail, via_telegram: viaTelegram, scope,
      })
      setSaved(true)
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const groupItems = useMemo(() => groups.map((gr) => ({ id: gr.id, label: gr.name, code: null })), [groups])
  const cameraItems = useMemo(() => cameras.map((c) => ({ id: c.camera_id, label: c.name || c.camera_id, code: c.camera_id })), [cameras])
  const telegramWarn = viaTelegram && !guest.telegram_linked

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-500/15 text-xs font-semibold text-blue-400">
            {(guest.email || '?').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-white">{guest.email}</span>
        </div>
        <ToggleMini checked={enabled} onChange={(v) => { setEnabled(v); setSaved(false) }} />
      </div>

      {enabled && (
        <>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-700 pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
              <input type="checkbox" checked={viaEmail} onChange={() => { setViaEmail((v) => !v); setSaved(false) }} className="h-4 w-4 accent-blue-500" />
              Email
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
              <input type="checkbox" checked={viaTelegram} onChange={() => { setViaTelegram((v) => !v); setSaved(false) }} className="h-4 w-4 accent-blue-500" />
              Telegram
            </label>
          </div>
          {telegramWarn && (
            <p className="mt-2 rounded-lg border border-amber-700/50 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              Este convidado ainda não vinculou o Telegram — ele não receberá por Telegram até vincular (na conta dele, em Notificações).
            </p>
          )}

          <div className="mt-3 border-t border-slate-700 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Grupos de acesso</p>
            <PickList
              items={groupItems}
              selected={scopeGroups}
              onToggle={toggleGroup}
              placeholder="Buscar grupo…"
              emptyText="Nenhum grupo de acesso criado."
            />
          </div>

          <div className="mt-3 border-t border-slate-700 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Câmeras avulsas</p>
            <PickList
              items={cameraItems}
              selected={scopeCams}
              onToggle={toggleCam}
              placeholder="Buscar por nome ou código…"
              emptyText="Nenhuma câmera."
            />
          </div>
        </>
      )}

      <div className="mt-3 flex items-center gap-3 border-t border-slate-700 pt-3">
        <button onClick={salvar} disabled={saving}
          className="rounded-lg bg-slate-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-600 disabled:opacity-60">
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
        {saved && <span className="text-xs text-emerald-300">✓ Salvo</span>}
      </div>
    </div>
  )
}

function AtalhoGrupo({ groups, guests, onApplied, onError }) {
  const [groupId, setGroupId] = useState('')
  const [viaEmail, setViaEmail] = useState(true)
  const [viaTelegram, setViaTelegram] = useState(true)
  const [applying, setApplying] = useState(false)
  const [msg, setMsg] = useState('')

  const group = useMemo(() => groups.find((g) => String(g.id) === String(groupId)), [groups, groupId])
  const guestById = useMemo(() => Object.fromEntries(guests.map((g) => [g.user_id, g])), [guests])
  const alvos = useMemo(() => (group?.member_ids || []).filter((id) => guestById[id]), [group, guestById])

  async function aplicar() {
    if (!group) return
    if (!viaEmail && !viaTelegram) { onError('Escolha ao menos um canal.'); return }
    setApplying(true); onError(''); setMsg('')
    try {
      for (const uid of alvos) {
        const g = guestById[uid] || {}
        const scopeSet = new Map()
        for (const s of (g.scope || [])) scopeSet.set(`${s.type}:${s.id}`, { type: s.type, id: String(s.id) })
        scopeSet.set(`group:${group.id}`, { type: 'group', id: String(group.id) })
        await api.put(`/api/notifications/guests/${uid}`, {
          enabled: true,
          via_email: !!g.via_email || viaEmail,
          via_telegram: !!g.via_telegram || viaTelegram,
          scope: [...scopeSet.values()],
        })
      }
      setMsg(`Aplicado a ${alvos.length} ${alvos.length === 1 ? 'membro' : 'membros'}.`)
      onApplied()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Falha ao aplicar.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <p className="text-sm font-medium text-white">Atalho por grupo</p>
      <p className="mt-1 text-xs text-slate-400">
        Aplica a notificação a todos os membros atuais de um grupo de acesso de uma vez (das câmeras do grupo). Membros adicionados depois precisam do atalho novamente.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select value={groupId} onChange={(e) => { setGroupId(e.target.value); setMsg('') }}
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
          <option value="">Escolha um grupo…</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
          <input type="checkbox" checked={viaEmail} onChange={() => setViaEmail((v) => !v)} className="h-4 w-4 accent-blue-500" /> Email
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-300">
          <input type="checkbox" checked={viaTelegram} onChange={() => setViaTelegram((v) => !v)} className="h-4 w-4 accent-blue-500" /> Telegram
        </label>
        <button onClick={aplicar} disabled={!group || applying || alvos.length === 0}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
          {applying ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {group && (
        <p className="mt-2 text-xs text-slate-400">
          {alvos.length === 0
            ? 'Este grupo não tem convidados como membros.'
            : `${alvos.length} ${alvos.length === 1 ? 'membro convidado' : 'membros convidados'} neste grupo.`}
        </p>
      )}
      {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}
    </div>
  )
}

function ToggleMini({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-600'}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}
