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
      const acima = c.top >= 20
      n.style.cssText = `position:absolute;left:4px;top:${acima ? -17 : 4}px;width:26px;height:26px;border-radius:50%;`
        + 'background:#ef4444;color:#fff;font:700 15px/26px sans-serif;text-align:center'
      d.appendChild(n)
    }
    document.body.appendChild(d)
  })
}

function remover() {
  document.querySelectorAll('[data-manual-destaque]').forEach((e) => e.remove())
}

/** alvos: Locators do Playwright; arquivo: caminho do PNG (viewport 1280x800 definido no contexto). */
export async function destacarEFotografar(page, { alvos, arquivo, numeros = true }) {
  const caixas = []
  for (const alvo of alvos) {
    if (typeof alvo.scrollIntoViewIfNeeded === 'function') await alvo.scrollIntoViewIfNeeded()
    const box = await alvo.boundingBox()
    if (!box) throw new Error('Elemento a destacar sem posição na tela (invisível?).')
    caixas.push(calcularCaixa(box))
  }
  await page.evaluate(desenhar, { caixas, numeros })
  try {
    await page.screenshot({ path: arquivo })
  } finally {
    await page.evaluate(remover)
  }
}
