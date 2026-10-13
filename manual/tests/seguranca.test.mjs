import test from 'node:test'
import assert from 'node:assert/strict'
import { exigirLocalhost, decidirRequisicao, varrerTexto, HOSTS_ESTATICOS } from '../robo/seguranca.mjs'

const CTX = {
  appOrigin: 'http://localhost:4173',
  apiHost: 'api-demo.invalid',
  playHost: 'play.livebybit.com',
  authHost: 'qtvrzdwgfeomzahtjwpz.supabase.co',
}

test('exigirLocalhost aceita localhost e 127.0.0.1', () => {
  exigirLocalhost('http://localhost:4173')
  exigirLocalhost('http://127.0.0.1:4173')
  exigirLocalhost('http://[::1]:4173')
})

test('exigirLocalhost recusa qualquer outro host', () => {
  assert.throws(() => exigirLocalhost('https://painel.livebybit.com'), /localhost/)
  assert.throws(() => exigirLocalhost('http://qa.example.com'), /localhost/)
  assert.throws(() => exigirLocalhost('http://localhost.evil.com'), /localhost/)
})

test('decidirRequisicao: app, mock, estatico e abortar', () => {
  assert.equal(decidirRequisicao('http://localhost:4173/painel', 'GET', CTX), 'app')
  assert.equal(decidirRequisicao('https://api-demo.invalid/api/me', 'GET', CTX), 'mock')
  assert.equal(decidirRequisicao('https://api-demo.invalid/api/cameras', 'POST', CTX), 'mock')
  assert.equal(decidirRequisicao('https://play.livebybit.com/embed/x', 'GET', CTX), 'mock')
  assert.equal(decidirRequisicao('https://qtvrzdwgfeomzahtjwpz.supabase.co/auth/v1/otp', 'POST', CTX), 'mock')
  assert.equal(decidirRequisicao('https://qtvrzdwgfeomzahtjwpz.supabase.co/auth/v1/token', 'POST', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://qtvrzdwgfeomzahtjwpz.supabase.co/auth/v1/otp', 'GET', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://fonts.gstatic.com/x.woff2', 'GET', CTX), 'estatico')
  assert.equal(decidirRequisicao('https://fonts.gstatic.com/x.woff2', 'POST', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://api.livebybit.com/api/me', 'GET', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://exemplo.com/', 'GET', CTX), 'abortar')
})

test('decidirRequisicao: data/blob ficam no app e hosts estaticos sao os esperados', () => {
  assert.equal(decidirRequisicao('data:image/png;base64,AAAA', 'GET', CTX), 'app')
  assert.equal(decidirRequisicao('blob:http://localhost:4173/abc', 'GET', CTX), 'app')
  assert.deepEqual(HOSTS_ESTATICOS, ['fonts.googleapis.com', 'fonts.gstatic.com', 'unpkg.com', 'tile.openstreetmap.org'])
})

test('mapa: so o servidor de tiles do OpenStreetMap passa, so GET (imagens do mapa; nenhum dado nosso vai junto)', () => {
  assert.equal(decidirRequisicao('https://tile.openstreetmap.org/12/1453/2430.png', 'GET', CTX), 'estatico')
  assert.equal(decidirRequisicao('https://tile.openstreetmap.org/12/1453/2430.png', 'POST', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://nominatim.openstreetmap.org/search?q=x', 'GET', CTX), 'abortar')
  assert.equal(decidirRequisicao('https://tile.openstreetmap.org.evil.com/1.png', 'GET', CTX), 'abortar')
})

test('varrerTexto: texto limpo nao tem violacao', () => {
  assert.deepEqual(varrerTexto('cliente@exemplo.com, 203.0.113.9, rtmp://ingest.livebybit.com/live/demo-AbC'), [])
})

test('varrerTexto: plural e variacoes das palavras proibidas tambem sao acusados', () => {
  for (const t of ['leitura de placas', 'Placas', 'ALPR', 'alpr', 'LPRs'.replace('s', '')]) {
    assert.ok(varrerTexto(t).length >= 1, t)
  }
  assert.deepEqual(varrerTexto('A aplicação mostra a replicação.'), [])        // sem falso positivo em palavras comuns
})

test('varrerTexto: acusa e-mail real, IP real, chave do supabase e palavras proibidas', () => {
  assert.equal(varrerTexto('joao@gmail.com').length, 1)
  assert.equal(varrerTexto('177.138.193.187').length, 1)
  assert.equal(varrerTexto('sb_publishable_xxx').length, 1)
  for (const palavra of ['leitura de placa', 'LPR', 'Carbigdata', 'carbigdata']) {
    assert.ok(varrerTexto(palavra).length >= 1, palavra)
  }
})

test('varrerTexto: "permitir" libera SO a palavra pedida (texto do capitulo da Carbigdata)', () => {
  const texto = 'Envie o link para a Carbigdata.'
  assert.equal(varrerTexto(texto).length, 1)                                          // padrao: continua proibida
  assert.deepEqual(varrerTexto(texto, { permitir: ['carbigdata'] }), [])
  assert.deepEqual(varrerTexto('carbigdata CARBIGDATA', { permitir: ['carbigdata'] }), [])   // sem diferenciar maiuscula
  assert.equal(varrerTexto('A Carbigdata le placas', { permitir: ['carbigdata'] }).length, 1)  // placa segue proibida
  assert.equal(varrerTexto('Carbigdata e LPR', { permitir: ['carbigdata'] }).length, 1)
  assert.equal(varrerTexto('joao@gmail.com Carbigdata', { permitir: ['carbigdata'] }).length, 1) // o resto da varredura vale
})
