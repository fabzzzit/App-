"use client";

import { Chess } from "chess.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import Board from "@/components/Board";
import { OPENINGS, PUZZLES, THINK_CARDS, type Opening } from "@/lib/learn-data";

type Tab = "think" | "openings" | "tactics";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "think", label: "Pensar como jugador", icon: "🧠" },
  { id: "openings", label: "Aperturas", icon: "📖" },
  { id: "tactics", label: "Tácticas", icon: "🎯" },
];

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <LearnInner />
    </Suspense>
  );
}

function LearnInner() {
  const sp = useSearchParams();
  const initial = (["think", "openings", "tactics"].includes(sp.get("tab") ?? "") ? sp.get("tab") : "think") as Tab;
  const [tab, setTab] = useState<Tab>(initial);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Aprende ajedrez</h1>
      <p className="mt-1 text-sm text-muted">Poco a poco: lo esencial para pensar como un jugador. Más lecciones llegarán en próximas versiones.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn flex-col !gap-0.5 !px-1 !py-2.5 text-xs sm:flex-row sm:!gap-2 sm:text-sm ${
              tab === t.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "think" && <Think />}
        {tab === "openings" && <Openings />}
        {tab === "tactics" && <Tactics />}
      </div>

      <div className="card mt-8 flex flex-col items-center gap-2 p-5 text-center">
        <div className="font-extrabold">¿Listo para ponerlo en práctica?</div>
        <Link href="/play" className="btn btn-primary">
          ♟ Jugar contra un bot
        </Link>
      </div>
    </div>
  );
}

