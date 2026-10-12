// mock-api.mjs - API ficticia do robo do Manual (spec 2026-10-12, secao 4).
// Registro de rotas "METODO caminho" -> resposta ficticia, com estado (o POST cria, o GET seguinte lista).
// Rota sem dado ficticio NAO inventa resposta: lanca ErroApiSemDado, para o robo quebrar dizendo qual rota faltou.

export class ErroApiSemDado extends Error {
  constructor(metodo, caminho) {
    super(`API sem dado fictício: ${metodo} ${caminho}`)
    this.name = 'ErroApiSemDado'
    this.metodo = metodo
    this.caminho = caminho
  }
}

/**
 * @param rotas (estado) => Rota[]   Rota = {metodo, padrao: RegExp, resposta: (match, corpo, estado) => {status?, json?, html?, imagem?}}
 * @param estadoInicial () => estado  fabrica do estado (chamada de novo em reset())
 */
export function criarMock(rotas, estadoInicial = () => ({})) {
  let estado = estadoInicial()
  let tabela = rotas(estado)
  let usadas = []

  function responder(metodo, caminho, corpo) {
    const met = metodo.toUpperCase()
    if (met === 'OPTIONS') return { status: 204 }
    for (const rota of tabela) {
      if (rota.metodo !== met) continue
      const m = caminho.match(rota.padrao)
      if (!m) continue
      usadas.push(`${met} ${caminho}`)
      const r = rota.resposta(m, corpo, estado) || {}
      return { status: 200, ...r }
    }
    throw new ErroApiSemDado(met, caminho)
  }

  function reset() {
    estado = estadoInicial()
    tabela = rotas(estado)
    usadas = []
  }

  return { responder, reset, usadas: () => [...usadas] }
}
