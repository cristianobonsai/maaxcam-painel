import { LogoMark } from "./Nav.jsx";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="font-display font-semibold text-white">
            Maax<span className="text-blue-400">Cam</span>
          </span>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Fase 1 — Fundação no ar
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} LiveByBit · painel.livebybit.com
        </p>
      </div>
    </footer>
  );
}
