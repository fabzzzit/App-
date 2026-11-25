import Link from "next/link";
import Board from "@/components/Board";

const FEATURES = [
  {
    icon: "🤖",
    title: "20 bots de 100 a 3500",
    text: "Desde un pichón que regala piezas hasta Stockfish a fuerza máxima. Sube de nivel a tu ritmo.",
  },
  {
    icon: "🎓",
    title: "Entrenador personal",
    text: "Al terminar, te dice qué jugada fue un error, qué debiste jugar y por qué. Con flechas en el tablero.",
  },
  {
    icon: "🧠",
    title: "Aprende a pensar",
    text: "Aperturas, la rutina de 4 preguntas, tácticas y trucos para decidir como un jugador de verdad.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">
            Versión beta
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Juega ajedrez. <br />
            <span className="text-brand">Aprende a pensar.</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-[#cfcbc1]">
            Enfréntate a bots de todos los niveles y recibe un análisis claro de tus errores. Funciona en PC y celular, con tema
            oscuro y sin registrarte.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/play" className="btn btn-primary !px-6 !py-3.5 text-lg">
              ♟ Jugar ahora
            </Link>
            <Link href="/learn" className="btn btn-ghost !px-6 !py-3.5 text-lg">
              🎓 Aprender
            </Link>
          </div>
        </div>
        <div className="order-1 mx-auto w-full max-w-md md:order-2">
          <Board fen="r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5" orientation="w" lastMove={{ from: "d2", to: "d3" }} />
        </div>
      </section>

      <section className="mt-12 grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-panel2 text-3xl">{f.icon}</div>
            <h2 className="mt-3 text-lg font-extrabold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>

      <section className="card mt-8 flex flex-col items-center gap-3 p-6 text-center">
        <h2 className="text-xl font-extrabold">Tu primera lección: la regla de oro</h2>
        <p className="max-w-xl text-[#cfcbc1]">
          Antes de cada jugada pregúntate: <b className="text-white">«¿Qué quiere hacer mi rival?»</b> y revisa{" "}
          <b className="text-brand">Jaques, Capturas y Amenazas</b>. Este hábito te sube cientos de puntos de Elo.
        </p>
        <Link href="/learn" className="btn btn-primary">
          Ver más lecciones
        </Link>
      </section>
    </div>
  );
}
