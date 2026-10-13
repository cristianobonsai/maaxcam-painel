// roteiro.mjs - capitulo "Gerenciar: Localização e Mapa" (4 passos): a aba Localização (3 prints) e a tela Mapa.
// Camera "Entrada". Enderecos e coordenadas inventados; as imagens do mapa vem do servidor publico do OpenStreetMap (so GET).

const MAPA_CARREGADO = async (page) => {
  await page.locator('.leaflet-container').first().waitFor()
  await page.waitForFunction(() => document.querySelectorAll('.leaflet-tile-loaded').length >= 4, null, { timeout: 20000 })
}

export default {
  id: 'gerenciar-localizacao-mapa',
  titulo: 'Gerenciar: Localização e Mapa',
  passos: [
    {
      id: 'localizacao', titulo: 'A aba Localização', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'Na aba Localização você escreve a identificação da câmera, procura o endereço e ajusta o pino no mapa.',
      acao: async ({ page, loc }) => {
        await (await loc({ papel: 'button', nome: 'Localização' })).click()
        await MAPA_CARREGADO(page)
      },
      destacar: [
        { por: 'css', nome: 'input[placeholder^="Ex.: Loja Centro"]', numero: 'direita' },
        { por: 'css', nome: 'input[placeholder^="Comece a digitar"]', numero: 'esquerda' },
        { por: 'css', nome: 'div.h-72.w-full', numero: 'direita' },
        { papel: 'button', nome: 'Salvar localização', numero: 'direita' },
      ],
    },
    {
      id: 'buscar', titulo: 'Buscar o endereço', contexto: 'logado',
      legenda: 'Digite o endereço: as opções aparecem enquanto você digita. Clique na correta.',
      acao: async ({ page }) => {
        await page.locator('input[placeholder^="Comece a digitar"]').fill('rua exemplo')
        await page.getByRole('button', { name: /Rua Exemplo, 100/ }).waitFor()
      },
      destacar: [
        { por: 'css', nome: 'input[placeholder^="Comece a digitar"]', numero: 'esquerda' },
        { por: 'css', nome: 'ul:has(button:has-text("Rua Exemplo, 100"))', numero: 'direita' },
      ],
    },
    {
      id: 'ajustar-salvar', titulo: 'Ajustar o pino e salvar', contexto: 'logado',
      legenda: 'Ao escolher o endereço, o pino vai para lá. Ajuste se precisar e clique em Salvar localização.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: /Rua Exemplo, 100/ }).click()
        await page.getByText('Endereço do pino').first().waitFor()
        await page.waitForTimeout(1500)
        await MAPA_CARREGADO(page)
      },
      destacar: [
        { por: 'css', nome: 'div[class*="border-slate-700"][class*="text-xs"]:has-text("Endereço do pino")', numero: 'esquerda' },
        { por: 'css', nome: 'div.h-72.w-full', numero: 'direita' },
        { papel: 'button', nome: 'Salvar localização', numero: 'direita' },
      ],
    },
    {
      id: 'mapa', titulo: 'A tela Mapa', contexto: 'logado', ir: '/painel/mapa',
      legenda: 'O Mapa mostra todas as suas câmeras com localização. Clique num ponto para ver o nome e abrir a câmera.',
      acao: async ({ page }) => {
        await MAPA_CARREGADO(page)
        await page.locator('path.leaflet-interactive').first().click()
        await page.locator('.leaflet-popup-content').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.mt-4.flex.flex-wrap.gap-4.text-xs', numero: 'direita' },
        { por: 'css', nome: 'path.leaflet-interactive >> nth=0', numero: 'esquerda' },
        { por: 'css', nome: '.leaflet-popup-content-wrapper', numero: 'direita' },
      ],
    },
  ],
}
