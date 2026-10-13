// roteiro.mjs - capitulo "Relatórios" (5 passos): Disponibilidade (+ SLA por periodo), Quedas (+ periodo) e Acessos.
// Os numeros, e-mails e IPs sao inventados; as datas sao preenchidas pelo robo para o print nao depender do dia.
import { alinharNoTopo } from '../../robo/ajudantes.mjs'

const BLOCO = (titulo) => `div:has(> p:text-is("${titulo}"))`
const INICIO = '2026-10-06'
const FIM = '2026-10-12'

async function preencherPeriodo(page, bloco) {
  await page.locator(`${bloco} input[type="date"]`).first().fill(INICIO)
  await page.locator(`${bloco} input[type="date"]`).nth(1).fill(FIM)
}

export default {
  id: 'relatorios',
  titulo: 'Relatórios',
  passos: [
    {
      id: 'disponibilidade', titulo: 'Relatório de Disponibilidade', contexto: 'logado', ir: '/painel/relatorios',
      legenda: 'Disponibilidade mostra, para cada câmera, a porcentagem do tempo em que ela esteve online na última semana.',
      acao: async ({ page }) => {
        await page.getByText('% online').first().waitFor()
        await preencherPeriodo(page, BLOCO('Conferencia de SLA por periodo'))
      },
      destacar: [
        { por: 'css', nome: 'div.flex.gap-1.rounded-lg.border', numero: 'esquerda' },
        { por: 'css', nome: BLOCO('Conferencia de SLA por periodo'), numero: 'esquerda' },
        { por: 'css', nome: 'div.rounded-lg:has-text("% online") >> nth=0', numero: 'esquerda' },
      ],
    },
    {
      id: 'sla-periodo', titulo: 'Conferir o SLA por período', contexto: 'logado',
      legenda: 'Escolha as datas e quantos dias de tolerância (SLA) valem. O painel mostra a maior queda de cada câmera e se estourou o limite.',
      acao: async ({ page }) => {
        const bloco = BLOCO('Conferencia de SLA por periodo')
        await preencherPeriodo(page, bloco)
        await page.locator('input[placeholder="ex: 4"]').fill('4')
        await page.getByRole('button', { name: 'Consultar', exact: true }).click()
        await page.getByText('Extrapolou o SLA').first().waitFor()
        await alinharNoTopo(page, bloco, 70)
      },
      destacar: [
        { por: 'css', nome: 'input[placeholder="ex: 4"]', numero: 'abaixo' },
        { por: 'css', nome: 'table >> nth=0', numero: 'esquerda' },
        { por: 'css', nome: 'button:text-is("Exportar PDF")', numero: 'acima' },
      ],
    },
    {
      id: 'quedas', titulo: 'Relatório de Quedas', contexto: 'logado',
      legenda: 'Quedas lista quantas vezes cada câmera caiu. Clique numa câmera para ver todas as quedas dela.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Quedas', exact: true }).click()
        await page.getByText('Total de 5 quedas').first().waitFor()
        await preencherPeriodo(page, BLOCO('Consultar periodo especifico'))
        await page.locator('tr:has-text("Estacionamento")').first().click()
        await page.getByText('Todas as quedas (4)').first().waitFor()
        await alinharNoTopo(page, BLOCO('Consultar periodo especifico'), 80)
      },
      destacar: [
        { por: 'css', nome: 'p:has-text("Total de 5 quedas")', numero: 'esquerda' },
        { por: 'css', nome: 'tr:has-text("Estacionamento") >> nth=0', numero: 'esquerda' },
        { por: 'css', nome: 'td[colspan="3"]', numero: 'direita' },
      ],
    },
    {
      id: 'quedas-periodo', titulo: 'Quedas de uma câmera em um período', contexto: 'logado',
      legenda: 'Escolha a câmera e as datas e clique em Consultar: o painel soma o tempo offline e lista cada queda.',
      acao: async ({ page }) => {
        const bloco = BLOCO('Consultar periodo especifico')
        await page.locator(`${bloco} select`).selectOption('MAADEMO2')
        await preencherPeriodo(page, bloco)
        await page.getByRole('button', { name: 'Consultar', exact: true }).click()
        await page.getByText('ficou').first().waitFor()
        await alinharNoTopo(page, bloco, 70)
      },
      destacar: [
        { por: 'css', nome: `${BLOCO('Consultar periodo especifico')} select`, numero: 'esquerda' },
        { por: 'css', nome: 'p:has-text("ficou")', numero: 'direita' },
        { por: 'css', nome: 'table >> nth=0', numero: 'esquerda' },
      ],
    },
    {
      id: 'acessos', titulo: 'Relatório de Acessos', contexto: 'logado',
      legenda: 'Acessos mostra quem entrou no painel, de que IP e quando.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Acessos', exact: true }).click()
        await page.getByText('3 acessos nos últimos 7 dias').first().waitFor()
        await alinharNoTopo(page, BLOCO('Consultar periodo especifico'), 80)
      },
      destacar: [
        { por: 'css', nome: BLOCO('Consultar periodo especifico'), numero: 'esquerda' },
        { por: 'css', nome: 'input[placeholder^="Buscar usuario"]', numero: 'direita' },
        { por: 'css', nome: 'table >> nth=0', numero: 'esquerda' },
      ],
    },
  ],
}
