import { useEffect, useMemo, useState } from 'react'
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
.manual-conteudo p, .manual-conteudo ul, .manual-conteudo ol { max-width: 78ch; }
.manual-conteudo img.manual-img { display: block; width: 100%; height: auto; border: 1px solid #334155; border-radius: 10px; margin: 1rem 0 1.5rem; cursor: zoom-in; }
`

export default function ManualUsuario() {
  const disponiveis = capitulos.filter((c) => typeof textos[`../manual/${c.id}.md`] === 'string')
  const [atual, setAtual] = useState(disponiveis[0]?.id ?? null)
  const md = atual ? textos[`../manual/${atual}.md`] : ''
  const html = useMemo(() => mdParaHtml(md), [md])
  const [zoom, setZoom] = useState(null)

  // clique no print abre em tamanho grande; clique ou Esc fecha
  useEffect(() => {
    if (!zoom) return undefined
    const fechar = (e) => { if (e.key === 'Escape') setZoom(null) }
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [zoom])

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-8">
      <style>{ESTILO}</style>
      <h1 className="font-display text-2xl font-bold text-white">Manual do Usuário</h1>
      <p className="mt-1 text-sm text-slate-400">Como usar o painel do LiveByBit, passo a passo.</p>

      {disponiveis.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 p-6 text-sm text-slate-300">
          Nenhum capítulo disponível ainda.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <nav aria-label="Capítulos do manual">
            <ul className="flex flex-wrap gap-2">
              {disponiveis.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setAtual(c.id)}
                    aria-current={atual === c.id ? 'page' : undefined}
                    className={`rounded-lg px-4 py-2 text-sm font-medium border ${
                      atual === c.id
                        ? 'bg-blue-500/10 text-white border-blue-500'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    {c.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <article
            className="manual-conteudo min-w-0 rounded-lg border border-slate-700 bg-slate-800/60 p-6 sm:p-8"
            onClick={(e) => { if (e.target.tagName === 'IMG') setZoom(e.target.src) }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-label="Print ampliado"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-3"
        >
          <img src={zoom} alt="" className="max-h-[96vh] max-w-[98vw] rounded-lg border border-slate-600" />
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500">
        Precisa da versão anterior?{' '}
        <a href={PDF_ANTIGO} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">Manual em PDF (v2)</a>
      </p>
    </main>
  )
}
