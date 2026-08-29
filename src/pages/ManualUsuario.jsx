import { useState } from 'react'

const MANUAL_URL = 'https://painel.livebybit.com/LiveByBit-Manual-Usuario-v2.pdf'
const VERSAO = 'V2'
const ATUALIZADO_EM = '29/08/2026'

export default function ManualUsuario() {
  const [copiado, setCopiado] = useState(false)

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(MANUAL_URL)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Manual do Usuário</h1>
      <p className="mt-1 text-sm text-slate-400">Versão {VERSAO} · Atualizado em {ATUALIZADO_EM}</p>

      <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/60 p-6">
        <p className="text-sm text-slate-300">
          Este manual explica como usar o painel do LiveByBit: cadastro de câmeras, transmissão para o YouTube,
          grupos, segurança, faturamento e muito mais. Baixe o PDF ou copie o link para enviar a alguém da sua equipe.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer" download className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400">
            Baixar manual (PDF)
          </a>

          <button
            onClick={copiarLink}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            {copiado ? 'Link copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </main>
  )
}
