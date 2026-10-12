import test from 'node:test'
import assert from 'node:assert/strict'
import { criarRelatorio } from '../robo/relatorio.mjs'

test('relatorio vazio: sem quebra e sem capitulos para revisar', () => {
  const r = criarRelatorio()
  assert.equal(r.temQuebra(), false)
  assert.deepEqual(r.capitulosParaRevisar(), [])
  assert.match(r.toMarkdown(), /Relatório do robô do Manual/)
})

test('ajuste vai ao markdown e marca o capitulo para revisar (sem quebrar)', () => {
  const r = criarRelatorio()
  r.ok('primeiros-passos', 'entrar', 'print salvo')
  r.ajuste('primeiros-passos', 'lista', 'Adicionar câmera', 'Nova câmera')
  assert.equal(r.temQuebra(), false)
  assert.deepEqual(r.capitulosParaRevisar(), ['primeiros-passos'])
  const md = r.toMarkdown()
  assert.ok(md.includes('"Adicionar câmera" → "Nova câmera"'))
  assert.match(md, /primeiros-passos\/lista/)
})

test('quebra e api sem dado: temQuebra true, aparecem no markdown e no capitulo a revisar', () => {
  const r = criarRelatorio()
  r.quebra('primeiros-passos', 'formulario', 'elemento não encontrado: Criar câmera', 'falhas/formulario.png')
  r.apiSemDado('primeiros-passos', 'criada', 'GET', '/api/xyz')
  assert.equal(r.temQuebra(), true)
  const md = r.toMarkdown()
  assert.ok(md.includes('GET /api/xyz'))
  assert.ok(md.includes('falhas/formulario.png'))
  assert.deepEqual(r.capitulosParaRevisar(), ['primeiros-passos'])
})
