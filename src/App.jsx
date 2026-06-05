import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Pricing from "./components/Pricing.jsx";
import Footer from "./components/Footer.jsx";

const features = [
  {
    title: "Grupos em rotação",
    desc: "Várias câmeras transmitidas em sequência contínua, sem gaps nem travamentos.",
  },
  {
    title: "Áudio independente",
    desc: "Trilha em loop desacoplada do vídeo — troque a qualquer momento com o grupo no ar.",
  },
  {
    title: "Sempre no ar",
    desc: "Monitoramento automático com auto-restart e alertas no Telegram.",
  },
];

function Features() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-slate-700 bg-slate-800/60 p-6"
          >
            <h3 className="font-display text-base font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <div className="bg-atmosphere" />
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
