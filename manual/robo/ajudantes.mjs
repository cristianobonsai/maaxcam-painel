// ajudantes.mjs - pecinhas reaproveitadas pelos roteiros dos capitulos.

/**
 * Rola a tela (a area que realmente rola, na pagina ou num painel interno) ate o elemento ficar perto do alto,
 * com uma folga em pixels. Serve para o print mostrar um bloco alto inteiro, sem cortar.
 */
export async function alinharNoTopo(page, seletor, folga = 90) {
  await page.locator(seletor).first().evaluate((el, f) => {
    el.scrollIntoView({ block: 'start' })
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.scrollHeight > p.clientHeight + 1 && getComputedStyle(p).overflowY !== 'visible') { p.scrollTop -= f; return }
    }
    window.scrollBy(0, -f)
  }, folga)
}

/** Volta ao topo da tela, seja a pagina ou um painel interno que rola. */
export async function irParaOTopo(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0)
    for (const el of document.querySelectorAll('*')) {
      if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight + 1) el.scrollTop = 0
    }
  })
}
