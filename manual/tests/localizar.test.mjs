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

// ---- alvos por texto e por CSS (elementos sem "papel") ----
function paginaPorTextoCss({ textos = {}, css = {} } = {}) {
  const loc = (n, chave) => ({ _chave: chave, count: async () => n, first() { return { _primeiro: chave } } })
  return {
    getByText: (t) => loc(textos[t] ?? 0, `texto:${t}`),
    locator: (sel) => loc(css[sel] ?? 0, `css:${sel}`),
  }
}

test('localizar por texto: 1 resultado ok; 0 => quebra sem fuzzy; varios => quebra salvo primeiro', async () => {
  const rel = relatorioEspiao()
  const ctx = { relatorio: rel, capitulo: 'c', passo: 'p' }
  const pagina = paginaPorTextoCss({ textos: { 'Link enviado': 1, 'Stream key': 2 } })
  assert.equal((await localizar(pagina, { por: 'texto', nome: 'Link enviado' }, ctx))._chave, 'texto:Link enviado')
  await assert.rejects(localizar(pagina, { por: 'texto', nome: 'Nada' }, ctx), (e) => e.motivo === 'nenhum')
  await assert.rejects(localizar(pagina, { por: 'texto', nome: 'Stream key' }, ctx), (e) => e.motivo === 'ambiguo')
  assert.equal((await localizar(pagina, { por: 'texto', nome: 'Stream key', primeiro: true }, ctx))._primeiro, 'texto:Stream key')
  assert.equal(rel.chamadas.length, 0)
})

test('localizar por css: usa locator(seletor) com as mesmas regras', async () => {
  const ctx = { relatorio: relatorioEspiao(), capitulo: 'c', passo: 'p' }
  const pagina = paginaPorTextoCss({ css: { iframe: 1, dl: 0 } })
  assert.equal((await localizar(pagina, { por: 'css', nome: 'iframe' }, ctx))._chave, 'css:iframe')
  await assert.rejects(localizar(pagina, { por: 'css', nome: 'dl' }, ctx), (e) => e.motivo === 'nenhum')
})

test('localizar espera o elemento exato aparecer (tela carregando) antes de tentar o autoajuste', async () => {
  const rel = relatorioEspiao()
  let consultas = 0
  const pagina = {
    getByRole(papel, opcoes) {
      if (opcoes && opcoes.name !== undefined) {
        return { _chave: `${papel}:${opcoes.name}`, count: async () => (++consultas >= 3 ? 1 : 0), first() { return this } }
      }
      return { all: async () => [elemento('Outra coisa')] }
    },
  }
  const loc = await localizar(pagina, { papel: 'button', nome: 'Transmissão' },
    { relatorio: rel, capitulo: 'c', passo: 'p', espera: 2000 })
  assert.equal(loc._chave, 'button:Transmissão')
  assert.ok(consultas >= 3)
  assert.equal(rel.chamadas.length, 0)                     // apareceu sozinho: nao houve ajuste
})

test('localizar sem espera (padrao dos testes) nao demora e cai no autoajuste/quebra', async () => {
  const pagina = paginaFalsa({ elementos: { button: ['Mapa'] } })
  const t0 = Date.now()
  await assert.rejects(localizar(pagina, { papel: 'button', nome: 'Transmissão' }, { relatorio: relatorioEspiao(), capitulo: 'c', passo: 'p' }))
  assert.ok(Date.now() - t0 < 500)
})

test('localizar: varios resultados exatos => quebra, salvo alvo.primeiro', async () => {
  const pagina = paginaFalsa({ exatos: { 'link:Gerenciar': 2 } })
  const ctx = { relatorio: relatorioEspiao(), capitulo: 'c', passo: 'p' }
  await assert.rejects(localizar(pagina, { papel: 'link', nome: 'Gerenciar' }, ctx), (e) => e.motivo === 'ambiguo')
  const loc = await localizar(pagina, { papel: 'link', nome: 'Gerenciar', primeiro: true }, ctx)
  assert.equal(loc._primeiro, 'link:Gerenciar')
})
