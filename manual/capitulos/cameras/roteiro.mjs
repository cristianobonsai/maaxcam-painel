// roteiro.mjs - capitulo "Câmeras" (3 passos): a lista, a troca de plano e a exclusao (so abre o aviso, nunca confirma).
// Dados 100 % ficticios (cliente "Padaria Exemplo"). A camera "Entrada" (Pro) ganha uma chave do YouTube para mostrar o botao de relay.

const LINHA = (nome) => `li:has-text("${nome}")`

export default {
  id: 'cameras',
  titulo: 'Câmeras',
  passos: [
    {
      id: 'lista', titulo: 'A lista de câmeras', contexto: 'logado', ir: '/painel/cameras',
      legenda: 'Resumo por plano, filtros, busca e uma linha por câmera, com selos de estado e botões de ação.',
      acao: async ({ page, mock }) => {
        mock.estado().cameras[0].youtube_key = 'rtmp://a.rtmp.youtube.com/live2/chave-de-exemplo'
        await page.reload()
        await page.locator('input[placeholder^="Buscar"]').waitFor()
        await page.locator(LINHA('Entrada')).first().waitFor()
      },
      destacar: [
        { por: 'texto', nome: 'Pro: 1', numero: 'acima' },
        { por: 'css', nome: 'div.mb-3.flex.flex-wrap.gap-2', numero: 'acima' },
        { por: 'css', nome: 'input[placeholder^="Buscar"]', numero: 'direita' },
        { por: 'css', nome: `${LINHA('Entrada')} >> nth=0`, numero: 'esquerda' },
        { papel: 'button', nome: 'Nova câmera', numero: 'abaixo' },
      ],
    },
    {
      id: 'plano', titulo: 'Trocar o plano de uma câmera', contexto: 'logado',
      legenda: 'Clique no selo "Plano" da câmera: abre a comparação dos três planos, com o atual marcado.',
      acao: async ({ page }) => {
        await page.locator(`${LINHA('Entrada')} button[title^="Ver e trocar"]`).click()
        await page.getByText('Plano da câmera').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div[class*="flex-col"][class*="border-blue-500"]', numero: 'acima' },
        { por: 'css', nome: 'button:has-text("Trocar para Premium")', numero: 'abaixo' },
        { por: 'css', nome: 'div[class*="border-amber-500/30"][class*="text-xs"]', numero: 'esquerda' },
      ],
    },
    {
      id: 'excluir', titulo: 'Excluir uma câmera', contexto: 'logado',
      legenda: 'O botão Excluir pede confirmação: a exclusão não pode ser desfeita. Para desistir, clique em Cancelar.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Fechar', exact: true }).click()
        await page.locator(`${LINHA('Estacionamento')} button:has-text("Excluir")`).click()
        await page.getByText('Excluir câmera').first().waitFor()
      },
      destacar: [
        { por: 'texto', nome: 'não pode ser desfeita', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="border-red-900"] button:text-is("Cancelar")', numero: 'abaixo' },
      ],
    },
  ],
}