function Think() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {THINK_CARDS.map((c, i) => (
        <article key={c.title} className="card fade-up p-4" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-panel2 text-2xl">{c.icon}</span>
            <h2 className="font-extrabold leading-tight">{c.title}</h2>
          </div>
          <p className="mt-2 text-sm text-muted">{c.intro}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[#e6e3db]">
            {c.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-brand">▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Openings() {
  const [sel, setSel] = useState<Opening>(OPENINGS[0]);
  const [step, setStep] = useState(0);

  const { fen, last } = useMemo(() => {
    const c = new Chess();
    let lm: { from: string; to: string } | null = null;
    for (let i = 0; i < step; i++) {
      const m = c.move(sel.moves[i]);
      lm = { from: m.from, to: m.to };
    }
    return { fen: c.fen(), last: lm };
  }, [sel, step]);

  const pick = (o: Opening) => {
    setSel(o);
    setStep(0);
  };

  return (
    <div>
      <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
        {OPENINGS.map((o) => (
          <button
            key={o.id}
            onClick={() => pick(o)}
            className={`btn shrink-0 !px-3 !py-2 text-xs sm:text-sm ${sel.id === o.id ? "btn-primary" : "btn-ghost"}`}
          >
            {o.side === "Blancas" ? "♔" : "♚"} {o.name.replace("Apertura ", "").replace("Defensa ", "")}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,420px)_1fr]">
        <div>
          <Board fen={fen} orientation={sel.side === "Blancas" ? "w" : "b"} lastMove={last} />
          <div className="mt-3 grid grid-cols-4 gap-2">
            <button className="btn btn-ghost !px-2" onClick={() => setStep(0)}>
              ⏮
            </button>
            <button className="btn btn-ghost !px-2" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ◀
            </button>
            <button className="btn btn-primary !px-2" onClick={() => setStep((s) => Math.min(sel.moves.length, s + 1))}>
              ▶
            </button>
            <button className="btn btn-ghost !px-2" onClick={() => setStep(sel.moves.length)}>
              ⏭
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1 text-sm font-bold">
            {sel.moves.map((m, i) => (
              <button
                key={i}
                onClick={() => setStep(i + 1)}
                className={`rounded px-1.5 py-0.5 ${i + 1 === step ? "bg-brand text-white" : "text-[#d6d2c8] hover:bg-panel2"}`}
              >
                {i % 2 === 0 ? `${i / 2 + 1}.` : ""}
                {m}
              </button>
            ))}
          </div>
        </div>

        <article className="card fade-up p-4 text-sm" key={sel.id}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold">{sel.name}</h2>
            <span className="rounded bg-panel2 px-2 py-0.5 text-xs font-bold text-muted">Con {sel.side.toLowerCase()}</span>
            <span className="rounded bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand">{sel.level}</span>
          </div>
          <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wider text-brand">Idea principal</h3>
          <p className="mt-1 text-[#e6e3db]">{sel.idea}</p>
          <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wider text-brand">Plan</h3>
          <ul className="mt-1 space-y-1 text-[#e6e3db]">
            {sel.plans.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-brand">▸</span>
                {p}
              </li>
            ))}
          </ul>
          <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wider text-red-400">Error común</h3>
          <p className="mt-1 text-[#e6e3db]">{sel.mistake}</p>
          <div className="mt-4 rounded-lg bg-panel2 p-3 text-xs text-muted">
            💡 No memorices: entiende POR QUÉ se juega cada movimiento (centro, desarrollo, seguridad del rey).
          </div>
        </article>
      </div>
    </div>
  );
}

function Tactics() {
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "wrong" | "right">("idle");
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState<number[]>([]);
  const [override, setOverride] = useState<string | null>(null);
  const p = PUZZLES[idx];

  const turn = new Chess(p.fen).turn();

  function onMove(from: string, to: string, promotion?: string) {
    if (status === "right") return;
    const c = new Chess(p.fen);
    let mv;
    try {
      mv = c.move({ from, to, promotion });
    } catch {
      return;
    }
    if (mv.san === p.solution) {
      setStatus("right");
      setOverride(c.fen());
      setSolved((s) => (s.includes(p.id) ? s : [...s, p.id]));
    } else {
      setStatus("wrong");
    }
  }

  function go(n: number) {
    setIdx(n);
    setStatus("idle");
    setHint(false);
    setOverride(null);
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        <Board fen={override ?? p.fen} orientation={turn} movableColor={status === "right" ? null : turn} onMove={onMove} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="rounded bg-panel2 px-2 py-0.5 text-xs font-bold text-muted">{p.theme}</span>
            <span className="text-xs font-bold text-muted">
              {solved.length}/{PUZZLES.length} resueltos
            </span>
          </div>
          <h2 className="mt-2 text-lg font-extrabold">
            {p.id}. {p.title}
          </h2>
          <p className="mt-1 text-sm text-muted">Juegan {turn === "w" ? "blancas" : "negras"}. Encuentra la mejor jugada.</p>

          {status === "wrong" && (
            <p className="fade-up mt-3 rounded-lg bg-red-950/50 p-2.5 text-sm text-[#f1d9d6]">
              ❌ Esa no es. Piensa: ¿jaques? ¿capturas? ¿amenazas? Inténtalo otra vez.
            </p>
          )}
          {status === "right" && (
            <p className="fade-up mt-3 rounded-lg bg-green-950/50 p-2.5 text-sm text-[#dcefd0]">✅ ¡Correcto! {p.explain}</p>
          )}
          {hint && status !== "right" && <p className="mt-3 rounded-lg bg-panel2 p-2.5 text-sm">💡 {p.hint}</p>}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-ghost !py-2 text-sm" onClick={() => setHint(true)} disabled={status === "right"}>
              💡 Pista
            </button>
            <button
              className="btn btn-ghost !py-2 text-sm"
              onClick={() => {
                setStatus("idle");
                setOverride(null);
              }}
            >
              ↺ Reintentar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-ghost" onClick={() => go((idx + PUZZLES.length - 1) % PUZZLES.length)}>
            ← Anterior
          </button>
          <button className={`btn ${status === "right" ? "btn-primary" : "btn-ghost"}`} onClick={() => go((idx + 1) % PUZZLES.length)}>
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
