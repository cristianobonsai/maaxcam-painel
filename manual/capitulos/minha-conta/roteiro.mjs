// roteiro.mjs - capitulo "Minha conta" (5 passos): dados de acesso e cobranca, aceite dos termos, aceite salvo,
// excluir a conta e a versao do convidado. Dados da empresa, CNPJ e endereco inventados; nada e excluido.
import { aplicarCenarioConta } from '../../dados/rotas-lote4.mjs'
import { alinharNoTopo } from '../../robo/ajudantes.mjs'

const ACEITE = 'div.rounded-lg:has(a[href="/termos.pdf"])'
const ZONA_PERIGO = 'div.mt-8.rounded-xl'

export default {
  id: 'minha-conta',
  titulo: 'Minha conta',
  passos: [
    {
      id: 'dados', titulo: 'Seus dados de acesso e de cobrança', contexto: 'logado', ir: '/painel/conta',
      legenda: 'Em Minha conta você vê o seu e-mail e o tipo de acesso e preenche os dados de cobrança da sua empresa.',
      acao: async ({ page }) => { await page.locator('input[placeholder="00.000.000/0000-00"]').waitFor() },
      destacar: [
        { por: 'css', nome: 'div.mt-6.rounded-xl:has(> p:text-is("E-mail"))', numero: 'esquerda' },
        { por: 'css', nome: 'div.flex.gap-4:has(input[type="radio"])', numero: 'esquerda' },
        { por: 'css', nome: 'div.grid:has(label:text-is("CNPJ"))', numero: 'esquerda' },
        { por: 'css', nome: 'div.grid:has(label:text-is("E-mail de cobrança"))', numero: 'esquerda' },
      ],
    },
    {
      id: 'termos', titulo: 'Aceitar os Termos de Uso', contexto: 'logado',
      legenda: 'Para salvar os dados é preciso aceitar os Termos de Uso e a Política de Pagamento. Marque a caixa e clique em Salvar dados de cobrança.',
      acao: async ({ page }) => {
        await page.locator(`${ACEITE} input[type="checkbox"]`).check()
        await alinharNoTopo(page, ACEITE, 430)
      },
      destacar: [
        { por: 'css', nome: 'div.grid:has(label:text-is("UF"))', numero: 'esquerda' },
        { por: 'css', nome: ACEITE, numero: 'esquerda' },
        { papel: 'button', nome: 'Salvar dados de cobrança', numero: 'abaixo' },
      ],
    },
    {
      id: 'aceito', titulo: 'Dados salvos e termos aceitos', contexto: 'logado',
      legenda: 'Depois de salvar, o painel confirma com "✓ Salvo" e mostra quando os termos foram aceitos.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Salvar dados de cobrança' }).click()
        await page.getByText('Termos aceitos em').first().waitFor()
        await alinharNoTopo(page, ACEITE, 430)
      },
      destacar: [
        { por: 'css', nome: ACEITE, numero: 'esquerda' },
        { por: 'css', nome: 'span:text-is("✓ Salvo")', numero: 'direita' },
      ],
    },
    {
      id: 'excluir', titulo: 'Excluir a conta', contexto: 'logado',
      legenda: 'No fim da tela fica a exclusão da conta. O painel pede que você digite EXCLUIR para confirmar. Só é possível se não houver câmeras cadastradas.',
      acao: async ({ page }) => {
        await page.locator(`${ZONA_PERIGO} button:text-is("Excluir minha conta")`).click()
        await page.locator('input[placeholder="EXCLUIR"]').fill('EXCLUIR')
        await alinharNoTopo(page, ZONA_PERIGO, 120)
      },
      destacar: [
        { por: 'css', nome: `${ZONA_PERIGO} p:text-is("Excluir minha conta")`, numero: 'esquerda' },
        { por: 'css', nome: 'input[placeholder="EXCLUIR"]', numero: 'esquerda' },
        { papel: 'button', nome: 'Excluir definitivamente', numero: 'abaixo' },
      ],
    },
    {
      id: 'convidado', titulo: 'Quando você é convidado', contexto: 'logado',
      legenda: 'Quem entrou como convidado vê de quem é a conta, não tem dados de cobrança e, em vez de excluir, pode sair da conta.',
      acao: async ({ page, mock }) => {
        aplicarCenarioConta(mock.estado(), 'convidado')
        await page.reload()
        await page.getByText('Conta de', { exact: true }).first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.mt-6.rounded-xl:has(> p:text-is("E-mail"))', numero: 'esquerda' },
        { por: 'css', nome: 'button:text-is("Sair da conta")', numero: 'direita' },
      ],
    },
  ],
}
