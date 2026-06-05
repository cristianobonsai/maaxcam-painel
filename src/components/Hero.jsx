export default function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
      <div className="reveal reveal-1 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3.5 py-1.5 text-xs font-medium text-slate-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        Transmissão ao vivo, sem travamentos
      </div>

      <h1 className="reveal reveal-2 font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
        Suas câmeras,
        <br className="hidden sm:block" />
        <span className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          {" "}ao vivo no YouTube
        </span>
      </h1>

      <p className="reveal reveal-3 mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
        Transmita grupos de câmeras em rotação contínua, com áudio em loop e
        monitoramento automático. Infraestrutura pronta — você só gerencia pelo painel.
      </p>

      <div className="reveal reveal-4 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button className="w-full rounded-md bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-600 sm:w-auto">
          Começar agora
        </button>
        <button className="w-full rounded-md border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-white sm:w-auto">
          Ver demonstração
        </button>
      </div>

      <p className="reveal reveal-5 mt-5 text-xs text-slate-500">
        Sem cartão de crédito · Cadastro aberto · Cancele quando quiser
      </p>
    </section>
  );
}
