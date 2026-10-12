import { useMemo, useState } from 'react'
import { mdParaHtml } from '../manual/markdown.js'
import capitulos from '../manual/capitulos.json'

// Textos dos capítulos (Markdown) e prints gerados pelo robô do manual (public/manual/img).
// Para atualizar: rodar o robô (manual/), publicar e fazer o deploy do painel. Ver docs do projeto.
const textos = import.meta.glob('../manual/*.md', { query: '?raw', import: 'default', eager: true })
const PDF_ANTIGO = 'https://painel.livebybit.com/LiveByBit-Manual-Usuario-v2.pdf'

const ESTILO = `
.manual-conteudo h1 { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 .75rem; }
.manual-conteudo h2 { font-size: 1.2rem; font-weight: 600; color: #fff; margin: 2rem 0 .5rem; }
.manual-conteudo h3 { font-size: 1.05rem; font-weight: 600; color: #fff; margin: 1.5rem 0 .4rem; }
.manual-conteudo p { margin: .6rem 0; color: #cbd5e1; line-height: 1.65; }
.manual-conteudo ul, .manual-conteudo ol { margin: .6rem 0 .6rem 1.4rem; color: #cbd5e1; line-height: 1.7; }
.manual-conteudo ul { list-style: disc; }
.manual-conteudo ol { list-style: decimal; }
.manual-conteudo strong { color: #fff; }
.manual-conteudo code { background: #0f172a; padding: 1px 6px; border-radius: 4px; }
.manual-conteudo a { color: #60a5fa; text-decoration: underline; }
.manual-conteudo img.manual-img { display: block; max-width: 100%; border: 1px solid #334155; border-radius: 10px; margin: .9rem 0; }
`

export default function ManualUsuario() {
  const disponiveis = capitulos.filter((c) => typeof textos[`../manual/${c.id}.md`] === 'string')
  const [atual, setAtual] = useState(disponiveis[0]?.id ?? null)
  const md = atual ? textos[`../manual/${atual}.md`] : ''
  const html = useMemo(() => mdParaHtml(md), [md])

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
      <style>{ESTILO}</style>
      <h1 className="font-display text-2xl font-bold text-white">Manual do Usuário</h1>
      <p className="mt-1 text-sm text-slate-400">Como usar o painel do LiveByBit, passo a passo.</p>

      {disponiveis.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 p-6 text-sm text-slate-300">
          Nenhum capítulo disponível ainda.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <nav className="md:w-56 md:shrink-0" aria-label="Capítulos do manual">
            <ul className="flex flex-wrap gap-2 md:flex-col">
              {disponiveis.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setAtual(c.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                      atual === c.id
                        ? 'bg-blue-500/10 text-white border-l-2 border-blue-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'
                    }`}
                  >
                    {c.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <article
            className="manual-conteudo min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800/60 p-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Precisa da versão anterior?{' '}
        <a href={PDF_ANTIGO} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">Manual em PDF (v2)</a>
      </p>
    </main>
  )
}
