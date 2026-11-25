import { Chess, type PieceSymbol, type Square } from "chess.js";
import type { Engine } from "./engine";

export type MoveClass = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
export type Theme = "hanging" | "mate" | "missedCapture" | "missedMate" | "opening" | "tempo" | "other";

export const CLASS_INFO: Record<MoveClass, { label: string; color: string; icon: string }> = {
  best: { label: "Mejor jugada", color: "#81b64c", icon: "★" },
  excellent: { label: "Excelente", color: "#96bc4b", icon: "✓" },
  good: { label: "Buena", color: "#a3b18a", icon: "•" },
  inaccuracy: { label: "Imprecisión", color: "#f7c631", icon: "?!" },
  mistake: { label: "Error", color: "#e58f2a", icon: "?" },
  blunder: { label: "Error grave", color: "#ca3431", icon: "??" },
};

export interface MoveReview {
  ply: number;
  color: "w" | "b";
  san: string;
  uci: string;
  fenBefore: string;
  bestUci: string;
  bestSan: string;
  evalBefore: number; // centipeones, punto de vista de blancas (limitado a ±1000)
  evalAfter: number;
  mateBefore: number | null; // punto de vista de blancas
  mateAfter: number | null;
  winLoss: number; // puntos de probabilidad de ganar perdidos (0-100)
  cls: MoveClass;
  theme?: Theme;
  what?: string;
  better?: string;
  tip?: string;
}

export interface Analysis {
  version: 1;
  userColor: "w" | "b";
  moves: MoveReview[];
  evals: number[]; // evaluación por posición (blancas), longitud = jugadas + 1
  accuracy: { w: number; b: number };
  summary: string[];
  lesson?: { label: string; href: string };
}

const NAME: Record<PieceSymbol, string> = { p: "peón", n: "caballo", b: "alfil", r: "torre", q: "dama", k: "rey" };
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function winPct(cp: number) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

function moveAccuracy(loss: number) {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
}

export function fmtEval(cp: number, mate: number | null) {
  if (mate !== null) return mate === 0 ? "#" : `${mate > 0 ? "+" : "-"}M${Math.abs(mate)}`;
  const v = cp / 100;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

function tryMove(c: Chess, uci: string) {
  if (!uci || uci.length < 4) return null;
  try {
    return c.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] });
  } catch {
    return null;
  }
}

interface PosEval {
  cp: number; // blancas
  mate: number | null; // blancas
  best: string;
  stmCp: number | null;
  stmMate: number | null;
}

function classify(loss: number, isBest: boolean): MoveClass {
  if (isBest) return "best";
  if (loss <= 2) return "excellent";
  if (loss <= 5) return "good";
  if (loss <= 10) return "inaccuracy";
  if (loss <= 20) return "mistake";
  return "blunder";
}

interface ExplainInput {
  fenBefore: string;
  uci: string;
  bestUci: string;
  replyUci: string;
  ply: number;
  color: "w" | "b";
  before: PosEval;
  after: PosEval;
  moverEvalBefore: number;
  moverEvalAfter: number;
}

