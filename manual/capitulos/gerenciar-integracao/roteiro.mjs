// roteiro.mjs - capitulo "Gerenciar: Integração" (5 passos): a integracao com a Carbigdata, nos modos Interno e Externo.
// Camera "Entrada". Codigos, senhas, IPs e enderecos sao inventados. O nome do parceiro pode aparecer aqui porque a aba se chama assim.

const CARD = (titulo) => `section:has(h2:has-text("${titulo}"))`
const ROLAGEM = (page) => page.locator('div.h-screen.overflow-y-auto').first()   // a area que rola na tela da camera

async function abrirIntegracao({ page, loc }) {
  await (await loc({ papel: 'button', nome: 'Integração' })).click()
  await page.getByText('Detecção de Veículos').first().waitFor()
}

export default {
  id: 'gerenciar-integracao',
  titulo: 'Gerenciar: Integração',
  passos: [
    {
      id: 'ativar', titulo: 'Ativar a integração', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'Ligue a chave para ativar a integração, escolha o tipo de reconhecimento e informe as credenciais.',
      acao: abrirIntegracao,
      destacar: [
        { por: 'css', nome: 'button[role="switch"]', numero: 'esquerda' },
        { por: 'css', nome: 'div.inline-flex.rounded-md.border >> nth=0', numero: 'direita' },
        { por: 'css', nome: CARD('Credenciais Carbigdata'), numero: 'esquerda' },
      ],
    },
    {
      id: 'sftp', titulo: 'Conexão SFTP (modo Interno)', contexto: 'logado',
      legenda: 'No modo Interno, copie o endereço, o usuário e a senha SFTP para o menu de FTP da câmera.',
      acao: async ({ page }) => {
        await page.locator(CARD('Conexão SFTP')).scrollIntoViewIfNeeded()
        await ROLAGEM(page).evaluate((el) => el.scrollBy(0, 80))
      },
      destacar: [
        { por: 'css', nome: CARD('Conexão SFTP'), numero: 'esquerda' },
      ],
    },
    {
      id: 'janela-status', titulo: 'Janela de envio e status', contexto: 'logado',
      legenda: 'Defina em que horário a câmera envia (24 horas, comercial ou manual) e acompanhe o último envio.',
      acao: async ({ page }) => {
        await page.locator(CARD('Status')).scrollIntoViewIfNeeded()
      },
      destacar: [
        { por: 'css', nome: CARD('Janela de envio'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Status'), numero: 'esquerda' },
      ],
    },
    {
      id: 'externo-webhook', titulo: 'Modo Externo: modelo e webhook', contexto: 'logado',
      legenda: 'No modo Externo a própria câmera envia direto por webhook: escolha o modelo e copie os campos para o menu de eventos.',
      acao: async ({ page, loc }) => {
        await ROLAGEM(page).evaluate((el) => { el.scrollTop = 0 })
        await page.getByRole('button', { name: /^Externo/ }).click()
        await page.getByText('Modelo de câmera homologado').first().waitFor()
        await page.locator(CARD('Webhook')).scrollIntoViewIfNeeded()
        await ROLAGEM(page).evaluate((el) => el.scrollBy(0, 110))
      },
      destacar: [
        { por: 'css', nome: CARD('Modelo de câmera homologado'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Webhook'), numero: 'esquerda' },
      ],
    },
    {
      id: 'externo-vinculo', titulo: 'Vínculo de segurança', contexto: 'logado',
      legenda: 'A chave fica presa à câmera física que a usou primeiro. Só reinicie o vínculo ao trocar o equipamento.',
      acao: async ({ page }) => {
        await page.locator(CARD('Vínculo de segurança')).scrollIntoViewIfNeeded()
        await page.getByText('Câmera vinculada').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: CARD('Vínculo de segurança'), numero: 'esquerda' },
      ],
    },
  ],
}
