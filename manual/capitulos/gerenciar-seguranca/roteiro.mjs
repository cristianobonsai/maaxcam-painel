// roteiro.mjs - capitulo "Gerenciar: Segurança" (3 passos). Usa a camera "Entrada"; muda para Privado e adiciona
// um dominio, um IP e um token (tudo ficticio, so no estado do robo). Nada sai do computador.

const CARD = (titulo) => `section:has(h2:text-is("${titulo}"))`
const DOMINIOS = 'Domínios autorizados (sites)'
const IPS = 'IPs / faixas autorizadas (servidores)'
const TOKENS = 'Tokens permanentes (HLS em outros servidores)'

export default {
  id: 'gerenciar-seguranca',
  titulo: 'Gerenciar: Segurança',
  passos: [
    {
      id: 'publico', titulo: 'Público ou privado', contexto: 'logado', ir: '/painel/cameras/MAADEMO1/seguranca',
      legenda: 'Na aba Segurança você escolhe se qualquer pessoa pode assistir (Público) ou só quem você liberar (Privado).',
      acao: async ({ page, loc }) => {
        await (await loc({ papel: 'button', nome: 'Segurança' })).click()
        await page.getByText('Privacidade').first().waitFor()
      },
      destacar: [
        { papel: 'button', nome: 'Público', numero: 'abaixo' },
        { papel: 'button', nome: 'Privado', numero: 'abaixo' },
        { por: 'css', nome: 'p:has-text("Público: qualquer pessoa")', numero: 'direita' },
      ],
    },
    {
      id: 'privado', titulo: 'Os controles do modo Privado', contexto: 'logado',
      legenda: 'Ao escolher Privado aparecem três quadros: domínios (sites), IPs (servidores) e tokens.',
      acao: async ({ page, loc }) => {
        await (await loc({ papel: 'button', nome: 'Privado' })).click()
        await page.getByText('Domínios autorizados').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: CARD('Privacidade'), numero: 'esquerda' },
        { por: 'css', nome: CARD(DOMINIOS), numero: 'esquerda' },
        { por: 'css', nome: CARD(IPS), numero: 'esquerda' },
        { por: 'css', nome: CARD(TOKENS), numero: 'esquerda' },
      ],
    },
    {
      id: 'liberar', titulo: 'Liberar o acesso', contexto: 'logado',
      legenda: 'Adicione o domínio do seu site, o IP do seu servidor e gere um token com o link HLS para usar fora.',
      acao: async ({ page }) => {
        await page.locator('input[placeholder="exemplo.com.br"]').fill('exemplo.com.br')
        await page.locator(`${CARD(DOMINIOS)} button:text-is("Adicionar")`).click()
        await page.locator('li:has-text("exemplo.com.br")').first().waitFor()
        await page.locator('input[placeholder="203.0.113.0/24"]').fill('203.0.113.0/24')
        await page.locator('input[placeholder="rótulo (opcional)"]').fill('Escritório')
        await page.locator(`${CARD(IPS)} button:text-is("Adicionar")`).click()
        await page.locator('li:has-text("Escritório")').first().waitFor()
        await page.locator('input[placeholder^="rótulo (ex.:"]').fill('Servidor A')
        await page.locator(`${CARD(TOKENS)} button:text-is("Gerar token")`).click()
        await page.locator('li:has-text("Servidor A")').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'li:has-text("exemplo.com.br") >> nth=0', numero: 'esquerda' },
        { por: 'css', nome: 'li:has-text("Escritório") >> nth=0', numero: 'esquerda' },
        { por: 'css', nome: 'li:has-text("Servidor A") >> nth=0', numero: 'esquerda' },
      ],
    },
  ],
}