function explain(i: ExplainInput): { theme: Theme; what: string; better: string; tip: string } {
  const opp = i.color === "w" ? "b" : "w";
  const start = new Chess(i.fenBefore);
  const bestC = new Chess(i.fenBefore);
  const best = tryMove(bestC, i.bestUci);
  const playedC = new Chess(i.fenBefore);
  const played = tryMove(playedC, i.uci);
  const bestSan = best?.san ?? "otra jugada";
  const betterDefault = `La mejor jugada era ${bestSan}.`;

  // 1) Permite mate
  if (i.after.stmMate !== null && i.after.stmMate > 0 && i.after.stmMate <= 4) {
    const rc = new Chess(playedC.fen());
    const r = tryMove(rc, i.replyUci);
    return {
      theme: "mate",
      what: `Tu jugada ${played?.san ?? ""} permite que el rival dé mate en ${i.after.stmMate}${r ? `, empezando con ${r.san}` : ""}.`,
      better: betterDefault,
      tip: "Antes de mover, revisa TODOS los jaques del rival. Un mate se evita en segundos si lo buscas.",
    };
  }

  // 2) Deja una pieza colgada
  if (played && i.replyUci) {
    const rc = new Chess(playedC.fen());
    const r = tryMove(rc, i.replyUci);
    if (r && r.captured) {
      const gained = VALUE[r.captured];
      const recapture = rc.moves({ verbose: true }).some((m) => m.to === r.to && m.isCapture());
      const net = recapture ? gained - VALUE[r.piece] : gained;
      if (net >= 2) {
        const own = r.to === played.to;
        const what = own
          ? `Moviste tu ${NAME[r.captured]} a ${played.to}, donde ${recapture ? "el rival puede cambiarla ganando material" : "queda sin protección y el rival la captura con " + r.san}.`
          : `Con ${played.san} dejaste tu ${NAME[r.captured]} en ${r.to} ${recapture ? "mal protegido" : "sin protección"}: el rival la captura con ${r.san}.`;
        return {
          theme: "hanging",
          what,
          better: betterDefault,
          tip: "Rutina de seguridad: antes de mover pregúntate «¿qué piezas mías quedan sin protección después de esta jugada?».",
        };
      }
    }
  }

  // 3) Mate perdido
  if (i.before.stmMate !== null && i.before.stmMate > 0 && i.before.stmMate <= 5) {
    return {
      theme: "missedMate",
      what: `Tenías mate en ${i.before.stmMate} y no lo viste.`,
      better: `Con ${bestSan} la partida se terminaba.`,
      tip: "Cuando el rey rival tiene pocas casillas libres, busca primero TODOS los jaques: «Jaques, Capturas, Amenazas».",
    };
  }

  // 4) Captura ganadora perdida
  if (best && best.captured && !(played && played.isCapture() && played.to === best.to)) {
    const defenders = start.attackers(best.to, opp).length;
    const val = VALUE[best.captured];
    if (val >= 3 || val > VALUE[best.piece] || defenders === 0) {
      return {
        theme: "missedCapture",
        what: `Dejaste pasar una oportunidad: había un ${NAME[best.captured]} en ${best.to} que podías capturar${defenders === 0 ? " y estaba sin defensa" : ""}.`,
        better: `${bestSan} ganaba material.`,
        tip: "En cada turno mira primero qué piezas rivales están sin defensa. Una pieza colgada es el regalo más barato del ajedrez.",
      };
    }
  }

  // 5) Jaque fuerte perdido
  if (best && bestSan.includes("+") && !(played && played.san.includes("+"))) {
    return {
      theme: "missedCapture",
      what: "Había un jaque muy fuerte que cambiaba la posición a tu favor.",
      better: `${bestSan} obligaba al rival a responder y te daba la iniciativa.`,
      tip: "Los jaques limitan las respuestas del rival. Revisarlos siempre te enseña tácticas que otros no ven.",
    };
  }

  // 6) Principios de apertura
  if (played && i.ply <= 16) {
    if (played.piece === "q" && i.ply <= 10) {
      return {
        theme: "opening",
        what: "Sacaste la dama demasiado pronto. Las piezas menores del rival la pueden perseguir y pierdes tiempo.",
        better: betterDefault + " Desarrolla caballos y alfiles antes de mover la dama.",
        tip: "Principio de apertura: controla el centro, desarrolla caballos y alfiles, enroca. La dama espera.",
      };
    }
    if (best && (best.flags.includes("k") || best.flags.includes("q"))) {
      return {
        theme: "opening",
        what: "Tu rey seguía en el centro y se podía poner a salvo.",
        better: `${bestSan} (enroque) protege al rey y conecta las torres.`,
        tip: "Enroca pronto, normalmente antes de la jugada 10.",
      };
    }
    if (played.piece === "p" && (played.from[0] === "a" || played.from[0] === "h") && i.ply <= 10) {
      return {
        theme: "opening",
        what: "Una jugada de peón por el borde no ayuda al centro ni desarrolla piezas.",
        better: betterDefault,
        tip: "En la apertura, cada jugada debería controlar el centro o desarrollar una pieza.",
      };
    }
    if (best && (best.piece === "n" || best.piece === "b") && (best.from[1] === "1" || best.from[1] === "8")) {
      return {
        theme: "tempo",
        what: "Todavía tenías piezas sin sacar y perdiste tiempo con esta jugada.",
        better: `${bestSan} desarrollaba una pieza hacia una casilla activa.`,
        tip: "Cada jugada de apertura debe sumar: desarrolla una pieza nueva en vez de mover la misma dos veces.",
      };
    }
  }

  // 7) Ventaja desperdiciada
  if (i.moverEvalBefore >= 150 && i.moverEvalAfter < 60) {
    return {
      theme: "other",
      what: "Estabas mucho mejor y con esta jugada dejaste escapar casi toda la ventaja.",
      better: betterDefault,
      tip: "Cuando vas ganando, busca la jugada más segura y simple: cambia piezas y no le des contrajuego al rival.",
    };
  }

  return {
    theme: "other",
    what: `${played?.san ?? "Tu jugada"} empeoró tu posición (de ${fmtEval(i.moverEvalBefore, null)} a ${fmtEval(i.moverEvalAfter, null)}).`,
    better: betterDefault + " Mejoraba más la actividad de tus piezas o la seguridad de tu rey.",
    tip: "Antes de mover, pregúntate: «¿Qué quiere hacer mi rival con su última jugada?».",
  };
}

