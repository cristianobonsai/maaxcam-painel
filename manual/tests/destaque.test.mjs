import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularCaixa, destacarEFotografar } from '../robo/destaque.mjs'

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
