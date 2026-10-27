import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

// Áudio por link ao vivo (rádio online, fonia) para a transmissão do YouTube de uma câmera ou de um grupo.
// Usa as rotas /api/{cameras|groups}/{id}/audio-link e /api/audio-link/test. O endereço só volta mascarado.
// Se a API ainda não tem a rota (404), o bloco inteiro some: o painel pode subir antes do backend.

function horaBrasilia(epochSeconds) {
  if (!epochSeconds) return ''
  try {
    return new Date(epochSeconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  } catch {
    return ''
  }
}

function Selo({ info }) {
  if (!info?.has_link) return null
  if (info.state === 'no_ar') {
    return <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Link no ar</span>
  }
  if (info.state === 'fora') {
    const desde = horaBrasilia(info.since)
    return <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">Link fora do ar{desde ? ` desde ${desde}` : ''}</span>
  }
  return <span className="rounded-full bg-slate-600/40 px-2.5 py-0.5 text-xs font-medium text-slate-300">Estado indisponível</span>
}

export default function AudioLinkPanel({ kind, id, running = false, onSaved }) {
  const base = `/api/${kind === 'camera' ? 'cameras' : 'groups'}/${id}/audio-link`
  const [info, setInfo] = useState(null)
  const [indisponivel, setIndisponivel] = useState(false)
  const [editando, setEditando] = useState(false)
  const [url, setUrl] = useState('')
  const [fallback, setFallback] = useState('silencio')
  const [busy, setBusy] = useState(false)
  const [teste, setTeste] = useState(null)
  const [msg, setMsg] = useState(null)
  const [erroCarga, setErroCarga] = useState('')
  const vivo = useRef(true)

  const carregar = useCallback(async () => {
    try {
      const d = await api.get(base)
      if (vivo.current) { setInfo(d); setErroCarga('') }
    } catch (e) {
      if (!vivo.current) return
      if (e.status === 404) setIndisponivel(true)
      else setErroCarga(e.message || 'Não consegui carregar o áudio por link.')
    }
  }, [base])

  useEffect(() => {
    vivo.current = true
    setInfo(null); setIndisponivel(false); setEditando(false); setTeste(null); setMsg(null)
    carregar()
    return () => { vivo.current = false }
  }, [carregar])

  useEffect(() => {
    if (!info?.has_link) return undefined
    const t = setInterval(carregar, 15000)   // atualiza o selo sozinho, sem recarregar a tela
    return () => clearInterval(t)
  }, [info?.has_link, carregar])

  if (indisponivel) return null

  function abrir() {
    setUrl('')
    setFallback(info?.fallback || 'silencio')
    setTeste(null)
    setMsg(null)
    setEditando(true)
  }

  async function testar() {
    setBusy(true); setTeste(null)
    try {
      const r = await api.post('/api/audio-link/test', { url })
      setTeste(r)
    } catch (e) {
      setTeste({ ok: false, mensagem: e.message })
    } finally { setBusy(false) }
  }

  async function salvar() {
    setBusy(true); setMsg(null)
    try {
      const body = kind === 'camera' ? { url, fallback } : { url }
      const d = await api.put(base, body)
      setInfo(d)
      setEditando(false)
      if (kind === 'camera' && running) {
        setMsg({ tipo: 'aviso', texto: 'Link salvo. A transmissão reinicia por cerca de 1 minuto para aplicar.' })
      } else if (kind === 'group' && running) {
        setMsg({ tipo: 'aviso', texto: 'Link salvo. Com o grupo no ar, ele só entra quando o grupo reinicia (use “Aplicar áudio agora”).' })
      } else {
        setMsg({ tipo: 'ok', texto: 'Link salvo. Ele passa a valer quando a transmissão começar.' })
      }
      if (onSaved) onSaved()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message })
    } finally { setBusy(false) }
  }

  async function remover() {
    const aviso = running
      ? (kind === 'camera' ? ' Com a câmera no ar, a transmissão reinicia por cerca de 1 minuto.' : ' Com o grupo no ar, vale quando o grupo reiniciar.')
      : ''
    if (!window.confirm('Remover o link de áudio ao vivo? A transmissão volta a usar o áudio gravado ou o da câmera.' + aviso)) return
    setBusy(true); setMsg(null)
    try {
      const d = await api.del(base)
      setInfo(d)
      setMsg({ tipo: 'ok', texto: kind === 'group' && running ? 'Link removido. Vale quando o grupo reiniciar.' : 'Link removido.' })
      if (onSaved) onSaved()
    } catch (e) {
      setMsg({ tipo: 'erro', texto: e.message })
    } finally { setBusy(false) }
  }

  const cor = { ok: 'text-emerald-300', aviso: 'text-amber-300', erro: 'text-red-300' }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-2" data-testid="audio-link">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-400">Áudio ao vivo por link</div>
        <Selo info={info} />
      </div>

      {info?.has_link && !editando && (
        <div className="space-y-1">
          <div className="break-all rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-200">{info.url_masked}</div>
          {kind === 'camera' && (
            <p className="text-xs text-slate-500">Quando o link cair: {info.fallback === 'camera' ? 'usa o áudio da câmera' : 'fica em silêncio'}.</p>
          )}
          {info.state === 'indisponivel' && (
            <p className="text-xs text-slate-500">O link é conectado quando a transmissão está no ar.</p>
          )}
          <p className="text-xs text-slate-500">O link tem prioridade sobre o áudio gravado e sobre o áudio da câmera.</p>
          <div className="flex gap-3 pt-1">
            <button onClick={abrir} disabled={busy} className="text-xs text-blue-300 hover:text-blue-200">Trocar link</button>
            <button onClick={remover} disabled={busy} className="text-xs text-red-400 hover:text-red-300">Remover link</button>
          </div>
        </div>
      )}

      {erroCarga && !info && (
        <p className="text-xs text-red-300" data-testid="audio-link-erro">
          {erroCarga}{' '}
          <button onClick={carregar} className="underline text-red-200 hover:text-white">Tentar de novo</button>
        </p>
      )}

      {info && !info.has_link && !editando && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Toque uma rádio online ou uma fonia ao vivo no lugar do áudio gravado.</p>
          <button onClick={abrir} disabled={!info || busy}
            className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:border-blue-500 disabled:opacity-50">
            Usar link ao vivo
          </button>
        </div>
      )}

      {editando && (
        <div className="space-y-2">
          <label className="block text-xs text-slate-400">
            Cole o endereço do áudio ao vivo (rádio online ou fonia), começando com http:// ou https://
            <input type="url" value={url} onChange={(e) => { setUrl(e.target.value); setTeste(null) }} disabled={busy}
              placeholder="https://radio.exemplo.com:8000/ao-vivo" autoComplete="off" spellCheck={false}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
          </label>
          {kind === 'camera' && (
            <label className="block text-xs text-slate-400">
              Quando o link cair
              <select value={fallback} onChange={(e) => setFallback(e.target.value)} disabled={busy}
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                <option value="silencio">Ficar em silêncio</option>
                <option value="camera">Usar o áudio da câmera</option>
              </select>
            </label>
          )}
          {teste && (
            <p className={`text-xs ${teste.ok ? 'text-emerald-300' : 'text-red-300'}`} data-testid="audio-link-teste">
              {teste.mensagem || (teste.ok ? 'O link respondeu com áudio.' : 'Não consegui usar esse endereço.')}
              {teste.ok && teste.codec ? ` (${teste.codec}${teste.kbps ? `, ${teste.kbps} kbps` : ''})` : ''}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={testar} disabled={busy || !url.trim()}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-blue-500 disabled:opacity-50">
              Testar link
            </button>
            <button onClick={salvar} disabled={busy || !url.trim()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              Salvar
            </button>
            <button onClick={() => setEditando(false)} disabled={busy} className="px-2 text-xs text-slate-400 hover:text-slate-200">Cancelar</button>
          </div>
          {kind === 'camera' && running && <p className="text-xs text-amber-300">Com a câmera no ar, a transmissão reinicia por cerca de 1 minuto ao salvar.</p>}
        </div>
      )}

      {msg && <p className={`text-xs ${cor[msg.tipo]}`} data-testid="audio-link-msg">{msg.texto}</p>}
    </div>
  )
}
