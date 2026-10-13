// destaque.mjs - caixa vermelha numerada por cima dos elementos do passo + print (spec 2026-10-12, D4).

export function calcularCaixa(box, margem = 6) {
  const left = Math.max(0, Math.round(box.x - margem))
  const top = Math.max(0, Math.round(box.y - margem))
  return {
    left, top,
    width: Math.round(box.width + 2 * margem),
    height: Math.round(box.height + 2 * margem),
  }
}

const TAM = 26

/** Onde fica o numero (relativo a caixa): 'esquerda' (padrao), 'direita', 'acima' ou 'abaixo'; troca de lado se sair da tela. */
export function posicaoNumero(caixa, lado = 'esquerda', tela = { largura: 1440, altura: 900 }) {
  const pos = {
    esquerda: { left: -(TAM + 6), top: Math.round((caixa.height - TAM) / 2) },
    direita: { left: caixa.width + 6, top: Math.round((caixa.height - TAM) / 2) },
    acima: { left: 4, top: -(TAM + 4) },
    abaixo: { left: 4, top: caixa.height + 4 },
  }
  const x = caixa.left + pos[lado].left
  const y = caixa.top + pos[lado].top
  if (lado === 'esquerda' && x < 4) return pos.direita
  if (lado === 'direita' && x + TAM > tela.largura - 4) return pos.esquerda
  if (lado === 'acima' && y < 4) return pos.abaixo
  if (lado === 'abaixo' && y + TAM > tela.altura - 4) return pos.acima
  return pos[lado]
}

function desenhar({ caixas, numeros }) {
  caixas.forEach((c, i) => {
    const d = document.createElement('div')
    d.setAttribute('data-manual-destaque', '1')
    d.style.cssText = `position:fixed;left:${c.left}px;top:${c.top}px;width:${c.width}px;height:${c.height}px;`
      + 'border:3px solid #ef4444;border-radius:8px;box-sizing:border-box;z-index:2147483647;pointer-events:none;'
      + 'box-shadow:0 0 0 2px rgba(255,255,255,.35)'
    if (numeros) {
      const n = document.createElement('div')
      n.textContent = String(i + 1)
      n.style.cssText = `position:absolute;left:${c.numero.left}px;top:${c.numero.top}px;width:26px;height:26px;border-radius:50%;`
        + 'background:#ef4444;color:#fff;font:700 15px/26px sans-serif;text-align:center'
      d.appendChild(n)
    }
    document.body.appendChild(d)
  })
}

function remover() {
  document.querySelectorAll('[data-manual-destaque]').forEach((e) => e.remove())
}

/** alvos: Locators do Playwright; arquivo: caminho do PNG (viewport 1440x900 definido no contexto). */
export async function destacarEFotografar(page, { alvos, arquivo, numeros = true, lados = [] }) {
  const vp = typeof page.viewportSize === 'function' ? page.viewportSize() : null
  const tela = vp ? { largura: vp.width, altura: vp.height } : undefined
  const caixas = []
  for (const [i, alvo] of alvos.entries()) {
    if (typeof alvo.scrollIntoViewIfNeeded === 'function') await alvo.scrollIntoViewIfNeeded()
    const box = await alvo.boundingBox()
    if (!box) throw new Error('Elemento a destacar sem posição na tela (invisível?).')
    const caixa = calcularCaixa(box)
    caixas.push({ ...caixa, numero: posicaoNumero(caixa, lados[i], tela) })
  }
  await page.evaluate(desenhar, { caixas, numeros })
  try {
    await page.screenshot({ path: arquivo })
  } finally {
    await page.evaluate(remover)
  }
}
