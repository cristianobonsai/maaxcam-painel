// roteiro.mjs - capitulo "Usuários: Convidados" (5 passos): convidar, e-mail ja em uso, permissoes, remover, grupos de transmissao.
// Pessoas, e-mails e grupos inventados; nenhum convite e enviado de verdade.
import { aplicarCenario } from '../../dados/rotas-lote3.mjs'
import { alinharNoTopo } from '../../robo/ajudantes.mjs'

const CARTAO = 'div.rounded-xl.p-4:has(span:text-is("funcionario@exemplo.com"))'

export default {
  id: 'usuarios-convidados',
  titulo: 'Usuários: Convidados',
  passos: [
    {
      id: 'lista', titulo: 'A tela Usuários', contexto: 'logado', ir: '/painel/usuarios',
      legenda: 'Em Usuários você convida pessoas para a sua conta e define o que cada uma pode fazer.',
      acao: async ({ page }) => { await page.getByText('funcionario@exemplo.com').first().waitFor() },
      destacar: [
        { por: 'css', nome: 'div.flex.gap-1.border-b', numero: 'esquerda' },
        { por: 'css', nome: 'div.mt-6.rounded-xl:has(> p:text-is("Convidar pessoa"))', numero: 'esquerda' },
        { por: 'css', nome: 'div.rounded-lg:has-text("aguardando aceite")', numero: 'esquerda' },
        { por: 'css', nome: CARTAO, numero: 'esquerda' },
      ],
    },
    {
      id: 'convite-em-uso', titulo: 'E-mail que já tem conta', contexto: 'logado',
      legenda: 'Se a pessoa já tem conta no LiveByBit, o painel avisa e explica o que ela precisa fazer antes de aceitar o convite.',
      acao: async ({ page }) => {
        await page.locator('input[type="email"]').fill('ja-tem-conta@exemplo.com')
        await page.getByRole('button', { name: 'Enviar convite' }).click()
        await page.getByText('Este e-mail já está em uso').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'input[type="email"]', numero: 'esquerda' },
        { papel: 'button', nome: 'Enviar convite', numero: 'direita' },
        { por: 'css', nome: 'div.rounded-lg:has(> p:text-is("Este e-mail já está em uso"))', numero: 'esquerda' },
      ],
    },
    {
      id: 'permissoes', titulo: 'Escolher o que o convidado pode fazer', contexto: 'logado',
      legenda: 'Marque as permissões do convidado e clique em Salvar permissões.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Entendi' }).click()
        await page.locator('input[type="email"]').fill('')
        await page.getByText('Cadastrar câmeras').click()
        await page.getByRole('button', { name: 'Salvar permissões' }).click()
        await page.getByText('✓ Salvo').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: `${CARTAO} div.mt-3.flex.flex-wrap.gap-x-5`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO} div.mt-3.border-t:has(> p:text-is("Relatórios"))`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO} button:text-is("Salvar permissões")`, numero: 'abaixo' },
        { por: 'css', nome: `${CARTAO} button:text-is("Remover")`, numero: 'esquerda' },
      ],
    },
    {
      id: 'remover', titulo: 'Remover um convidado', contexto: 'logado',
      legenda: 'Ao clicar em Remover, o painel pede uma confirmação. Sim remove a pessoa da conta; Não cancela.',
      acao: async ({ page }) => {
        await page.locator(`${CARTAO} button:text-is("Remover")`).click()
        await page.getByText('Remover da conta?').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: `${CARTAO} div:has(> span:text-is("Remover da conta?"))`, numero: 'esquerda' },
      ],
    },
    {
      id: 'grupos-transmissao', titulo: 'Compartilhar grupos de transmissão', contexto: 'logado',
      legenda: 'Se a conta tem grupos de transmissão, escolha o que o convidado pode fazer em cada um e salve em Salvar grupos.',
      acao: async ({ page, mock }) => {
        aplicarCenario(mock.estado(), 'grupos')
        await page.reload()
        await page.getByText('Grupos de transmissão', { exact: true }).first().waitFor()
        await page.locator(`${CARTAO} select`).selectOption('editar')
        await page.getByText('Pode ver e trocar a chave do YouTube').click()
        await page.getByRole('button', { name: 'Salvar grupos' }).click()
        await page.getByText('✓ Salvo').first().waitFor()
        await alinharNoTopo(page, 'p:text-is("Convidados ativos")', 20)
      },
      destacar: [
        { por: 'css', nome: `${CARTAO} select`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO} label:has-text("Pode ver e trocar a chave do YouTube")`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO} button:text-is("Salvar grupos")`, numero: 'abaixo' },
      ],
    },
  ],
}
