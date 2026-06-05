import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

function LogoMark({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#3b82f6" />
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#g)" fillOpacity="0.5" />
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="white" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2.4" fill="white" />
      <defs>
        <linearGradient id="g" x1="2" y1="2" x2="30" y2="30">
          <stop stopColor="white" stopOpacity="0.35" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Nav() {
  const { session } = useAuth();

  return (
    <header className="reveal reveal-1 sticky top-0 z-30 border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/40">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#" className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Maax<span className="text-blue-400">Cam</span>
          </span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#recursos" className="text-sm text-slate-300 transition-colors hover:text-white">Recursos</a>
          <a href="#planos" className="text-sm text-slate-300 transition-colors hover:text-white">Planos</a>
          <a href="#" className="text-sm text-slate-300 transition-colors hover:text-white">Documentação</a>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              to="/painel"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600"
            >
              Painel
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-white sm:block"
              >
                Entrar
              </Link>
              <Link
                to="/login"
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-600"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export { LogoMark };
