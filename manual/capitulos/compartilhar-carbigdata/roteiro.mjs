// roteiro.mjs - capitulo de compartilhamento com o parceiro (2 passos): onde copiar o link HLS da camera.
// Usa a camera "Estacionamento" (plano Basico, como a maioria de quem compartilha o link). Dados 100 % ficticios.
// O nome do parceiro aparece so no texto.md (escrito para o cliente); roteiro e prints nao o citam.

const CAMERA = 'Estacionamento'
const GERENCIAR = { por: 'css', nome: `li:has-text("${CAMERA}") a:has-text("Gerenciar")` }

export default {
  id: 'compartilhar-carbigdata',
  titulo: 'Compartilhar com o parceiro',
  passos: [
    {
      id: 'gerenciar', titulo: 'Abrir a câmera', contexto: 'logado', ir: '/painel/cameras',
      legenda: 'Na lista de câmeras, clique em "Gerenciar" na câmera que você vai compartilhar.',
      destacar: [GERENCIAR],
    },
    {
      id: 'link-hls', titulo: 'Copiar o link HLS', contexto: 'logado',
      legenda: 'Na aba "Transmissão", o link HLS fica em "URL HLS pública" e termina em .m3u8. Use o botão "Copiar".',
      acao: async ({ page, loc }) => {
        await (await loc(GERENCIAR)).click()
        await (await loc({ papel: 'button', nome: 'Transmissão' })).click()
        await page.getByText('Câmera pública: funciona direto.').first().waitFor()
      },
      destacar: [
        { por: 'texto', nome: 'https://play.livebybit.com/v2/hls/' },
        { por: 'css', nome: 'button:has-text("Copiar") >> nth=1', numero: 'direita' },
      ],
    },
  ],
}
