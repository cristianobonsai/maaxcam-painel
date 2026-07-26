import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../lib/api'

// Aba "Grupos de acesso" (padrão mestre-detalhe).
// vista = 'lista' | 'grupo' | 'fino' | 'resumo'
export default function GruposAcesso({ members }) {
  const [groups, setGroups] = useState([])
  const [cameras, setCameras] = useState([])
  const [avulsas, setAvulsas] = useState({})   // { user_id: [camera_id,...] }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [vista, setVista] = useState('lista')
  const [grupoAtivo, setGrupoAtivo] = useState(null)
  const [novoNome, setNovoNome] = useState('')
  const [criando, setCriando] = useState(false)

  async function carregar() {
    setError('')
    try {
      const [gs, cams] = await Promise.all([
        api.get('/api/access-groups'),
        api.get('/api/cameras?mine=1'),
      ])
      setGroups(Array.isArray(gs) ? gs : [])
      const lista = Array.isArray(cams) ? cams : []
      lista.sort((a, b) => (a.name || a.camera_id).localeCompare(b.name || b.camera_id, 'pt-BR'))
      setCameras(lista)
      const av = {}
      await Promise.all((members || []).map(async (m) => {
        try {
          const r = await api.get(`/api/account/members/${m.user_id}/cameras`)
          av[m.user_id] = r?.camera_ids || []
        } catch { av[m.user_id] = [] }
      }))
      setAvulsas(av)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar grupos de acesso.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])  // eslint-disable-line

  async function criarGrupo() {
    const nome = novoNome.trim()
    if (!nome) return
    setCriando(true); setError('')
    try {
      const r = await api.post('/api/access-groups', { name: nome })
      setNovoNome('')
      await carregar()
      // abre direto o grupo recém-criado pra já configurar
      if (r?.id) { setGrupoAtivo(r.id); setVista('grupo') }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível criar o grupo.')
    } finally {
      setCriando(false)
    }
  }

  const nomeCamera = (cid) => {
    const c = cameras.find((x) => x.camera_id === cid)
    return c ? (c.name || c.camera_id) : cid
  }

  const resumo = useMemo(() => {
    const map = {}
    for (const m of (members || [])) {
      const set = new Set(avulsas[m.user_id] || [])
      for (const g of groups) {
        if ((g.member_ids || []).includes(m.user_id)) {
          for (const cid of (g.camera_ids || [])) set.add(cid)
        }
      }
      map[m.user_id] = [...set].map(nomeCamera).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    }
    return map
  }, [members, groups, avulsas, cameras])

  if (loading) return <p className="mt-4 text-sm text-slate-400">Carregando…</p>

  const grupo = groups.find((g) => g.id === grupoAtivo)

  // ---------- VISTA: edição de um grupo ----------
  if (vista === 'grupo' && grupo) {
    return <EditarGrupo grupo={grupo} cameras={cameras} members={members}
      onVoltar={() => { setVista('lista'); setGrupoAtivo(null) }}
      onChanged={carregar} onError={setError} error={error} />
  }

  // ---------- VISTA: ajuste fino ----------
  if (vista === 'fino') {
    return <AjusteFino members={members} cameras={cameras} avulsas={avulsas}
      onVoltar={() => setVista('lista')} onChanged={carregar} onError={setError} error={error} />
  }

  // ---------- VISTA: resumo ----------
  if (vista === 'resumo') {
    return (
      <div className="mt-4">
        <button onClick={() => setVista('lista')} className="mb-3 text-sm text-blue-400 hover:text-blue-300">‹ Voltar</button>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">O que cada convidado enxerga</p>
        <div className="mt-2 flex flex-col gap-2">
          {(members || []).length === 0 && <p className="text-sm text-slate-500">Nenhum convidado.</p>}
          {(members || []).map((m) => (
            <div key={m.user_id} className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-3">
              <p className="text-sm font-medium text-slate-200">{m.email}</p>
              {resumo[m.user_id]?.length ? (
                <p className="mt-1 text-xs text-slate-400">{resumo[m.user_id].join(' · ')}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Nenhuma câmera liberada ainda.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------- VISTA: lista (inicial) ----------
  return (
    <div className="mt-4">
      <p className="text-sm text-slate-400">
        Monte grupos de câmeras e escolha quem vê cada um. Um convidado enxerga a soma dos grupos dele + liberações individuais.
      </p>

      {error && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {(members || []).length === 0 && (
        <p className="mt-4 rounded-lg border border-amber-700/50 bg-amber-500/5 px-4 py-3 text-sm text-slate-300">
          Você ainda não tem convidados. Convide alguém na aba "Usuários" antes de montar grupos de acesso.
        </p>
      )}

      {/* criar grupo */}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') criarGrupo() }}
          placeholder="Nome do novo grupo (ex.: Obra Zona Sul)"
          className="min-w-[240px] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button onClick={criarGrupo} disabled={criando}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
          {criando ? 'Criando…' : 'Criar grupo'}
        </button>
      </div>

      {/* atalhos */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setVista('fino')}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500">
          Ajuste fino por convidado
        </button>
        <button onClick={() => setVista('resumo')}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500">
          Resumo de acessos
        </button>
      </div>

      {/* lista de grupos */}
      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Grupos de acesso</p>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum grupo ainda. Crie o primeiro acima.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {groups.map((g) => (
            <button key={g.id} onClick={() => { setGrupoAtivo(g.id); setVista('grupo') }}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-left hover:border-blue-500">
              <div>
                <div className="text-sm font-medium text-white">{g.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {(g.camera_ids || []).length} {(g.camera_ids || []).length === 1 ? 'câmera' : 'câmeras'}
                  {' · '}
                  {(g.member_ids || []).length} {(g.member_ids || []).length === 1 ? 'pessoa' : 'pessoas'}
                </div>
              </div>
              <span className="text-sm text-blue-400">Editar ›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ edição de um grupo ============
function EditarGrupo({ grupo, cameras, members, onVoltar, onChanged, onError, error }) {
  const [selCams, setSelCams] = useState(new Set(grupo.camera_ids || []))
  const [selMems, setSelMems] = useState(new Set(grupo.member_ids || []))
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const camsFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? cameras.filter((c) => (c.name || c.camera_id).toLowerCase().includes(q)) : cameras
  }, [cameras, busca])

  function toggleCam(cid) {
    setSelCams((s) => { const n = new Set(s); n.has(cid) ? n.delete(cid) : n.add(cid); return n }); setSaved(false)
  }
  function toggleMem(uid) {
    setSelMems((s) => { const n = new Set(s); n.has(uid) ? n.delete(uid) : n.add(uid); return n }); setSaved(false)
  }

  async function salvar() {
    setSaving(true); onError('')
    try {
      await api.put(`/api/access-groups/${grupo.id}/cameras`, { camera_ids: [...selCams] })
      await api.put(`/api/access-groups/${grupo.id}/members`, { user_ids: [...selMems] })
      setSaved(true)
      onChanged()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível salvar o grupo.')
    } finally {
      setSaving(false)
    }
  }

  async function excluir() {
    onError('')
    try {
      await api.del(`/api/access-groups/${grupo.id}`)
      onChanged(); onVoltar()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível excluir.')
    }
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="text-sm text-blue-400 hover:text-blue-300">‹ Voltar</button>
          <span className="text-base font-semibold text-white">{grupo.name}</span>
        </div>
        {!confirmDel ? (
          <button onClick={() => setConfirmDel(true)}
            className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">Excluir grupo</button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Excluir?</span>
            <button onClick={excluir} className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500">Sim</button>
            <button onClick={() => setConfirmDel(false)} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50">Não</button>
          </div>
        )}
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        {/* câmeras */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Câmeras deste grupo</p>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar câmera…"
          className="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-slate-700/60">
          {camsFiltradas.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">Nenhuma câmera encontrada.</p>
          ) : camsFiltradas.map((c) => (
            <label key={c.camera_id} className="flex cursor-pointer items-center gap-2 border-b border-slate-800 px-3 py-2 text-sm text-slate-300 last:border-0 hover:bg-slate-800/40">
              <input type="checkbox" checked={selCams.has(c.camera_id)} onChange={() => toggleCam(c.camera_id)} className="h-4 w-4 accent-blue-500" />
              {c.name || c.camera_id}
            </label>
          ))}
        </div>

        {/* membros */}
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Quem vê este grupo</p>
        <p className="mb-2 text-xs text-amber-300/90">✓ Marque a caixa de cada pessoa que deve ver estas câmeras. Sem ninguém marcado, o grupo não libera acesso.</p>
        {(members || []).length === 0 ? (
          <p className="mb-4 text-xs text-slate-500">Nenhum convidado disponível.</p>
        ) : (
          <div className="mb-4 flex flex-wrap gap-2">
            {(members || []).map((m) => (
              <label key={m.user_id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:border-blue-500 ${selMems.has(m.user_id) ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'}`}>
                <input type="checkbox" checked={selMems.has(m.user_id)} onChange={() => toggleMem(m.user_id)} className="h-4 w-4 accent-blue-500" />
                {m.email}
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={salvar} disabled={saving}
            className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
            {saving ? 'Salvando…' : 'Salvar grupo'}
          </button>
          {saved && <span className="text-xs text-emerald-300">✓ Salvo</span>}
        </div>
      </div>
    </div>
  )
}

// ============ ajuste fino ============
function AjusteFino({ members, cameras, avulsas, onVoltar, onChanged, onError, error }) {
  const [sel, setSel] = useState(members?.[0]?.user_id || '')
  const [selCams, setSelCams] = useState(new Set())
  const [busca, setBusca] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSelCams(new Set(avulsas[sel] || [])); setSaved(false) }, [sel, avulsas])

  const camsFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? cameras.filter((c) => (c.name || c.camera_id).toLowerCase().includes(q)) : cameras
  }, [cameras, busca])

  function toggleCam(cid) {
    setSelCams((s) => { const n = new Set(s); n.has(cid) ? n.delete(cid) : n.add(cid); return n }); setSaved(false)
  }

  async function salvar() {
    setSaving(true); onError('')
    try {
      await api.put(`/api/account/members/${sel}/cameras`, { camera_ids: [...selCams] })
      setSaved(true); onChanged()
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Não foi possível salvar as liberações.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4">
      <button onClick={onVoltar} className="mb-3 text-sm text-blue-400 hover:text-blue-300">‹ Voltar</button>
      <p className="text-sm font-medium text-white">Ajuste fino por convidado</p>
      <p className="mt-0.5 text-xs text-slate-400">Libere câmeras avulsas direto para uma pessoa, além dos grupos.</p>

      {error && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        <select value={sel} onChange={(e) => setSel(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none sm:w-auto">
          {(members || []).map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
        </select>

        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar câmera…"
          className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-700/60">
          {camsFiltradas.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">Nenhuma câmera encontrada.</p>
          ) : camsFiltradas.map((c) => (
            <label key={c.camera_id} className="flex cursor-pointer items-center gap-2 border-b border-slate-800 px-3 py-2 text-sm text-slate-300 last:border-0 hover:bg-slate-800/40">
              <input type="checkbox" checked={selCams.has(c.camera_id)} onChange={() => toggleCam(c.camera_id)} className="h-4 w-4 accent-blue-500" />
              {c.name || c.camera_id}
            </label>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={salvar} disabled={saving}
            className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-60">
            {saving ? 'Salvando…' : 'Salvar liberações'}
          </button>
          {saved && <span className="text-xs text-emerald-300">✓ Salvo</span>}
        </div>
      </div>
    </div>
  )
}
