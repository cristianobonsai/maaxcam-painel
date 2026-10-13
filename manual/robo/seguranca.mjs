// seguranca.mjs - regras de seguranca do robo do Manual (spec 2026-10-12, secoes 3 e 7).
// O robo so roda em localhost, intercepta TODA requisicao do navegador e varre os dados em busca de qualquer coisa real.

export const HOSTS_ESTATICOS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com']
const HOSTS_LOCAIS = ['localhost', '127.0.0.1', '[::1]']
const EMAILS_FICTICIOS = ['exemplo.com', 'example.com']

export function exigirLocalhost(urlBase) {
  const host = new URL(urlBase).hostname
  if (!HOSTS_LOCAIS.includes(host)) {
    throw new Error(`O robô só roda em localhost (recebido: ${host}).`)
  }
}

/**
 * Decide o que fazer com cada requisicao do navegador:
 * 'app' (o painel local), 'mock' (respondida por dados ficticios), 'estatico' (fontes/mapa, so GET) ou 'abortar'.
 * ctx: {appOrigin, apiHost, playHost, authHost}
 */
export function decidirRequisicao(url, metodo, ctx) {
  const u = new URL(url)
  if (['data:', 'blob:', 'about:'].includes(u.protocol)) return 'app'
  if (u.origin === ctx.appOrigin) return 'app'
  if (u.hostname === ctx.apiHost || u.hostname === ctx.playHost) return 'mock'
  if (u.hostname === ctx.authHost) {
    return metodo === 'POST' && u.pathname === '/auth/v1/otp' ? 'mock' : 'abortar'
  }
  if (HOSTS_ESTATICOS.includes(u.hostname) && metodo === 'GET') return 'estatico'
  return 'abortar'
}

/** Procura dado real/proibido em um texto. Devolve a lista de violacoes (vazia = limpo). */
export function varrerTexto(texto) {
  const violacoes = []
  for (const m of texto.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) {
    if (!EMAILS_FICTICIOS.includes(m[1].toLowerCase())) violacoes.push(`e-mail real: ${m[0]}`)
  }
  for (const m of texto.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) {
    if (!m[0].startsWith('203.0.113.')) violacoes.push(`IP: ${m[0]}`)
  }
  if (/sb_(publishable|secret)/i.test(texto)) violacoes.push('chave do supabase')
  for (const m of texto.matchAll(/\b(placas?|a?lpr|carbigdata)\b/gi)) violacoes.push(`palavra proibida: ${m[0]}`)
  return violacoes
}
