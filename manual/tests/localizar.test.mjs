import test from 'node:test'
import assert from 'node:assert/strict'
import { similaridade, escolherCandidato, localizar, ErroPassoQuebrado } from '../robo/localizar.mjs'

test('similaridade ignora caixa, acento e espacos', () => {
  assert.equal(similaridade('Nova câmera', 'nova camera'), 1)
  assert.equal(similaridade('  Nova   câmera ', 'Nova câmera'), 1)
  assert.ok(similaridade('Adicionar câmera', 'Nova câmera') < 0.7)
  assert.ok(similaridade('Nova câmera', 'Nova câmera!') >= 0.9)
})

test('escolherCandidato: exato, unico, ambiguo e nenhum', () => {
  assert.deepEqual(escolherCandidato('Nova câmera', ['Atualizar', 'Nova câmera']),
    { indice: 1, motivo: 'exato', pontuacao: 1 })
  const unico = escolherCandidato('Nova câmera', ['Nova camera 2', 'Mapa'])
  assert.equal(unico.indice, 0)
  assert.equal(unico.motivo, 'unico')
  const amb = escolherCandidato('Nova câmera', ['Nova câmera A', 'Nova câmera B'])
  assert.equal(amb.indice, null)
  assert.equal(amb.motivo, 'ambiguo')
  const nada = escolherCandidato('Nova câmera', ['Mapa', 'Sair'])
  assert.equal(nada.indice, null)
  assert.equal(nada.motivo, 'nenhum')
  assert.equal(escolherCandidato('X', ['X', 'X']).motivo, 'ambiguo')          // duplicata exata nao e adivinhada
})

// ---- pagina falsa (so o que o localizador usa do Playwright) ----
function elemento(texto, visivel = true) {
  return { texto, innerText: async () => texto, isVisible: async () => visivel, getAttribute: async () => null }
}
function paginaFalsa({ exatos = {}, elementos = {} } = {}) {
  return {
    getByRole(papel, opcoes) {
      if (opcoes && opcoes.name !== undefined) {
        const chave = `${papel}:${opcoes.name}`
        const n = exatos[chave] ?? 0
        return { _chave: chave, count: async () => n, first() { return { _primeiro: chave } } }
      }
      return { all: async () => (elementos[papel] || []).map((t) => elemento(t)) }
    },
  }
}
function relatorioEspiao() {
  const chamadas = []
  return { chamadas, ajuste: (...a) => chamadas.push(a) }
}

test('localizar: exato (1 resultado) nao gera ajuste', async () => {
  const rel = relatorioEspiao()
  const loc = await localizar(paginaFalsa({ exatos: { 'button:Nova câmera': 1 } }),
    { papel: 'button', nome: 'Nova câmera' }, { relatorio: rel, capitulo: 'c', passo: 'p' })
  assert.equal(loc._chave, 'button:Nova câmera')
  assert.equal(rel.chamadas.length, 0)
})

test('localizar: botao renomeado com 1 candidato parecido => ajusta e relata', async () => {
  const rel = relatorioEspiao()
  const pagina = paginaFalsa({ elementos: { button: ['Atualizar', 'Nova camera 2', 'Mapa'] } })
  const loc = await localizar(pagina, { papel: 'button', nome: 'Nova câmera' }, { relatorio: rel, capitulo: 'primeiros-passos', passo: 'lista' })
  assert.equal(loc.texto, 'Nova camera 2')
  assert.deepEqual(rel.chamadas, [['primeiros-passos', 'lista', 'Nova câmera', 'Nova camera 2']])
})

test('localizar: alternativas explicitas sao tentadas antes do fuzzy e tambem sao relatadas', async () => {
  const rel = relatorioEspiao()
  const pagina = paginaFalsa({ exatos: { 'button:Novo equipamento': 1 } })
  const loc = await localizar(pagina, { papel: 'button', nome: 'Nova câmera', alternativas: ['Novo equipamento'] },
    { relatorio: rel, capitulo: 'c', passo: 'p' })
  assert.equal(loc._chave, 'button:Novo equipamento')
  assert.deepEqual(rel.chamadas, [['c', 'p', 'Nova câmera', 'Novo equipamento']])
})

test('localizar: nenhum candidato => quebra com capitulo, passo e motivo', async () => {
  const pagina = paginaFalsa({ elementos: { button: ['Mapa', 'Sair'] } })
  await assert.rejects(
    localizar(pagina, { papel: 'button', nome: 'Nova câmera' }, { relatorio: relatorioEspiao(), capitulo: 'cap', passo: 'pas' }),
    (e) => e instanceof ErroPassoQuebrado && e.capitulo === 'cap' && e.passo === 'pas' && e.motivo === 'nenhum',
  )
})

test('localizar: dois candidatos parecidos => quebra (nao adivinha)', async () => {
  const pagina = paginaFalsa({ elementos: { button: ['Nova câmera A', 'Nova câmera B'] } })
  await assert.rejects(
    localizar(pagina, { papel: 'button', nome: 'Nova câmera' }, { relatorio: relatorioEspiao(), capitulo: 'c', passo: 'p' }),
    (e) => e instanceof ErroPassoQuebrado && e.motivo === 'ambiguo',
  )
})

test('localizar: varios resultados exatos => quebra, salvo alvo.primeiro', async () => {
  const pagina = paginaFalsa({ exatos: { 'link:Gerenciar': 2 } })
  const ctx = { relatorio: relatorioEspiao(), capitulo: 'c', passo: 'p' }
  await assert.rejects(localizar(pagina, { papel: 'link', nome: 'Gerenciar' }, ctx), (e) => e.motivo === 'ambiguo')
  const loc = await localizar(pagina, { papel: 'link', nome: 'Gerenciar', primeiro: true }, ctx)
  assert.equal(loc._primeiro, 'link:Gerenciar')
})
