"use client";

import { Chess } from "chess.js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Board from "@/components/Board";
import MoveList from "@/components/MoveList";
import { CLASS_INFO, analyzeGame, fmtEval, winPct, type Analysis, type MoveClass } from "@/lib/analysis";
import { Engine } from "@/lib/engine";
import { getGame, saveAnalysis } from "@/lib/store";

interface GameData {
  id: number;
  botName: string;
  botElo: number;
  playerColor: "w" | "b";
  result: "win" | "loss" | "draw";
  reason: string;
  pgn: string;
  analysis: Analysis | null;
  createdAt: string;
}

const BAD: MoveClass[] = ["inaccuracy", "mistake", "blunder"];

function ReviewInner() {
  const id = useSearchParams().get("id") ?? "";
  const [game, setGame] = useState<GameData | null>(null);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [ply, setPly] = useState(0);
  const [showBest, setShowBest] = useState(false);

  useEffect(() => {
    const g = getGame(Number(id));
    if (g) {
      setGame(g);
      if (g.analysis) setAnalysis(g.analysis);
      setError("");
    } else {
      setError("No se encontró la partida");
    }
  }, [id]);

  // Lanzar análisis si hace falta
  useEffect(() => {
    if (!game || game.analysis) return;
    let cancelled = false;
    const engine = new Engine();
    analyzeGame(engine, game.pgn, game.playerColor, (done, total) => !cancelled && setProgress({ done, total }), () => cancelled)
      .then((a) => {
        if (!a || cancelled) return;
        setAnalysis(a);
        saveAnalysis(game.id, a, a.accuracy[game.playerColor]);
      })
      .catch(() => !cancelled && setError("El análisis falló. Intenta recargar la página."))
      .finally(() => engine.terminate());
    return () => {
      cancelled = true;
      engine.terminate();
    };
  }, [game]);

  const replay = useMemo(() => {
    if (!game) return null;
    const c = new Chess();
    try {
      c.loadPgn(game.pgn);
    } catch {
      return null;
    }
    const h = c.history({ verbose: true });
    return { fens: [h[0]?.before ?? new Chess().fen(), ...h.map((m) => m.after)], moves: h };
  }, [game]);

  const total = replay?.moves.length ?? 0;
  const review = analysis && ply > 0 ? analysis.moves[ply - 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(ply - 1);
      if (e.key === "ArrowRight") go(ply + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, total]);

  function go(p: number) {
    setPly(Math.max(0, Math.min(total, p)));
    setShowBest(false);
  }

  function nextMistake() {
    if (!analysis || !game) return;
    const mine = analysis.moves.filter((m) => m.color === game.playerColor && BAD.includes(m.cls) && m.cls !== "inaccuracy");
    const list = mine.length ? mine : analysis.moves.filter((m) => m.color === game.playerColor && BAD.includes(m.cls));
    if (!list.length) return;
    const nxt = list.find((m) => m.ply > ply) ?? list[0];
    setPly(nxt.ply);
    setShowBest(true);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold">{error}</p>
        <Link href="/games" className="btn btn-primary mt-4">
          Volver a mis partidas
        </Link>
      </div>
    );
  }
  if (!game || !replay) {
    return <div className="p-10 text-center text-muted">Cargando partida…</div>;
  }

  const orientation = game.playerColor;
  const boardFen = showBest && review ? review.fenBefore : replay.fens[ply];
  const lastMove = showBest ? null : ply > 0 ? { from: replay.moves[ply - 1].from, to: replay.moves[ply - 1].to } : null;
  const arrows =
    showBest && review
      ? [
          { from: review.uci.slice(0, 2), to: review.uci.slice(2, 4), color: "rgba(202,52,49,0.85)" },
          ...(review.bestUci ? [{ from: review.bestUci.slice(0, 2), to: review.bestUci.slice(2, 4), color: "rgba(129,182,76,0.95)" }] : []),
        ]
      : [];
  const evalNow = analysis ? analysis.evals[showBest && review ? ply - 1 : ply] ?? 0 : 0;
  const whitePct = winPct(evalNow);
  const userAcc = analysis?.accuracy[game.playerColor];
  const oppAcc = analysis?.accuracy[game.playerColor === "w" ? "b" : "w"];
  const mine = analysis?.moves.filter((m) => m.color === game.playerColor) ?? [];
  const marks: Record<number, string> = {};
  analysis?.moves.forEach((m) => {
    if (m.cls !== "good" && m.cls !== "excellent") marks[m.ply] = CLASS_INFO[m.cls].color;
  });
  const resultLabel = game.result === "win" ? "Victoria" : game.result === "loss" ? "Derrota" : "Tablas";
  const resultColor = game.result === "win" ? "text-brand" : game.result === "loss" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold sm:text-2xl">🎓 Revisión del entrenador</h1>
          <p className="text-sm text-muted">
            vs {game.botName} ({game.botElo}) · <span className={`font-bold ${resultColor}`}>{resultLabel}</span> · {game.reason}
          </p>
        </div>
        <Link href="/play" className="btn btn-primary !py-2 text-sm">
          ♟ Jugar otra
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Tablero */}
        <div className="mx-auto w-full" style={{ maxWidth: "min(100%, max(300px, calc(100dvh - 220px)))" }}>
          <div className="flex gap-2">
            <div className="relative w-3 shrink-0 overflow-hidden rounded bg-[#403d39] sm:w-4">
              <div
                className="absolute inset-x-0 bg-white transition-all duration-300"
                style={orientation === "w" ? { bottom: 0, height: `${whitePct}%` } : { top: 0, height: `${whitePct}%` }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Board fen={boardFen} orientation={orientation} lastMove={lastMove} arrows={arrows} />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            <button className="btn btn-ghost !px-2" onClick={() => go(0)} aria-label="Inicio">
              ⏮
            </button>
            <button className="btn btn-ghost !px-2" onClick={() => go(ply - 1)} aria-label="Anterior">
              ◀
            </button>
            <button className="btn btn-ghost !px-2" onClick={() => go(ply + 1)} aria-label="Siguiente">
              ▶
            </button>
            <button className="btn btn-ghost !px-2" onClick={() => go(total)} aria-label="Final">
              ⏭
            </button>
            <button className="btn btn-primary !px-2 text-xs sm:text-sm" onClick={nextMistake} disabled={!analysis}>
              Siguiente error
            </button>
          </div>
        </div>

        {/* Panel del entrenador */}
        <aside className="flex flex-col gap-3">
          {!analysis && (
            <div className="card p-4">
              <div className="mb-2 flex items-center gap-2 font-extrabold">
                <span className="text-2xl">🧠</span> El entrenador está analizando…
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-panel2">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">
                Posición {progress.done} de {progress.total}. Puedes ir viendo la partida mientras tanto.
              </p>
            </div>
          )}

          {analysis && (
            <>
              <div className="card p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-panel2 p-3">
                    <div className="text-3xl font-extrabold text-brand">{userAcc}%</div>
                    <div className="text-xs font-bold text-muted">Tu precisión</div>
                  </div>
                  <div className="rounded-lg bg-panel2 p-3">
                    <div className="text-3xl font-extrabold">{oppAcc}%</div>
                    <div className="text-xs font-bold text-muted">{game.botName}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                  {(["best", "excellent", "good", "inaccuracy", "mistake", "blunder"] as MoveClass[]).map((c) => (
                    <div key={c} className="rounded-md bg-panel2 px-1 py-1.5">
                      <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: CLASS_INFO[c].color }} />
                      {mine.filter((m) => m.cls === c).length} {CLASS_INFO[c].label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 text-sm">
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-brand">Resumen del entrenador</h3>
                <ul className="space-y-1.5 text-[#e6e3db]">
                  {analysis.summary.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand">▸</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                {analysis.lesson && (
                  <Link href={analysis.lesson.href} className="btn btn-ghost mt-3 w-full !py-2 text-sm">
                    📚 Practicar: {analysis.lesson.label}
                  </Link>
                )}
              </div>
            </>
          )}

          {/* Tarjeta de la jugada actual */}
          <div className="card p-4 text-sm">
            {ply === 0 || !review ? (
              <p className="text-muted">
                {analysis
                  ? "Usa las flechas o toca una jugada para ver el comentario del entrenador. «Siguiente error» te lleva a tus momentos clave."
                  : "Cuando termine el análisis verás aquí qué hiciste bien y qué debiste jugar."}
              </p>
            ) : (
              <div className="fade-up" key={ply}>
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-7 min-w-7 place-items-center rounded-full px-1 text-xs font-extrabold text-black"
                    style={{ background: CLASS_INFO[review.cls].color }}
                  >
                    {CLASS_INFO[review.cls].icon}
                  </span>
                  <div className="font-extrabold">
                    {Math.ceil(review.ply / 2)}
                    {review.color === "w" ? "." : "..."} {review.san}{" "}
                    <span className="font-bold" style={{ color: CLASS_INFO[review.cls].color }}>
                      · {CLASS_INFO[review.cls].label}
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-bold text-muted">
                    {fmtEval(review.evalAfter, review.mateAfter)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">{review.color === game.playerColor ? "Tu jugada" : `Jugada de ${game.botName}`}</div>

                {review.color === game.playerColor && review.what ? (
                  <div className="mt-3 space-y-2">
                    <p className="rounded-lg bg-red-950/40 p-2.5 text-[#f1d9d6]">❌ {review.what}</p>
                    <p className="rounded-lg bg-green-950/40 p-2.5 text-[#dcefd0]">✅ {review.better}</p>
                    <p className="rounded-lg bg-panel2 p-2.5 text-[#e6e3db]">💡 {review.tip}</p>
                    <button className="btn btn-ghost w-full !py-2 text-sm" onClick={() => setShowBest((s) => !s)}>
                      {showBest ? "↩ Volver a la partida" : "👁 Ver qué debí jugar"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-[#e6e3db]">
                    {review.cls === "best"
                      ? "Es la mejor jugada de la posición."
                      : review.cls === "excellent" || review.cls === "good"
                        ? "Una jugada sólida; el motor prefería " + review.bestSan + " pero la diferencia es mínima."
                        : `El motor prefería ${review.bestSan}.`}
                  </p>
                )}
              </div>
            )}
          </div>

          {analysis && (
            <div className="card p-3">
              <div className="mb-1 text-xs font-extrabold uppercase tracking-wider text-muted">Evaluación de la partida</div>
              <EvalGraph evals={analysis.evals} ply={ply} onPick={go} />
            </div>
          )}

          <div className="card p-3">
            <div className="mb-1 text-xs font-extrabold uppercase tracking-wider text-muted">Jugadas</div>
            <MoveList moves={replay.moves.map((m) => m.san)} current={ply} onSelect={go} marks={marks} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function EvalGraph({ evals, ply, onPick }: { evals: number[]; ply: number; onPick: (p: number) => void }) {
  const n = evals.length - 1;
  if (n < 1) return null;
  const pts = evals.map((e, i) => `${(i / n) * 100},${30 - winPct(e) * 0.3}`);
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className="h-16 w-full cursor-pointer rounded bg-[#403d39]"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onPick(Math.round(((e.clientX - r.left) / r.width) * n));
      }}
    >
      <polygon points={`0,30 ${pts.join(" ")} 100,30`} fill="#f1efe9" opacity="0.92" />
      <line x1="0" y1="15" x2="100" y2="15" stroke="#7a766e" strokeWidth="0.3" />
      <line x1={(ply / n) * 100} y1="0" x2={(ply / n) * 100} y2="30" stroke="#81b64c" strokeWidth="0.8" />
    </svg>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewInner />
    </Suspense>
  );
}
