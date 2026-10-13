// roteiro.mjs - capitulo "Gerenciar: Cartões" (4 passos). Camera "Entrada" (Pro). A imagem do cartao e uma ilustracao
// fictícia (SVG) montada pelo robo a partir dos itens; o painel real mostra a imagem gerada no servidor.

const CARD = (titulo) => `section:has(h2:has-text("${titulo}"))`

async function abrirCartoes({ page, loc }) {
  await (await loc({ papel: 'button', nome: 'Cartões' })).click()
  await page.getByText('Itens do cartão').first().waitFor()
  await page.locator('img[alt="Pré-visualização do cartão"]').waitFor()
}

export default {
  id: 'gerenciar-cartoes',
  titulo: 'Gerenciar: Cartões',
  passos: [
    {
      id: 'introducao', titulo: 'O cartão de introdução', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'Na aba Cartões você monta a imagem que aparece antes da câmera (introdução) ou no lugar dela quando cai (offline).',
      acao: abrirCartoes,
      destacar: [
        { por: 'css', nome: 'div.flex.gap-6.border-b.border-slate-700.flex-1', numero: 'esquerda' },
        { por: 'css', nome: CARD('Pré-visualização'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Itens do cartão'), numero: 'esquerda' },
      ],
    },
    {
      id: 'fundo-duracao', titulo: 'Imagem de fundo, duração e ativação', contexto: 'logado',
      legenda: 'Escolha a foto automática ou envie uma imagem de fundo, defina quantos segundos o cartão fica na tela e ative.',
      acao: async ({ page }) => {
        await page.locator(CARD('Duração e ativação')).scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: CARD('Imagem de fundo'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Duração e ativação'), numero: 'esquerda' },
      ],
    },
    {
      id: 'adicionar-item', titulo: 'Adicionar um item', contexto: 'logado',
      legenda: 'Clique em Adicionar item: escolha texto ou imagem, fixo ou dinâmico, a fonte, a cor e a posição.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: '+ Adicionar item' }).scrollIntoViewIfNeeded()
        await page.getByRole('button', { name: '+ Adicionar item' }).click()
        await page.locator('input[placeholder="Texto a exibir"]').fill('Aberto das 7h às 19h')
        await page.locator('input[placeholder="Texto a exibir"]').scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: 'input[placeholder="Texto a exibir"]', numero: 'esquerda' },
        { por: 'css', nome: 'div:has(> div > input[type="color"])', numero: 'direita' },
        { papel: 'button', nome: 'Adicionar item', numero: 'direita' },
      ],
    },
    {
      id: 'offline', titulo: 'O cartão de offline', contexto: 'logado',
      legenda: 'O cartão de offline aparece quando a câmera cai. Defina em quantos minutos o texto muda para "Em manutenção".',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Cartão de offline' }).click()
        await page.getByText('Tempo até').first().waitFor()
        await page.locator('img[alt="Pré-visualização do cartão"]').waitFor()
        await page.locator(CARD('Cartão automático na transmissão')).scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: CARD('Tempo até'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Cartão automático na transmissão'), numero: 'esquerda' },
      ],
    },
  ],
}
