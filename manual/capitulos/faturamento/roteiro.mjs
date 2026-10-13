// roteiro.mjs - capitulo "Faturamento" (2 passos): conta simples (Básico + Pro) e conta com Premium e grupo.
// Valores calculados pelo mock a partir dos precos publicados; nenhuma fatura real.
import { aplicarCenario } from '../../dados/rotas-lote3.mjs'

export default {
  id: 'faturamento',
  titulo: 'Faturamento',
  passos: [
    {
      id: 'resumo', titulo: 'O resumo de cobrança', contexto: 'logado', ir: '/painel/faturamento',
      legenda: 'O Faturamento mostra, por plano, quantas câmeras você tem, o preço de cada uma e o total do ciclo.',
      acao: async ({ page }) => { await page.getByText('Total do ciclo').first().waitFor() },
      destacar: [
        { por: 'css', nome: 'div.rounded-xl:has-text("Básico")', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="border-blue-500/40"]', numero: 'esquerda' },
        { papel: 'button', nome: 'Baixar PDF', numero: 'esquerda' },
      ],
    },
    {
      id: 'grupos', titulo: 'Com câmeras Premium e grupo', contexto: 'logado',
      legenda: 'Quem usa grupos de transmissão vê também cada grupo, com o seu valor, somado ao total.',
      acao: async ({ page, mock }) => {
        aplicarCenario(mock.estado(), 'grupos')
        await page.reload()
        await page.getByText('Praças do Centro').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.rounded-xl:has-text("Premium")', numero: 'esquerda' },
        { por: 'css', nome: 'div.mt-6:has(> h2:text-is("Grupos"))', numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="border-blue-500/40"]', numero: 'esquerda' },
      ],
    },
  ],
}