const THEME_LESSON: Record<Theme, { label: string; href: string } | undefined> = {
  hanging: { label: "Rutina de seguridad: Pensar como jugador", href: "/learn?tab=think" },
  mate: { label: "Rutina de seguridad: Pensar como jugador", href: "/learn?tab=think" },
  missedCapture: { label: "Tácticas: entrena tu visión", href: "/learn?tab=tactics" },
  missedMate: { label: "Tácticas: entrena tu visión", href: "/learn?tab=tactics" },
  opening: { label: "Principios de apertura", href: "/learn?tab=openings" },
  tempo: { label: "Principios de apertura", href: "/learn?tab=openings" },
  other: { label: "Pensar como jugador", href: "/learn?tab=think" },
};

function buildSummary(moves: MoveReview[], userColor: "w" | "b", acc: number) {
  const mine = moves.filter((m) => m.color === userColor);
  const count = (c: MoveClass) => mine.filter((m) => m.cls === c).length;
  const blunders = count("blunder");
  const mistakes = count("mistake");
  const inacc = count("inaccuracy");
  const lines: string[] = [];

  if (mine.length === 0) return { lines: ["La partida fue demasiado corta para analizarla."], lesson: undefined };

  if (acc >= 90) lines.push(`Precisión de ${acc}%: jugaste a un nivel muy alto, casi sin errores.`);
  else if (acc >= 75) lines.push(`Precisión de ${acc}%: partida sólida, con algunos detalles por pulir.`);
  else if (acc >= 55) lines.push(`Precisión de ${acc}%: tuviste buenas ideas, pero hubo momentos que decidieron la partida.`);
  else lines.push(`Precisión de ${acc}%: la partida estuvo llena de oportunidades para aprender. ¡Eso es bueno!`);

  if (blunders + mistakes === 0) {
    lines.push("No cometiste errores graves. Sigue con esa disciplina de revisar cada jugada.");
  } else {
    lines.push(
      `Cometiste ${blunders} error${blunders === 1 ? "" : "es"} grave${blunders === 1 ? "" : "s"}, ${mistakes} error${mistakes === 1 ? "" : "es"} y ${inacc} imprecisi${inacc === 1 ? "ón" : "ones"}. Cada uno es una lección concreta abajo.`,
    );
  }

  const opening = mine.slice(0, 8);
  const rest = mine.slice(8);
  const avg = (a: MoveReview[]) => (a.length ? a.reduce((s, m) => s + moveAccuracy(m.winLoss), 0) / a.length : 100);
  if (rest.length >= 4) {
    const ao = avg(opening);
    const ar = avg(rest);
    if (ao + 10 < ar) lines.push("Tu apertura fue lo más flojo: repasa los principios de apertura (centro, desarrollo, enroque).");
    else if (ar + 12 < ao) lines.push("Empezaste bien, pero en el medio juego perdiste el hilo. Revisa amenazas antes de cada jugada.");
    else lines.push("Mantuviste un nivel parejo durante toda la partida.");
  }

  const themeCount = new Map<Theme, number>();
  mine
    .filter((m) => m.cls === "inaccuracy" || m.cls === "mistake" || m.cls === "blunder")
    .forEach((m) => m.theme && themeCount.set(m.theme, (themeCount.get(m.theme) ?? 0) + 1));
  const top = [...themeCount.entries()].sort((a, b) => b[1] - a[1])[0];
  let lesson: { label: string; href: string } | undefined;
  if (top) {
    lesson = THEME_LESSON[top[0]];
    const msg: Record<Theme, string> = {
      hanging: "Tu patrón más repetido: dejar piezas sin protección. Antes de mover, mira qué queda atacado.",
      mate: "Tu patrón más repetido: no ver amenazas de mate. Revisa siempre los jaques del rival.",
      missedCapture: "Tu patrón más repetido: no ver capturas o jaques ganadores. Practica tácticas.",
      missedMate: "Se te escaparon mates. Practica buscar jaques primero.",
      opening: "Tu patrón más repetido: errores de apertura. Sigue los principios básicos.",
      tempo: "Tu patrón más repetido: perder tiempo en la apertura. Desarrolla una pieza nueva en cada jugada.",
      other: "Tus errores fueron variados: entrena la costumbre de preguntarte qué quiere hacer tu rival.",
    };
    lines.push(msg[top[0]]);
  }
  return { lines, lesson };
}

