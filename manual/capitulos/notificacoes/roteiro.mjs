// roteiro.mjs - capitulo "Notificações" (7 passos): Telegram (nao conectado, link, conectado), e-mail e tipos de
// alerta, aba Convidados. Bot, chat e e-mails inventados; nenhum aviso real e enviado.
import { aplicarCenario } from '../../dados/rotas-lote3.mjs'
import { alinharNoTopo, irParaOTopo } from '../../robo/ajudantes.mjs'

const CARTAO_CONVIDADO = 'div.rounded-xl.p-4:has(span:text-is("funcionario@exemplo.com"))'
const LIGAR = (titulo) => `div:has(> div > p:text-is("${titulo}")) > button[role="switch"]`

export default {
  id: 'notificacoes',
  titulo: 'Notificações',
  passos: [
    {
      id: 'telegram', titulo: 'Conectar o Telegram', contexto: 'logado', ir: '/painel/notificacoes',
      legenda: 'No quadro Telegram, clique em Conectar Telegram para receber os alertas das câmeras no seu celular.',
      acao: async ({ page }) => { await page.getByRole('button', { name: 'Conectar Telegram' }).waitFor() },
      destacar: [
        { por: 'css', nome: 'section >> nth=0', numero: 'esquerda' },
        { papel: 'button', nome: 'Conectar Telegram', numero: 'abaixo' },
      ],
    },
    {
      id: 'telegram-link', titulo: 'Abrir o link no Telegram', contexto: 'logado',
      legenda: 'O painel gera um link. Abra no Telegram e toque em Iniciar. Depois, clique em "Já conectei — atualizar".',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Conectar Telegram' }).click()
        await page.getByText('Abrir no Telegram').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'a:has-text("Abrir no Telegram")', numero: 'esquerda' },
        { por: 'css', nome: 'code:has-text("/conectar")', numero: 'direita' },
        { por: 'css', nome: 'button:has-text("Já conectei")', numero: 'direita' },
      ],
    },
    {
      id: 'telegram-ok', titulo: 'Telegram conectado e e-mail', contexto: 'logado',
      legenda: 'Com o Telegram conectado, você pode enviar uma mensagem de teste. Mais abaixo, ative também os alertas por e-mail.',
      acao: async ({ page, mock }) => {
        aplicarCenario(mock.estado(), 'telegram')
        await page.reload()
        await page.getByText('Bot conectado com sucesso').first().waitFor()
        await page.locator(LIGAR('Receber alertas por e-mail')).click()
        await page.locator('input[type="email"]').waitFor()
        await alinharNoTopo(page, 'section >> nth=0', 130)
      },
      destacar: [
        { por: 'css', nome: 'span:text-is("Conectado")', numero: 'esquerda' },
        { papel: 'button', nome: 'Desconectar', numero: 'esquerda' },
        { papel: 'button', nome: 'Enviar mensagem de teste', numero: 'abaixo' },
        { por: 'css', nome: 'section >> nth=1', numero: 'esquerda' },
      ],
    },
    {
      id: 'tipos', titulo: 'Tipos de alerta', contexto: 'logado',
      legenda: 'Em Tipos de Alerta, ligue ou desligue cada aviso. Aqui o Resumo Diário foi ligado.',
      acao: async ({ page }) => {
        await page.locator(LIGAR('Resumo Diário')).click()
        await alinharNoTopo(page, 'h2:text-is("Tipos de Alerta")', 60)
      },
      destacar: [
        { por: 'css', nome: 'h2:text-is("Tipos de Alerta") + p + section', numero: 'esquerda' },
        { por: 'css', nome: LIGAR('Resumo Diário'), numero: 'direita' },
      ],
    },
    {
      id: 'avancadas', titulo: 'Configurações avançadas', contexto: 'logado',
      legenda: 'Defina depois de quanto tempo avisar, o horário de silêncio e a hora do resumo diário. Clique em Salvar Configurações.',
      acao: async ({ page }) => {
        await page.locator(LIGAR('Horário de silêncio')).click()
        await page.getByText('Horário do resumo diário').first().waitFor()
        await alinharNoTopo(page, 'h2:text-is("Configurações Avançadas")', 20)   // Salvar precisa caber na tela sem rolar de novo
      },
      destacar: [
        { por: 'css', nome: 'div.px-5.py-4:has(p:text-is("Câmera offline — alertar após"))', numero: 'esquerda' },
        { por: 'css', nome: 'div.px-5.py-4:has(p:text-is("Horário de silêncio"))', numero: 'esquerda' },
        { por: 'css', nome: 'div.px-5.py-4:has(p:text-is("Horário do resumo diário"))', numero: 'esquerda' },
        { papel: 'button', nome: 'Salvar Configurações', numero: 'esquerda' },
      ],
    },
    {
      id: 'convidados', titulo: 'Alertas para convidados', contexto: 'logado',
      legenda: 'Na aba Convidados, o dono escolhe quem mais recebe alertas. O atalho aplica a escolha a todo um grupo de acesso de uma vez.',
      acao: async ({ page }) => {
        await irParaOTopo(page)
        await page.getByRole('button', { name: 'Convidados', exact: true }).click()
        await page.getByText('funcionario@exemplo.com').first().waitFor()
        await page.waitForTimeout(500)
      },
      destacar: [
        { por: 'css', nome: 'p:has-text("Escolha quais convidados recebem")', numero: 'esquerda' },
        { por: 'css', nome: 'div.mt-5.rounded-xl:has(> p:text-is("Atalho por grupo"))', numero: 'esquerda' },
      ],
    },
    {
      id: 'convidado-opcoes', titulo: 'Escolher canais e câmeras de cada convidado', contexto: 'logado',
      legenda: 'Para cada convidado: ligue os alertas, escolha Email e/ou Telegram, marque os grupos de acesso ou câmeras avulsas e clique em Salvar.',
      acao: async ({ page }) => {
        await alinharNoTopo(page, 'p:text-is("Convidados")', 40)
      },
      destacar: [
        { por: 'css', nome: `${CARTAO_CONVIDADO} >> button >> nth=0`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO_CONVIDADO} div.mt-3.flex.flex-wrap.gap-x-5`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO_CONVIDADO} div.mt-3.border-t:has(> p:text-is("Grupos de acesso"))`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO_CONVIDADO} div.mt-3.border-t:has(> p:text-is("Câmeras avulsas"))`, numero: 'esquerda' },
        { por: 'css', nome: `${CARTAO_CONVIDADO} button:text-is("Salvar")`, numero: 'direita' },
      ],
    },
  ],
}
