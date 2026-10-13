// roteiro.mjs - capitulo "Dashboard" (2 passos): os numeros do topo e o aviso de "precisa de atencao".
// Dados 100 % ficticios (cliente "Padaria Exemplo"); o aviso e ligado pelo cenario 'atencao' do mock.

const KPI = (n) => ({ por: 'css', nome: `main div.grid > div:nth-child(${n})`, numero: 'acima' })

export default {
  id: 'dashboard',
  titulo: 'Dashboard',
  passos: [
    {
      id: 'visao', titulo: 'Os números do topo', contexto: 'logado', ir: '/painel',
      legenda: 'Cinco quadros resumem a sua conta: câmeras, ativas, no ar, grupos e YouTube. A faixa verde diz que está tudo certo.',
      acao: async ({ page }) => { await page.getByText('Tudo certo').first().waitFor() },
      destacar: [KPI(1), KPI(2), KPI(3), KPI(4), KPI(5),
        { por: 'css', nome: 'div[class*="border-emerald-500/30"]', numero: 'direita' }],
    },
    {
      id: 'atencao', titulo: 'Quando uma câmera precisa de atenção', contexto: 'logado',
      legenda: 'Se alguma câmera tiver problema, a faixa fica amarela, lista as câmeras e mostra o botão Gerenciar de cada uma.',
      acao: async ({ page, mock }) => {
        mock.estado().cenario = 'atencao'
        await page.reload()
        await page.getByText('precisam de atenção').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div[class*="border-amber-500/30"]', numero: 'esquerda' },
        { por: 'css', nome: 'a:text-is("Gerenciar") >> nth=0', numero: 'abaixo' },
      ],
    },
  ],
}
