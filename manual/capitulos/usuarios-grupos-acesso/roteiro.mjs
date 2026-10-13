// roteiro.mjs - capitulo "Usuários: Grupos de acesso" (4 passos): lista, editar um grupo, ajuste fino e resumo.
// Grupos, pessoas e cameras inventados; nada e gravado fora do mock.
export default {
  id: 'usuarios-grupos-acesso',
  titulo: 'Usuários: Grupos de acesso',
  passos: [
    {
      id: 'lista', titulo: 'A aba Grupos de acesso', contexto: 'logado', ir: '/painel/usuarios',
      legenda: 'Na aba Grupos de acesso você monta grupos de câmeras e escolhe quem enxerga cada um.',
      acao: async ({ page }) => {
        await page.getByRole('button', { name: 'Grupos de acesso', exact: true }).click()
        await page.getByText('Equipe da loja').first().waitFor()
        await page.locator('input[placeholder^="Nome do novo grupo"]').fill('Equipe da obra')
      },
      destacar: [
        { por: 'css', nome: 'input[placeholder^="Nome do novo grupo"]', numero: 'esquerda' },
        { papel: 'button', nome: 'Criar grupo', numero: 'direita' },
        { papel: 'button', nome: 'Ajuste fino por convidado', numero: 'esquerda' },
        { papel: 'button', nome: 'Resumo de acessos', numero: 'direita' },
        { por: 'css', nome: 'button:has-text("Equipe da loja")', numero: 'esquerda' },
      ],
    },
    {
      id: 'editar-grupo', titulo: 'Editar um grupo de acesso', contexto: 'logado',
      legenda: 'Marque as câmeras do grupo e as pessoas que podem vê-las. Depois, clique em Salvar grupo.',
      acao: async ({ page }) => {
        await page.locator('button:has-text("Equipe da loja")').click()
        await page.getByText('Câmeras deste grupo').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.max-h-64', numero: 'esquerda' },
        { por: 'css', nome: 'div.mb-4.flex.flex-wrap.gap-2', numero: 'esquerda' },
        { papel: 'button', nome: 'Salvar grupo', numero: 'abaixo' },
        { papel: 'button', nome: 'Excluir grupo', numero: 'esquerda' },
      ],
    },
    {
      id: 'ajuste-fino', titulo: 'Ajuste fino por convidado', contexto: 'logado',
      legenda: 'Libere câmeras avulsas direto para uma pessoa, além dos grupos dela. Câmeras que ela já vê por um grupo aparecem marcadas.',
      acao: async ({ page }) => {
        await page.getByText('‹ Voltar').first().click()
        await page.getByRole('button', { name: 'Ajuste fino por convidado' }).click()
        await page.getByText('Libere câmeras avulsas').first().waitFor()
        await page.locator('label:has-text("Estacionamento")').click()
        await page.getByRole('button', { name: 'Salvar liberações' }).click()
        await page.getByText('✓ Salvo').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'select', numero: 'esquerda' },
        { por: 'css', nome: 'div:has(> span:has-text("já vê pelo grupo"))', numero: 'esquerda' },
        { por: 'css', nome: 'label:has-text("Estacionamento")', numero: 'direita' },
        { papel: 'button', nome: 'Salvar liberações', numero: 'abaixo' },
      ],
    },
    {
      id: 'resumo', titulo: 'Resumo de acessos', contexto: 'logado',
      legenda: 'O resumo mostra, para cada convidado, todas as câmeras que ele enxerga somando grupos e liberações avulsas.',
      acao: async ({ page }) => {
        await page.getByText('‹ Voltar').first().click()
        await page.getByRole('button', { name: 'Resumo de acessos' }).click()
        await page.getByText('O que cada convidado enxerga').first().waitFor()
        await page.getByText('Estacionamento').first().waitFor()
      },
      destacar: [
        { por: 'css', nome: 'div.rounded-lg:has(> p:text-is("funcionario@exemplo.com"))', numero: 'esquerda' },
      ],
    },
  ],
}
