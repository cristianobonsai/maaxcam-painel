// roteiro.mjs - capitulo "Gerenciar: Monitoramento" (3 passos): estado normal, avisos de problema e chave duplicada.
// Camera "Entrada". Os cenarios 'problemas' e 'duplicada' vem do mock (nada real).

const LINHA = (rotulo) => `div:has(> span:text-is("${rotulo}"))`
const CARD = (titulo) => `section:has(h2:text-is("${titulo}"))`

async function abrirMonitoramento({ page, loc }) {
  await (await loc({ papel: 'button', nome: 'Monitoramento' })).click()
  await page.getByText('Estado da câmera').first().waitFor()
}

export default {
  id: 'gerenciar-monitoramento',
  titulo: 'Gerenciar: Monitoramento',
  passos: [
    {
      id: 'estado', titulo: 'Estado e números da transmissão', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'A aba Monitoramento mostra como a câmera está agora e os números medidos da transmissão.',
      acao: abrirMonitoramento,
      destacar: [
        { por: 'css', nome: CARD('Estado da câmera'), numero: 'esquerda' },
        { por: 'css', nome: CARD('Números da transmissão'), numero: 'esquerda' },
      ],
    },
    {
      id: 'problemas', titulo: 'Quando há um problema', contexto: 'logado',
      legenda: 'Quando a câmera cai muito ou precisa de ajuste, o painel avisa e diz o que fazer.',
      acao: async ({ page, loc, mock }) => {
        mock.estado().monitoramento = 'problemas'
        await page.reload()
        await abrirMonitoramento({ page, loc })
        await page.getByText('Precisa ajustar:').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: LINHA('Estabilidade (24h)'), numero: 'esquerda' },
        { por: 'css', nome: LINHA('Ajustes (configuração)'), numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="bg-orange-500/15"]:has-text("Precisa ajustar")', numero: 'esquerda' },
      ],
    },
    {
      id: 'chave-duplicada', titulo: 'Chave em uso por dois equipamentos', contexto: 'logado',
      legenda: 'Se um segundo equipamento tenta usar a mesma chave, ele é bloqueado e o painel avisa.',
      acao: async ({ page, loc, mock }) => {
        mock.estado().monitoramento = 'duplicada'
        await page.reload()
        await abrirMonitoramento({ page, loc })
        await page.getByText('Chave RTMP em uso por dois equipamentos:').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: LINHA('Conexão com o servidor'), numero: 'esquerda' },
        { por: 'css', nome: 'div[class*="bg-orange-500/15"]:has-text("Chave RTMP em uso por dois equipamentos:")', numero: 'esquerda' },
      ],
    },
  ],
}
