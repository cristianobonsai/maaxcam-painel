// roteiro.mjs - capitulo "Gerenciar: Editar e Transmissão" (5 passos). Usa a camera "Entrada" (plano Pro),
// que mostra todos os quadros liberados. Dados 100 % ficticios.
import { alinharNoTopo } from '../../robo/ajudantes.mjs'

const LINK = '[data-testid="audio-link"]'
const ABA = (nome) => ({ papel: 'button', nome })
const CARD = (titulo) => `section:has(h2:text-is("${titulo}"))`

export default {
  id: 'gerenciar-editar-transmissao',
  titulo: 'Gerenciar: Editar e Transmissão',
  passos: [
    {
      id: 'editar', titulo: 'A aba Editar', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'Na aba Editar você muda o nome, a qualidade contratada e liga ou desliga a câmera. Depois, clique em Salvar.',
      acao: async ({ page }) => {
        await page.locator('input[placeholder="Ex.: Portão da frente"]').waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.flex.gap-6.border-b', numero: 'esquerda' },
        { por: 'css', nome: 'span:text-is("Público")', numero: 'esquerda' },
        { por: 'css', nome: 'input[placeholder="Ex.: Portão da frente"]', numero: 'direita' },
        { por: 'css', nome: 'select', numero: 'direita' },
        { por: 'css', nome: 'label:has-text("Câmera ativa")', numero: 'direita' },
        { papel: 'button', nome: 'Salvar', numero: 'direita' },
      ],
    },
    {
      id: 'verificar-youtube', titulo: 'Verificar a imagem e o YouTube', contexto: 'logado',
      legenda: 'Na aba Transmissão: a imagem ao vivo, a URL do YouTube e os botões Iniciar, Parar e Reiniciar.',
      acao: async ({ page, loc }) => {
        await (await loc(ABA('Transmissão'))).click()
        await page.getByText('Cole isto na sua câmera IP').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'iframe', numero: 'esquerda' },
        { por: 'css', nome: 'input[placeholder^="rtmp://a.rtmp.youtube.com"]', numero: 'esquerda' },
        { por: 'css', nome: 'div:has(> button:text-is("Iniciar"))', numero: 'esquerda' },
      ],
    },
    {
      id: 'rtmp-foto', titulo: 'URL RTMP e link da foto', contexto: 'logado',
      legenda: 'A URL RTMP vai na câmera. O link da foto devolve sempre a última imagem, para usar no seu site.',
      acao: async ({ page }) => {
        await page.locator(CARD('Link da foto (time-lapse)')).scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: CARD('Transmissão (RTMP)'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Link da foto (time-lapse)'), numero: 'esquerda' },
      ],
    },
    {
      id: 'audio-player', titulo: 'Áudio, link HLS e iframe', contexto: 'logado',
      legenda: 'Envie um áudio .mp3 para a transmissão e copie o link HLS ou o código iframe para o seu site.',
      acao: async ({ page }) => {
        await page.locator(CARD('Player & incorporação')).scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: 'label:has-text("Enviar áudio (.mp3)")', numero: 'esquerda' },
        { por: 'texto', nome: 'https://play.livebybit.com/v2/hls/', numero: 'esquerda' },
        { por: 'css', nome: 'code:has-text("<iframe")', numero: 'esquerda' },
      ],
    },
    {
      id: 'link-ao-vivo', titulo: 'Áudio ao vivo por link', contexto: 'logado',
      legenda: 'Para tocar uma rádio online ou uma fonia ao vivo, cole o endereço do áudio, teste o link e salve.',
      acao: async ({ page }) => {
        const bloco = page.locator(LINK)
        await bloco.scrollIntoViewIfNeeded()
        await bloco.getByRole('button', { name: 'Usar link ao vivo' }).click()
        await bloco.locator('input[type="url"]').fill('https://radio.exemplo.com/ao-vivo')
        await bloco.getByRole('button', { name: 'Testar link' }).click()
        await bloco.getByText('O link respondeu com áudio').waitFor()
        await alinharNoTopo(page, LINK, 260)
      },
      destacar: [
        { por: 'css', nome: LINK, numero: 'esquerda' },
        { por: 'css', nome: `${LINK} input[type="url"]`, numero: 'direita' },
        { por: 'css', nome: `${LINK} select`, numero: 'direita' },
        { por: 'css', nome: `${LINK} button:text-is("Testar link")`, numero: 'abaixo' },
        { por: 'css', nome: `${LINK} button:text-is("Salvar")`, numero: 'abaixo' },
      ],
    },
  ],
}
