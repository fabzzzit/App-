"use client";

import { Chess, type Move } from "chess.js";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Board from "@/components/Board";
import MoveList from "@/components/MoveList";
import { BOTS, TIERS, botByElo } from "@/lib/bots";
import { THINK_TIPS } from "@/lib/client";
import { saveGame } from "@/lib/store";
import { Engine, chooseBotMove } from "@/lib/engine";

type Phase = "setup" | "playing" | "over";
type ColorChoice = "w" | "b" | "random";
type Outcome = { result: "win" | "loss" | "draw"; reason: string };

export default function PlayPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [botElo, setBotElo] = useState(800);
  const [colorChoice, setColorChoice] = useState<ColorChoice>("w");
  const [userColor, setUserColor] = useState<"w" | "b">("w");
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [fen, setFen] = useState(new Chess().fen());
  const [hist, setHist] = useState<Move[]>([]);
  const [thinking, setThinking] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);

  const chessRef = useRef(new Chess());
  const engineRef = useRef<Engine | null>(null);
  const savedRef = useRef(false);

  const bot = botByElo(botElo);

  useEffect(() => {
    return () => {
      engineRef.current?.terminate();
      engineRef.current = null;
    };
  }, []);

  const sync = useCallback(() => {
    setFen(chessRef.current.fen());
    setHist(chessRef.current.history({ verbose: true }));
  }, []);

  const finish = useCallback(
    async (o: Outcome, color: "w" | "b", elo: number) => {
      setOutcome(o);
      setPhase("over");
      setThinking(false);
      if (savedRef.current) return;
      savedRef.current = true;
      const b = botByElo(elo);
      try {
        const id = saveGame({
          botName: b.name,
          botElo: b.elo,
          playerColor: color,
          result: o.result,
          reason: o.reason,
          pgn: chessRef.current.pgn(),
          moves: chessRef.current.history().length,
        });
        setSavedId(id);
      } catch {
        /* no se pudo guardar */
      }
    },
    [],
  );

  const checkEnd = useCallback(
    (color: "w" | "b", elo: number): boolean => {
      const c = chessRef.current;
      if (c.isCheckmate()) {
        const loserIsUser = c.turn() === color;
        finish({ result: loserIsUser ? "loss" : "win", reason: "Jaque mate" }, color, elo);
        return true;
      }
      if (c.isDraw()) {
        const reason = c.isStalemate()
          ? "Rey ahogado"
          : c.isInsufficientMaterial()
            ? "Material insuficiente"
            : c.isThreefoldRepetition()
              ? "Triple repetición"
              : "Regla de los 50 movimientos";
        finish({ result: "draw", reason }, color, elo);
        return true;
      }
      return false;
    },
    [finish],
  );

  function startGame() {
    if (!engineRef.current) engineRef.current = new Engine();
    setEngineReady(true);
    const color: "w" | "b" = colorChoice === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorChoice;
    chessRef.current = new Chess();
    savedRef.current = false;
    setUserColor(color);
    setOrientation(color);
    setOutcome(null);
    setSavedId(null);
    setConfirmResign(false);
    sync();
    setPhase("playing");
  }

  // Turno del bot
  useEffect(() => {
    if (phase !== "playing") return;
    const c = chessRef.current;
    if (c.turn() === userColor || c.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    const engine = engineRef.current;
    if (!engine) return;
    chooseBotMove(engine, c.fen(), botElo)
      .then((uci) => {
        if (cancelled) return;
        try {
          chessRef.current.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        } catch {
          const any = chessRef.current.moves({ verbose: true })[0];
          if (any) chessRef.current.move(any);
        }
        setThinking(false);
        sync();
        checkEnd(userColor, botElo);
      })
      .catch(() => setThinking(false));
    return () => {
      cancelled = true;
    };
  }, [fen, phase, userColor, botElo, sync, checkEnd]);

  function onUserMove(from: string, to: string, promotion?: string) {
    const c = chessRef.current;
    if (c.turn() !== userColor || phase !== "playing") return;
    try {
      c.move({ from, to, promotion });
    } catch {
      return;
    }
    sync();
    checkEnd(userColor, botElo);
  }

  function undo() {
    const c = chessRef.current;
    if (phase !== "playing" || thinking || c.history().length === 0) return;
    c.undo();
    if (c.turn() !== userColor && c.history().length > 0) c.undo();
    sync();
  }

  function resign() {
    setConfirmResign(false);
    finish({ result: "loss", reason: "Abandono" }, userColor, botElo);
  }

  const last = hist.length ? hist[hist.length - 1] : null;
  const myTurn = chessRef.current.turn() === userColor;
  const tip = THINK_TIPS[hist.length % THINK_TIPS.length];

  /* ───────────── Pantalla de selección ───────────── */
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Elige a tu rival</h1>
        <p className="mt-1 text-sm text-muted">
          Desde un principiante (100) hasta el motor más fuerte (3500). Al terminar, tu entrenador analiza la partida.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-muted">Jugar con:</span>
          {(
            [
              ["w", "♔ Blancas"],
              ["random", "🎲 Al azar"],
              ["b", "♚ Negras"],
            ] as [ColorChoice, string][]
          ).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setColorChoice(v)}
              className={`btn !py-2 text-sm ${colorChoice === v ? "btn-primary" : "btn-ghost"}`}
            >
              {l}
            </button>
          ))}
        </div>

        {TIERS.map((t) => (
          <section key={t} className="mt-6">
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-muted">{t}</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {BOTS.filter((b) => b.tier === t).map((b) => (
                <button
                  key={b.elo}
                  onClick={() => setBotElo(b.elo)}
                  className={`card flex items-center gap-3 p-3 text-left transition hover:bg-panel2 ${
                    botElo === b.elo ? "!border-brand ring-2 ring-brand/60" : ""
                  }`}
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-panel2 text-3xl">{b.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{b.name}</span>
                    <span className="text-xs font-bold text-brand">{b.elo} Elo</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="sticky bottom-[68px] z-30 mt-6 sm:bottom-4">
          <div className="card flex items-center gap-3 border-brand/50 bg-[#2f2d29]/95 p-3 shadow-2xl backdrop-blur">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-panel2 text-3xl">{bot.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold">
                {bot.name} <span className="text-brand">· {bot.elo}</span>
              </div>
              <div className="truncate text-xs text-muted">{bot.tagline}</div>
            </div>
            <button onClick={startGame} className="btn btn-primary shrink-0">
              Jugar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────── Partida ───────────── */
  const topIsBot = true;
  const botColor = userColor === "w" ? "b" : "w";
  const topColor = orientation === userColor ? botColor : userColor;
  const topLabel = topColor === botColor ? topIsBot : false;

  const PlayerBar = ({ isBot }: { isBot: boolean }) => (
    <div className="flex items-center gap-3 py-1.5">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-panel2 text-2xl">{isBot ? bot.emoji : "🙂"}</span>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-extrabold">{isBot ? bot.name : "Tú"}</div>
        <div className="text-xs text-muted">{isBot ? `${bot.elo} Elo` : "Jugador"}</div>
      </div>
      {isBot && thinking && (
        <span className="ml-auto text-xs font-bold text-brand">
          pensando<span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </span>
      )}
      {!isBot && phase === "playing" && myTurn && !thinking && (
        <span className="ml-auto rounded bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand">Tu turno</span>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="mx-auto w-full" style={{ maxWidth: "min(100%, max(300px, calc(100dvh - 250px)))" }}>
          <PlayerBar isBot={topLabel} />
          <Board
            fen={fen}
            orientation={orientation}
            movableColor={phase === "playing" ? userColor : null}
            onMove={onUserMove}
            lastMove={last ? { from: last.from, to: last.to } : null}
          />
          <PlayerBar isBot={!topLabel} />
        </div>

        <aside className="flex flex-col gap-3">
          {phase === "over" && outcome && (
            <div className="card fade-up border-brand/60 p-4 text-center">
              <div className="text-4xl">{outcome.result === "win" ? "🏆" : outcome.result === "draw" ? "🤝" : "💪"}</div>
              <h2 className="mt-1 text-xl font-extrabold">
                {outcome.result === "win" ? "¡Ganaste!" : outcome.result === "draw" ? "Tablas" : "Perdiste"}
              </h2>
              <p className="text-sm text-muted">
                {outcome.reason} · vs {bot.name} ({bot.elo})
              </p>
              <div className="mt-3 grid gap-2">
                {savedId ? (
                  <Link href={`/review?id=${savedId}`} className="btn btn-primary">
                    🎓 Revisar con el entrenador
                  </Link>
                ) : (
                  <button className="btn btn-primary" disabled>
                    Guardando partida…
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={startGame} className="btn btn-ghost">
                    Revancha
                  </button>
                  <button onClick={() => setPhase("setup")} className="btn btn-ghost">
                    Otro bot
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "playing" && (
            <div className="card p-3 text-sm">
              <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wider text-brand">💡 Piensa como jugador</div>
              <p className="text-[#e6e3db]">{tip}</p>
            </div>
          )}

          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted">Jugadas</h3>
              {!engineReady && <span className="text-xs text-muted">Cargando motor…</span>}
            </div>
            <MoveList moves={hist.map((m) => m.san)} current={hist.length} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setOrientation((o) => (o === "w" ? "b" : "w"))} className="btn btn-ghost !px-2 text-sm">
              🔄 Girar
            </button>
            <button onClick={undo} disabled={phase !== "playing" || thinking || hist.length === 0} className="btn btn-ghost !px-2 text-sm">
              ↩ Deshacer
            </button>
            {phase === "playing" ? (
              confirmResign ? (
                <button onClick={resign} className="btn !px-2 bg-red-700 text-sm text-white hover:bg-red-600">
                  ¿Seguro?
                </button>
              ) : (
                <button onClick={() => setConfirmResign(true)} className="btn btn-ghost !px-2 text-sm">
                  🏳 Rendirse
                </button>
              )
            ) : (
              <button onClick={() => setPhase("setup")} className="btn btn-ghost !px-2 text-sm">
                ♟ Nueva
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
