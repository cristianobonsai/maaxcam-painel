// markdown.js - conversor minimo de Markdown para o Manual do Usuario (sem dependencias).
// Suporta: # ## ###, paragrafos, listas (- e 1.), **negrito**, *italico*, `codigo`, [texto](http(s)://... | /interno),
// e imagens ![alt](img:<id>) -> /manual/img/<id>.png. TODO o HTML do texto e escapado antes da marcacao.

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function inline(texto, base) {
  let t = esc(texto)
  t = t.replace(/!\[([^\]]*)\]\(img:([a-z0-9-]+)\)/g,
    (_, alt, id) => `<img src="${base}${id}.png" alt="${alt}" loading="lazy" onerror="this.style.display='none'" class="manual-img" />`)
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/(?!\/)[^)\s]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  return t
}

export function mdParaHtml(md, base = '/manual/img/') {
  const out = []
  let lista = null
  let par = []
  const fecharPar = () => { if (par.length) { out.push(`<p>${inline(par.join(' '), base)}</p>`); par = [] } }
  const fecharLista = () => { if (lista) { out.push(`</${lista}>`); lista = null } }

  for (const linha of String(md).replace(/\r\n/g, '\n').split('\n')) {
    const h = linha.match(/^(#{1,3})\s+(.*)$/)
    const ul = linha.match(/^[-*]\s+(.*)$/)
    const ol = linha.match(/^\d+\.\s+(.*)$/)
    if (h) {
      fecharPar(); fecharLista()
      out.push(`<h${h[1].length}>${inline(h[2], base)}</h${h[1].length}>`)
    } else if (ul || ol) {
      fecharPar()
      const tag = ul ? 'ul' : 'ol'
      if (lista !== tag) { fecharLista(); out.push(`<${tag}>`); lista = tag }
      out.push(`<li>${inline((ul || ol)[1], base)}</li>`)
    } else if (!linha.trim()) {
      fecharPar(); fecharLista()
    } else {
      fecharLista()
      par.push(linha.trim())
    }
  }
  fecharPar(); fecharLista()
  return out.join('\n')
}
