function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

const plans = [
  {
    name: "Essencial",
    price: "49",
    blurb: "Para começar a transmitir.",
    highlight: false,
    features: [
      "Até 4 câmeras simultâneas",
      "Transmissão ao YouTube",
      "Áudio em loop contínuo",
      "Player público para embed",
    ],
  },
  {
    name: "Profissional",
    price: "129",
    blurb: "O mais escolhido por quem opera grupos.",
    highlight: true,
    features: [
      "Até 10 câmeras simultâneas",
      "Grupos em rotação automática",
      "Troca de áudio sem cortar o vídeo",
      "Monitoramento com auto-restart",
      "Suporte prioritário",
    ],
  },
  {
    name: "Estúdio",
    price: "299",
    blurb: "Operação multi-canal em escala.",
    highlight: false,
    features: [
      "Múltiplos grupos e canais",
      "Alertas no Telegram por canal",
      "Métricas de transmissão",
      "Onboarding dedicado",
    ],
  },
];

function PricingCard({ plan }) {
  const base =
    "relative flex flex-col rounded-lg p-6 transition-transform duration-300 hover:-translate-y-1";
  const normal = "border border-slate-700 bg-slate-800";
  const featured = "border-2 border-blue-500 bg-slate-700 shadow-2xl shadow-blue-500/20";

  return (
    <div className={`${base} ${plan.highlight ? featured : normal}`}>
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-500/30">
          Mais popular
        </span>
      )}

      <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{plan.blurb}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-sm text-slate-400">R$</span>
        <span className="font-display text-4xl font-bold tracking-tight text-white">{plan.price}</span>
        <span className="text-sm text-slate-400">/mês</span>
      </div>

      <button
        className={`mt-6 w-full rounded-md px-4 py-2.5 font-semibold transition-colors ${
          plan.highlight
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600"
            : "border border-slate-600 text-slate-300 hover:border-blue-500 hover:text-white"
        }`}
      >
        Escolher plano
      </button>

      <ul className="mt-7 space-y-3 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-slate-300">
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
      <div className="reveal reveal-1 mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Planos simples e diretos
        </h2>
        <p className="mt-4 text-slate-400">
          Comece grátis e cresça conforme adiciona câmeras. Valores ilustrativos
          para validar o layout — os planos finais serão definidos em breve.
        </p>
      </div>

      <div className="reveal reveal-2 mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} />
        ))}
      </div>
    </section>
  );
}
