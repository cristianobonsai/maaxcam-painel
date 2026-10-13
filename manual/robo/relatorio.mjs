// relatorio.mjs - o que o robo fez em uma rodada: passos OK, ajustes automaticos e quebras (spec 2026-10-12, 4.3).
// O robo NUNCA edita texto nem roteiro: o relatorio diz quais capitulos precisam de revisao.

export function criarRelatorio() {
  const oks = [], ajustes = [], quebras = []

  return {
    ok(cap, passo, msg = '') { oks.push({ cap, passo, msg }) },
    ajuste(cap, passo, de, para) { ajustes.push({ cap, passo, de, para }) },
    quebra(cap, passo, motivo, arquivo = '') { quebras.push({ cap, passo, motivo, arquivo }) },
    apiSemDado(cap, passo, metodo, caminho) {
      quebras.push({ cap, passo, motivo: `API sem dado fictício: ${metodo} ${caminho}`, arquivo: '' })
    },
    temQuebra: () => quebras.length > 0,
    capitulosParaRevisar: () => [...new Set([...ajustes.map((a) => a.cap), ...quebras.map((q) => q.cap)])],
    toMarkdown() {
      const linhas = ['# Relatório do robô do Manual', '',
        `- Passos OK: ${oks.length}`, `- Ajustes automáticos: ${ajustes.length}`, `- Quebras: ${quebras.length}`, '']
      if (this.capitulosParaRevisar().length) {
        linhas.push(`**Capítulos para revisar o texto:** ${this.capitulosParaRevisar().join(', ')}`, '')
      }
      if (quebras.length) {
        linhas.push('## Quebras', '')
        for (const q of quebras) linhas.push(`- [${q.cap}/${q.passo}] ${q.motivo}${q.arquivo ? ` — print: ${q.arquivo}` : ''}`)
        linhas.push('')
      }
      if (ajustes.length) {
        linhas.push('## Ajustes automáticos', '')
        for (const a of ajustes) linhas.push(`- [${a.cap}/${a.passo}] "${a.de}" → "${a.para}"`)
        linhas.push('')
      }
      if (oks.length) {
        linhas.push('## Passos OK', '')
        for (const o of oks) linhas.push(`- [${o.cap}/${o.passo}] ${o.msg}`.trim())
        linhas.push('')
      }
      return linhas.join('\n')
    },
  }
}
