// localizar.mjs - acha elementos da tela com AUTOAJUSTE CONSERVADOR (spec 2026-10-12, 4.3):
// tenta o nome exato; depois alternativas explicitas; depois UM unico elemento de texto parecido (>= 0,7).
// Zero ou mais de um candidato => quebra (nunca adivinha). Todo ajuste vai ao relatorio.

export class ErroPassoQuebrado extends Error {
  constructor(capitulo, passo, motivo, alvo) {
    super(`Passo quebrado: ${capitulo}/${passo} — ${motivo === 'ambiguo' ? 'mais de um elemento parecido' : 'elemento não encontrado'} (${alvo})`)
    this.name = 'ErroPassoQuebrado'
    this.capitulo = capitulo
    this.passo = passo
    this.motivo = motivo
    this.alvo = alvo
  }
}

const normalizar = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function distancia(a, b) {
  const m = a.length, n = b.length
  let anterior = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const atual = [i]
    for (let j = 1; j <= n; j++) {
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    anterior = atual
  }
  return anterior[n]
}

export function similaridade(a, b) {
  const x = normalizar(a), y = normalizar(b)
  if (x === y) return 1
  const maior = Math.max(x.length, y.length)
  return maior === 0 ? 1 : 1 - distancia(x, y) / maior
}

export function escolherCandidato(alvo, textos, limiar = 0.7) {
  const exatos = textos.map((t, i) => (normalizar(t) === normalizar(alvo) ? i : -1)).filter((i) => i >= 0)
  if (exatos.length === 1) return { indice: exatos[0], motivo: 'exato', pontuacao: 1 }
  if (exatos.length > 1) return { indice: null, motivo: 'ambiguo', pontuacao: 1 }
  const parecidos = textos
    .map((t, i) => ({ i, p: similaridade(alvo, t) }))
    .filter((x) => x.p >= limiar)
  if (parecidos.length === 1) return { indice: parecidos[0].i, motivo: 'unico', pontuacao: parecidos[0].p }
  if (parecidos.length > 1) return { indice: null, motivo: 'ambiguo', pontuacao: Math.max(...parecidos.map((x) => x.p)) }
  return { indice: null, motivo: 'nenhum', pontuacao: 0 }
}

const textoDoAlvo = (nome) => (typeof nome === 'string' ? nome : nome.source.replace(/[\\^$.*+?()[\]{}|]/g, ''))

function construirLocator(page, papel, nome, alvo) {
  if (alvo.por === 'texto') return page.getByText(nome)
  if (alvo.por === 'css') return page.locator(nome)
  return page.getByRole(papel, { name: nome })
}

async function tentarPorNome(page, papel, nome, alvo, ctx) {
  const loc = construirLocator(page, papel, nome, alvo)
  const n = await loc.count()
  if (n === 1) return loc
  if (n > 1) {
    if (alvo.primeiro) return loc.first()
    throw new ErroPassoQuebrado(ctx.capitulo, ctx.passo, 'ambiguo', textoDoAlvo(alvo.nome))
  }
  return null
}

/**
 * @param alvo {papel, nome: string|RegExp, alternativas?: string[], primeiro?: boolean, texto?: string}
 * @param ctx {relatorio, capitulo, passo}
 */
export async function localizar(page, alvo, ctx) {
  const texto = alvo.texto || textoDoAlvo(alvo.nome)
  const direto = await tentarPorNome(page, alvo.papel, alvo.nome, alvo, ctx)
  if (direto) return direto

  for (const alt of alvo.alternativas || []) {
    const loc = await tentarPorNome(page, alvo.papel, alt, alvo, ctx)
    if (loc) {
      ctx.relatorio.ajuste(ctx.capitulo, ctx.passo, texto, alt)
      return loc
    }
  }

  // sem "papel" (texto/css) nao ha autoajuste: nao achou => quebra
  if (alvo.por === 'texto' || alvo.por === 'css') throw new ErroPassoQuebrado(ctx.capitulo, ctx.passo, 'nenhum', texto)

  const todos = await page.getByRole(alvo.papel).all()
  const visiveis = []
  for (const el of todos) {
    if (await el.isVisible()) visiveis.push(el)
  }
  const textos = []
  for (const el of visiveis) textos.push(((await el.innerText()) || (await el.getAttribute('aria-label')) || '').trim())
  const escolha = escolherCandidato(texto, textos)
  if (escolha.indice === null) throw new ErroPassoQuebrado(ctx.capitulo, ctx.passo, escolha.motivo, texto)
  ctx.relatorio.ajuste(ctx.capitulo, ctx.passo, texto, textos[escolha.indice])
  return visiveis[escolha.indice]
}
