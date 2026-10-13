import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularCaixa, destacarEFotografar, posicaoNumero } from '../robo/destaque.mjs'

const TELA = { largura: 1440, altura: 900 }

test('posicaoNumero: esquerda (padrao), direita, acima e abaixo, relativas a caixa', () => {
  const caixa = { left: 300, top: 300, width: 200, height: 40 }
  assert.deepEqual(posicaoNumero(caixa, undefined, TELA), { left: -32, top: 7 })        // esquerda, centrado na altura
  assert.deepEqual(posicaoNumero(caixa, 'esquerda', TELA), { left: -32, top: 7 })
  assert.deepEqual(posicaoNumero(caixa, 'direita', TELA), { left: 206, top: 7 })
  assert.deepEqual(posicaoNumero(caixa, 'acima', TELA), { left: 4, top: -30 })
  assert.deepEqual(posicaoNumero(caixa, 'abaixo', TELA), { left: 4, top: 44 })
})

test('posicaoNumero: se sairia da tela, troca de lado sozinho', () => {
  assert.equal(posicaoNumero({ left: 6, top: 300, width: 200, height: 40 }, 'esquerda', TELA).left, 206)   // vai para a direita
  assert.equal(posicaoNumero({ left: 300, top: 3, width: 200, height: 40 }, 'acima', TELA).top, 44)        // vai para baixo
  assert.equal(posicaoNumero({ left: 1300, top: 300, width: 130, height: 40 }, 'direita', TELA).left, -32) // vai para a esquerda
  assert.equal(posicaoNumero({ left: 300, top: 880, width: 200, height: 40 }, 'abaixo', TELA).top, -30)    // vai para cima
})

test('calcularCaixa aplica margem e nunca fica negativa', () => {
  assert.deepEqual(calcularCaixa({ x: 2, y: 3, width: 100, height: 20 }, 6), { left: 0, top: 0, width: 112, height: 32 })
  assert.deepEqual(calcularCaixa({ x: 50, y: 40, width: 10, height: 10 }, 4), { left: 46, top: 36, width: 18, height: 18 })
})

function paginaFalsa() {
  const eventos = []
  return {
    eventos,
    evaluate: async (fn, arg) => { eventos.push({ tipo: 'evaluate', arg }) },
    screenshot: async (opcoes) => { eventos.push({ tipo: 'screenshot', opcoes }) },
  }
}
const alvo = (box) => ({ boundingBox: async () => box })

test('destacarEFotografar: desenha numerado, fotografa e remove', async () => {
  const pagina = paginaFalsa()
  await destacarEFotografar(pagina, {
    alvos: [alvo({ x: 10, y: 10, width: 100, height: 30 }), alvo({ x: 200, y: 50, width: 80, height: 20 })],
    arquivo: 'saida/x.png', numeros: true,
  })
  assert.deepEqual(pagina.eventos.map((e) => e.tipo), ['evaluate', 'screenshot', 'evaluate'])
  const desenho = pagina.eventos[0].arg
  assert.equal(desenho.caixas.length, 2)
  assert.equal(desenho.numeros, true)
  assert.ok(desenho.caixas.every((c) => typeof c.numero.left === 'number' && typeof c.numero.top === 'number'))
  assert.equal(pagina.eventos[1].opcoes.path, 'saida/x.png')
})

test('destacarEFotografar: elemento sem posicao (invisivel) falha com mensagem clara', async () => {
  await assert.rejects(
    destacarEFotografar(paginaFalsa(), { alvos: [alvo(null)], arquivo: 'x.png', numeros: true }),
    /sem posição/,
  )
})

test('destacarEFotografar: remove os destaques mesmo se o print falhar', async () => {
  const eventos = []
  const pagina = {
    evaluate: async (fn, arg) => { eventos.push(arg === undefined ? 'remover' : 'desenhar') },
    screenshot: async () => { throw new Error('falhou o print') },
  }
  await assert.rejects(destacarEFotografar(pagina, { alvos: [alvo({ x: 1, y: 1, width: 5, height: 5 })], arquivo: 'x.png' }), /falhou o print/)
  assert.deepEqual(eventos, ['desenhar', 'remover'])
})
