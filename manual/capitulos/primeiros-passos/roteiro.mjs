// roteiro.mjs - capitulo "Primeiros passos" (8 passos). Cada passo: onde ir, o que fazer e o que destacar.
// Alvo: {papel, nome} | {por:'texto'|'css', nome}; opcoes: primeiro (varios resultados validos), alternativas (nomes antigos).
// Dados 100 % ficticios (cliente "Padaria Exemplo"); nada daqui chega a producao.

const EMAIL = 'cliente@exemplo.com'
const NOME_CAMERA = 'Portão da frente'
const CAMPO_EMAIL = { por: 'css', nome: 'input[type=email]' }
const BOTAO_ENVIAR = { papel: 'button', nome: 'Enviar link de acesso' }

export default {
  id: 'primeiros-passos',
  titulo: 'Primeiros passos',
  passos: [
    {
      id: 'entrar', titulo: 'Entrar no painel', contexto: 'sem-sessao', ir: '/login', viewport: { width: 760, height: 560 },
      legenda: 'Digite o seu e-mail e clique em "Enviar link de acesso". Não existe senha: você recebe um link por e-mail.',
      destacar: [CAMPO_EMAIL, BOTAO_ENVIAR],
    },
    {
      id: 'link-enviado', titulo: 'Abrir o link que chegou no e-mail', contexto: 'sem-sessao', viewport: { width: 760, height: 560 },
      legenda: 'Pronto: o painel avisa que o link foi enviado. Abra o e-mail (olhe também o spam) e clique no link para entrar.',
      acao: async ({ page, loc }) => {
        await (await loc(CAMPO_EMAIL)).fill(EMAIL)
        await (await loc(BOTAO_ENVIAR)).click()
        await page.getByText('Link enviado').first().waitFor()
      },
      destacar: [{ por: 'texto', nome: 'Link enviado' }],
    },
    {
      id: 'painel', titulo: 'Conhecer o menu', contexto: 'logado', ir: '/painel',
      legenda: 'No menu da esquerda ficam todas as áreas do painel. Para começar, abra "Câmeras".',
      destacar: [{ papel: 'link', nome: 'Câmeras', primeiro: true }],
    },
    {
      id: 'lista', titulo: 'Ver as suas câmeras', contexto: 'logado', ir: '/painel/cameras',
      legenda: 'Aqui aparecem todas as suas câmeras. Para cadastrar uma nova, clique em "Nova câmera".',
      destacar: [{ papel: 'button', nome: 'Nova câmera', numero: 'abaixo' }],
    },
    {
      id: 'formulario', titulo: 'Preencher os dados da câmera', contexto: 'logado',
      legenda: 'Dê um nome à câmera (por exemplo, o lugar onde ela fica), escolha o plano e clique em "Criar câmera".',
      acao: async ({ page, loc }) => {
        await (await loc({ papel: 'button', nome: 'Nova câmera' })).click()
        await (await loc({ papel: 'textbox', nome: /^Nome/, texto: 'Nome' })).fill(NOME_CAMERA)
      },
      destacar: [
        { papel: 'textbox', nome: /^Nome/, texto: 'Nome' },
        { papel: 'combobox', nome: /Plano desta câmera/, texto: 'Plano desta câmera', numero: 'direita' },
        { papel: 'button', nome: 'Criar câmera' },
      ],
    },
    {
      id: 'criada', titulo: 'Guardar a chave e o endereço da transmissão', contexto: 'logado',
      legenda: 'A câmera foi criada. Aqui estão a chave (Stream key) e os endereços RTMP e HLS. Você vai usá-los no equipamento.',
      acao: async ({ page, loc }) => {
        await (await loc({ papel: 'button', nome: 'Criar câmera' })).click()
        await page.getByText('Câmera criada!').first().waitFor()
      },
      destacar: [{ por: 'texto', nome: 'Câmera criada!' }, { por: 'css', nome: 'dl' }],
    },
    {
      id: 'transmissao', titulo: 'Copiar o endereço RTMP', contexto: 'logado',
      legenda: 'Na lista, clique em "Gerenciar" na câmera e abra a aba "Transmissão". Copie a URL RTMP (botão "Copiar") e cole no campo de servidor da câmera.',
      acao: async ({ page, loc }) => {
        await page.locator('li', { hasText: NOME_CAMERA }).getByRole('link', { name: 'Gerenciar' }).click()
        await (await loc({ papel: 'button', nome: 'Transmissão' })).click()
        await page.getByText('Cole isto na sua câmera IP').first().waitFor()
      },
      destacar: [{ por: 'texto', nome: 'rtmp://ingest.livebybit.com/live/' }, { papel: 'button', nome: 'Copiar', primeiro: true, numero: 'direita' }],
    },
    {
      id: 'verificar', titulo: 'Conferir se a imagem chegou', contexto: 'logado',
      legenda: 'Depois de configurar a câmera, a imagem pode levar até 3 minutos para aparecer aqui. Se aparecer, está tudo certo.',
      destacar: [{ por: 'texto', nome: 'Verificar transmissão', primeiro: true }, { por: 'css', nome: 'iframe' }],
    },
  ],
}
