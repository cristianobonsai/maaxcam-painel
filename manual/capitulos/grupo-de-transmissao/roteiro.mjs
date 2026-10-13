// roteiro.mjs - capitulo "Grupo de transmissão" (5 passos). Cenario "grupos": a conta tem 3 cameras Premium e 1 grupo
// ("Praças do Centro", 2 cameras). Tudo fictício; nada vai ao YouTube (o relay so muda o estado do robo).
import { aplicarCenario } from '../../dados/rotas-lote3.mjs'
import { alinharNoTopo } from '../../robo/ajudantes.mjs'

const LISTA = 'div.mt-6.space-y-2'

export default {
  id: 'grupo-de-transmissao',
  titulo: 'Grupo de transmissão',
  passos: [
    {
      id: 'lista', titulo: 'A lista de grupos', contexto: 'logado', ir: '/painel/grupos',
      legenda: 'Em Grupos ficam as transmissões que alternam várias câmeras. Cada linha mostra o estado do grupo.',
      acao: async ({ page, mock }) => {
        aplicarCenario(mock.estado(), 'grupos')
        await page.reload()
        await page.getByText('Praças do Centro').first().waitFor()
      },
      destacar: [
        { papel: 'button', nome: 'Novo grupo', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="border-purple-500/30"]', numero: 'esquerda' },
        { por: 'css', nome: `${LISTA} > div >> nth=0`, numero: 'esquerda' },
        { por: 'css', nome: `${LISTA} button:text-is("Gerenciar")`, numero: 'abaixo' },
      ],
    },
    {
      id: 'novo', titulo: 'Criar um grupo', contexto: 'logado',
      legenda: 'Clique em Novo grupo: dê um nome, escolha a resolução e, se já tiver, cole a chave do YouTube.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Novo grupo' }).click()
        await page.getByText('Como funciona um grupo').first().waitFor()
        await page.locator('input[placeholder="Ex.: Grupo Centro"]').fill('Grupo Orla')
      },
      destacar: [
        { por: 'css', nome: 'div[class*="border-sky-500/30"]:has-text("Como funciona um grupo")', numero: 'esquerda' },
        { por: 'css', nome: 'input[placeholder="Ex.: Grupo Centro"]', numero: 'direita' },
        { por: 'css', nome: 'input[placeholder="opcional"]', numero: 'direita' },
        { por: 'css', nome: 'div[class*="border-blue-500/60"] select', numero: 'direita' },
        { por: 'css', nome: 'div[class*="border-blue-500/60"] button:text-is("Salvar")', numero: 'abaixo' },
      ],
    },
    {
      id: 'gerenciar', titulo: 'Gerenciar um grupo', contexto: 'logado',
      legenda: 'Em Gerenciar você vê a rotação das câmeras, liga a transmissão e cuida da chave do YouTube e do áudio.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Cancelar' }).click()
        await page.locator(`${LISTA} button:text-is("Gerenciar")`).click()
        await page.getByText('Rotação das câmeras').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'button:has-text("Iniciar relay")', numero: 'esquerda' },
        { por: 'css', nome: 'div:has(> div:text-is("Rotação das câmeras")) > div.space-y-2', numero: 'esquerda' },
        { por: 'css', nome: 'button:has-text("Adicionar câmera")', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="rounded-lg"]:has(> div:text-is("Transmissão YouTube"))', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="rounded-lg"]:has(> div:text-is("Áudio em loop"))', numero: 'esquerda' },
      ],
    },
    {
      id: 'adicionar', titulo: 'Adicionar uma câmera ao grupo', contexto: 'logado',
      legenda: 'Escolha a câmera Premium e a duração dela no rodízio. A câmera precisa estar no ar e na resolução do grupo.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Adicionar câmera' }).click()
        const form = 'div[class*="border-blue-500"][class*="bg-slate-900"][class*="p-3"]'
        await page.locator(`${form} select`).selectOption('MAADEMO3')
        await alinharNoTopo(page, form, 260)
      },
      destacar: [
        { por: 'css', nome: 'div[class*="border-blue-500"][class*="bg-slate-900"][class*="p-3"] select', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="border-blue-500"][class*="bg-slate-900"][class*="p-3"] input[type="number"]', numero: 'direita' },
        { por: 'css', nome: 'div[class*="border-blue-500"][class*="bg-slate-900"][class*="p-3"] button:text-is("Adicionar")', numero: 'abaixo' },
      ],
    },
    {
      id: 'no-ar', titulo: 'Grupo no ar e avisos de estado', contexto: 'logado',
      legenda: 'Com o grupo no ar, o selo mostra se alguma câmera saiu do rodízio por estar offline ou instável.',
      acao: async ({ page, mock }) => {
        aplicarCenario(mock.estado(), 'grupo-no-ar')
        await page.reload()
        await page.locator(`${LISTA} button:text-is("Gerenciar")`).click()
        await page.getByText('Aplicar áudio agora').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'span:has-text("Degradado")', numero: 'esquerda' },
        { por: 'css', nome: 'p:has-text("Alguma câmera está fora do rodízio")', numero: 'esquerda' },
        { por: 'css', nome: 'span:has-text("Instável · fora do rodízio")', numero: 'abaixo' },
        { por: 'css', nome: 'button:has-text("Parar relay")', numero: 'esquerda' },
        { por: 'css', nome: 'button:has-text("Aplicar áudio agora")', numero: 'esquerda' },
      ],
    },
  ],
}
