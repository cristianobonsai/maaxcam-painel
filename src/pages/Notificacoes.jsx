import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'

const DELAY_OPTIONS = [1, 3, 5, 10, 30]

const DEFAULTS = {
  enabled: true,
  notify_on_return: true,
  daily_summary: false,
  daily_time: '08:00',
  off_delay_minutes: 3,
  quiet_hours_enabled: false,
  quiet_start: '22:00',
  quiet_end: '07:00',
}

export default function Notificacoes() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [banner, setBanner] = useState(null)
  const [conn, setConn] = useState({ connected: false, chat_id: '', bot_username: '' })
  const [link, setLink] = useState(null)
  const [s, setS] = useState(DEFAULTS)

  async function load() {
    setLoading(true)
    try {
      const [base, extra] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/extra'),
      ])
      setConn({
        connected: !!extra?.connected,
        chat_id: extra?.chat_id || '',
        bot_username: extra?.bot_username || '',
      })
      setS((prev) => ({ ...prev, ...base, ...extra }))
    } catch (e) {
      setBanner({ type: 'err', text: e instanceof ApiError ? e.message : 'Erro ao carregar.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const set = (patch) => setS((p) => ({ ...p, ...patch }))

  async function handleSave() {
    setSaving(true)
    setBanner(null)
    try {
      await Promise.all([
        api.put('/api/notifications', {
          enabled: s.enabled,
          notify_on_return: s.notify_on_return,
          daily_summary: s.daily_summary,
          daily_time: s.daily_time,
          off_delay_minutes: Number(s.off_delay_minutes) || 0,
        }),
        api.put('/api/notifications/extra', {
          quiet_hours_enabled: s.quiet_hours_enabled,
          quiet_start: s.quiet_start,
          quiet_end: s.quiet_end,
        }),
      ])
      setBanner({ type: 'ok', text: 'Configurações salvas.' })
    } catch (e) {
      setBanner({ type: 'err', text: e instanceof ApiError ? e.message : 'Falha ao salvar.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setBanner(null)
    try {
      await api.post('/api/notifications/test')
      setBanner({ type: 'ok', text: 'Mensagem de teste enviada — confira seu Telegram.' })
    } catch (e) {
      setBanner({ type: 'err', text: e instanceof ApiError ? e.message : 'Não foi possível enviar.' })
    } finally {
      setTesting(false)
    }
  }

  async function handleDisconnect() {
    setBanner(null)
    try {
      await api.post('/api/notifications/disconnect')
      setConn({ connected: false, chat_id: '', bot_username: '' })
      setLink(null)
      setBanner({ type: 'warn', text: 'Telegram desconectado.' })
    } catch (e) {
      setBanner({ type: 'err', text: e instanceof ApiError ? e.message : 'Falha ao desconectar.' })
    }
  }

  async function handleConnect() {
    setConnecting(true)
    setBanner(null)
    try {
      const r = await api.get('/api/notifications/telegram/link')
      setLink(r)
    } catch (e) {
      setBanner({ type: 'err', text: e instanceof ApiError ? e.message : 'Falha ao gerar o link.' })
    } finally {
      setConnecting(false)
    }
  }

  const bannerStyle = {
    ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    err: 'border-red-500/40 bg-red-500/10 text-red-300',
  }

  return (
    <>
      <div className="bg-atmosphere" />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <button
          onClick={() => navigate('/painel')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <Icon path="M15 18l-6-6 6-6" className="h-4 w-4" /> Voltar ao painel
        </button>

        <h1 className="font-display text-3xl font-bold text-white">Notificações</h1>
        <p className="mt-1.5 text-slate-400">
          Configure como e onde você quer ser alertado sobre eventos das suas câmeras.
        </p>

        {banner && (
          <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${bannerStyle[banner.type]}`}>
            {banner.text}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-slate-400">Carregando…</p>
        ) : (
          <>
            <section className="mt-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="flex items-center gap-2.5 font-display text-lg font-semibold text-white">
                  <Icon path="M22 3 2 11l6 2 2 6 3-4 5 4 4-16Z" className="h-6 w-6 text-[#229ED9]" />
                  Telegram
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    conn.connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${conn.connected ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  {conn.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {conn.connected ? (
                <>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#229ED9]">
                        <Icon path="M22 3 2 11l6 2 2 6 3-4 5 4 4-16Z" className="h-6 w-6 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">Bot conectado com sucesso</p>
                        <p className="text-sm text-slate-400">@{conn.bot_username || 'MaaxCam'}</p>
                        {conn.chat_id && <p className="text-sm text-slate-400">Chat ID: {conn.chat_id}</p>}
                      </div>
                      <button
                        onClick={handleDisconnect}
                        className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
                      >
                        Desconectar
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">
                      <Icon path="M20 6 9 17l-5-5" className="h-5 w-5 shrink-0" />
                      Notificações ativas. Você receberá mensagens diretamente no seu Telegram.
                    </div>
                  </div>
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white hover:border-blue-500 disabled:opacity-50"
                  >
                    <Icon path="M22 3 2 11l6 2 2 6 3-4 5 4 4-16Z" className="h-4 w-4" />
                    {testing ? 'Enviando…' : 'Enviar mensagem de teste'}
                  </button>
                </>
              ) : !link ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-slate-400">Conecte o bot para começar a receber alertas.</p>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {connecting ? 'Gerando…' : 'Conectar Telegram'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Abra o link abaixo no Telegram e toque em <b>Iniciar</b> (Start):
                  </p>
                  <a
                    href={link.deep_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                  >
                    <Icon path="M22 3 2 11l6 2 2 6 3-4 5 4 4-16Z" className="h-4 w-4" />
                    Abrir no Telegram
                  </a>
                  {link.link_code && (
                    <p className="text-xs text-slate-500">
                      Ou envie esta mensagem ao bot:{' '}
                      <code className="text-slate-300">/conectar {link.link_code}</code>
                    </p>
                  )}
                  <div>
                    <button onClick={load} className="text-sm text-blue-400 hover:text-blue-300">
                      Já conectei — atualizar
                    </button>
                  </div>
                </div>
              )}
            </section>

            <h2 className="mt-7 font-display text-xl font-bold text-white">Tipos de Alerta</h2>
            <p className="mb-3 mt-1 text-sm text-slate-400">
              Escolha quais eventos devem gerar uma notificação no Telegram.
            </p>
            <section className="divide-y divide-slate-700 rounded-xl border border-slate-700 bg-slate-800/60">
              <AlertRow
                tone="red" iconPath="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4.2-6.2a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M5 5a10 10 0 0 0 0 14M19 19a10 10 0 0 0 0-14"
                title="Câmera Offline" desc="Quando uma câmera parar de transmitir"
                checked={s.enabled} onChange={(v) => set({ enabled: v })}
              />
              <AlertRow
                tone="emerald" iconPath="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4.2-6.2a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M5 5a10 10 0 0 0 0 14M19 19a10 10 0 0 0 0-14"
                title="Câmera Restaurada" desc="Quando uma câmera voltar a transmitir após uma queda"
                checked={s.notify_on_return} onChange={(v) => set({ notify_on_return: v })}
              />
              <AlertRow
                tone="amber" iconPath="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01"
                title="Bitrate Crítico" desc="Em breve — depende de coleta de bitrate por câmera"
                checked={false} disabled onChange={() => {}}
              />
              <AlertRow
                tone="blue" iconPath="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2"
                title="Resumo Diário" desc="Relatório diário de uptime de todas as câmeras"
                checked={s.daily_summary} onChange={(v) => set({ daily_summary: v })}
              />
            </section>

            <h2 className="mt-7 font-display text-xl font-bold text-white">Configurações Avançadas</h2>
            <section className="mt-3 divide-y divide-slate-700 rounded-xl border border-slate-700 bg-slate-800/60">
              <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <p className="font-medium text-white">Tempo mínimo entre alertas</p>
                  <p className="text-sm text-slate-400">Evita spam de notificações quando a câmera oscila</p>
                </div>
                <select
                  value={s.off_delay_minutes}
                  onChange={(e) => set({ off_delay_minutes: Number(e.target.value) })}
                  className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {DELAY_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m} {m === 1 ? 'minuto' : 'minutos'}</option>
                  ))}
                </select>
              </div>

              <div className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-white">Horário de silêncio</p>
                    <p className="text-sm text-slate-400">Não enviar notificações durante este período</p>
                  </div>
                  <Toggle checked={s.quiet_hours_enabled} onChange={(v) => set({ quiet_hours_enabled: v })} />
                </div>
                {s.quiet_hours_enabled && (
                  <div className="mt-4 flex items-center gap-3">
                    <input type="time" value={s.quiet_start} onChange={(e) => set({ quiet_start: e.target.value })}
                      className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                    <span className="text-slate-400">até</span>
                    <input type="time" value={s.quiet_end} onChange={(e) => set({ quiet_end: e.target.value })}
                      className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                  </div>
                )}
              </div>

              {s.daily_summary && (
                <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-white">Horário do resumo diário</p>
                    <p className="text-sm text-slate-400">A que horas enviar o panorama do dia</p>
                  </div>
                  <input type="time" value={s.daily_time} onChange={(e) => set({ daily_time: e.target.value })}
                    className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
              )}
            </section>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-3 font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              <Icon path="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8" className="h-5 w-5" />
              {saving ? 'Salvando…' : 'Salvar Configurações'}
            </button>
          </>
        )}
      </main>
    </>
  )
}

function Icon({ path, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function AlertRow({ tone, iconPath, title, desc, checked, onChange, disabled }) {
  const tones = {
    red: 'bg-red-500/15 text-red-400',
    emerald: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    blue: 'bg-blue-500/15 text-blue-400',
  }
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon path={iconPath} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${disabled ? 'text-slate-400' : 'text-white'}`}>{title}</p>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}