export async function analyzeGame(
  engine: Engine,
  pgn: string,
  userColor: "w" | "b",
  onProgress: (done: number, total: number) => void,
  cancelled: () => boolean,
): Promise<Analysis | null> {
  const game = new Chess();
  game.loadPgn(pgn);
  const hist = game.history({ verbose: true });
  const fens = [hist[0]?.before ?? new Chess().fen(), ...hist.map((m) => m.after)];
  const n = fens.length;
  const pos: PosEval[] = [];

  for (let k = 0; k < n; k++) {
    if (cancelled()) return null;
    const c = new Chess(fens[k]);
    const turn = c.turn();
    let ev: PosEval;
    if (c.isCheckmate()) {
      ev = { cp: turn === "w" ? -3000 : 3000, mate: 0, best: "", stmCp: null, stmMate: null };
    } else if (c.isGameOver()) {
      ev = { cp: 0, mate: null, best: "", stmCp: 0, stmMate: null };
    } else {
      const r = await engine.search(fens[k], { depth: 11, movetime: 500, elo: null });
      const sign = turn === "w" ? 1 : -1;
      const raw = r.mate !== null ? (r.mate > 0 ? 1 : -1) * 3000 : (r.cp ?? 0);
      ev = {
        cp: raw * sign,
        mate: r.mate !== null ? r.mate * sign : null,
        best: r.best,
        stmCp: r.cp,
        stmMate: r.mate,
      };
    }
    pos.push(ev);
    onProgress(k + 1, n);
  }

  const reviews: MoveReview[] = hist.map((m, idx) => {
    const before = pos[idx];
    const after = pos[idx + 1];
    const sign = m.color === "w" ? 1 : -1;
    const wb = winPct(before.cp * sign);
    const wa = winPct(after.cp * sign);
    const uci = m.from + m.to + (m.promotion ?? "");
    const isBest = uci === before.best;
    const loss = isBest ? 0 : Math.max(0, wb - wa);
    const cls = classify(loss, isBest);
    const bc = new Chess(fens[idx]);
    const bm = tryMove(bc, before.best);
    const review: MoveReview = {
      ply: idx + 1,
      color: m.color,
      san: m.san,
      uci,
      fenBefore: fens[idx],
      bestUci: before.best,
      bestSan: bm?.san ?? m.san,
      evalBefore: Math.max(-1000, Math.min(1000, before.cp)),
      evalAfter: Math.max(-1000, Math.min(1000, after.cp)),
      mateBefore: before.mate,
      mateAfter: after.mate,
      winLoss: Math.round(loss * 10) / 10,
      cls,
    };
    if (m.color === userColor && (cls === "inaccuracy" || cls === "mistake" || cls === "blunder")) {
      const ex = explain({
        fenBefore: fens[idx],
        uci,
        bestUci: before.best,
        replyUci: after.best,
        ply: idx + 1,
        color: m.color,
        before,
        after,
        moverEvalBefore: before.cp * sign,
        moverEvalAfter: after.cp * sign,
      });
      review.theme = ex.theme;
      review.what = ex.what;
      review.better = ex.better;
      review.tip = ex.tip;
    }
    return review;
  });

  const accOf = (color: "w" | "b") => {
    const ms = reviews.filter((r) => r.color === color);
    if (!ms.length) return 100;
    return Math.round(ms.reduce((s, r) => s + moveAccuracy(r.winLoss), 0) / ms.length);
  };
  const accuracy = { w: accOf("w"), b: accOf("b") };
  const { lines, lesson } = buildSummary(reviews, userColor, accuracy[userColor]);

  return {
    version: 1,
    userColor,
    moves: reviews,
    evals: pos.map((p) => Math.max(-1000, Math.min(1000, p.cp))),
    accuracy,
    summary: lines,
    lesson,
  };
}
