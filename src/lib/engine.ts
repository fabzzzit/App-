import { Chess } from "chess.js";

export interface LineInfo {
  move: string; // uci
  cp: number | null; // desde el punto de vista del bando que mueve
  mate: number | null;
}

export interface SearchResult {
  best: string;
  cp: number | null;
  mate: number | null;
  lines: LineInfo[];
}

interface SearchOpts {
  depth?: number;
  movetime?: number;
  multipv?: number;
  elo?: number | null; // null => fuerza máxima
}

/** Pequeño envoltorio UCI alrededor de Stockfish (WASM) corriendo en un Web Worker. */
export class Engine {
  private worker: Worker;
  private listeners = new Set<(line: string) => void>();
  private chain: Promise<unknown> = Promise.resolve();
  private ready: Promise<void>;
  private minElo = 1320;
  private maxElo = 3190;
  private dead = false;

  constructor() {
    this.worker = new Worker("/stockfish/sf.js");
    this.worker.onmessage = (e: MessageEvent) => {
      const line = String(e.data);
      this.listeners.forEach((l) => l(line));
    };
    this.ready = this.init();
  }

  private send(cmd: string) {
    if (!this.dead) this.worker.postMessage(cmd);
  }

  private waitFor(test: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const l = (line: string) => {
        if (test(line)) {
          this.listeners.delete(l);
          resolve(line);
        }
      };
      this.listeners.add(l);
    });
  }

  private async init() {
    const opts: string[] = [];
    const off = (line: string) => {
      if (line.startsWith("option name UCI_Elo")) {
        const min = /min (\d+)/.exec(line);
        const max = /max (\d+)/.exec(line);
        if (min) this.minElo = Number(min[1]);
        if (max) this.maxElo = Number(max[1]);
      }
      opts.push(line);
    };
    this.listeners.add(off);
    const ok = this.waitFor((l) => l === "uciok");
    this.send("uci");
    await ok;
    this.listeners.delete(off);
    this.send("setoption name Hash value 32");
    this.send("isready");
    await this.waitFor((l) => l === "readyok");
  }

  search(fen: string, o: SearchOpts): Promise<SearchResult> {
    const run = async (): Promise<SearchResult> => {
      await this.ready;
      const multipv = o.multipv ?? 1;
      this.send(`setoption name MultiPV value ${multipv}`);
      if (o.elo != null) {
        const elo = Math.max(this.minElo, Math.min(this.maxElo, o.elo));
        this.send("setoption name UCI_LimitStrength value true");
        this.send(`setoption name UCI_Elo value ${elo}`);
      } else {
        this.send("setoption name UCI_LimitStrength value false");
      }
      const byPv = new Map<number, LineInfo>();
      const onInfo = (line: string) => {
        if (!line.startsWith("info") || !line.includes(" pv ")) return;
        const mpv = Number(/multipv (\d+)/.exec(line)?.[1] ?? 1);
        const cp = /score cp (-?\d+)/.exec(line);
        const mate = /score mate (-?\d+)/.exec(line);
        const pv = /\spv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line);
        if (!pv || (!cp && !mate)) return;
        byPv.set(mpv, {
          move: pv[1],
          cp: cp ? Number(cp[1]) : null,
          mate: mate ? Number(mate[1]) : null,
        });
      };
      this.listeners.add(onInfo);
      this.send(`position fen ${fen}`);
      const parts = ["go"];
      if (o.depth) parts.push(`depth ${o.depth}`);
      if (o.movetime) parts.push(`movetime ${o.movetime}`);
      if (!o.depth && !o.movetime) parts.push("movetime 300");
      const done = this.waitFor((l) => l.startsWith("bestmove"));
      this.send(parts.join(" "));
      const bm = await done;
      this.listeners.delete(onInfo);
      const best = bm.split(" ")[1] ?? "";
      const lines = [...byPv.entries()].sort((a, b) => a[0] - b[0]).map((x) => x[1]);
      const top = lines[0];
      return { best, cp: top?.cp ?? null, mate: top?.mate ?? null, lines };
    };
    const p = this.chain.then(run, run);
    this.chain = p.catch(() => undefined);
    return p;
  }

  stop() {
    this.send("stop");
  }

  terminate() {
    this.dead = true;
    this.worker.terminate();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Elige la jugada del bot según su Elo (100 – 3500). Devuelve una jugada UCI. */
export async function chooseBotMove(engine: Engine, fen: string, elo: number): Promise<string> {
  const started = Date.now();
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (legal.length === 0) return "";
  const toUci = (m: { from: string; to: string; promotion?: string }) => m.from + m.to + (m.promotion ?? "");
  let move: string;

  if (elo < 1320) {
    // Por debajo del mínimo del motor: mezcla de jugadas al azar y jugadas "casi buenas".
    const t = Math.max(0, Math.min(1, (elo - 100) / 1200));
    const pRandom = 0.8 - 0.72 * t; // 100 → 80% azar, 1300 → 8% azar
    if (Math.random() < pRandom) {
      // Los bots flojos prefieren capturar, aunque sea mal.
      const caps = legal.filter((m) => m.isCapture());
      const pool = caps.length && Math.random() < 0.35 ? caps : legal;
      move = toUci(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      const r = await engine.search(fen, { depth: 2, multipv: Math.min(4, legal.length), elo: 1320 });
      const pick = Math.random();
      const idx = pick < 0.55 ? 0 : pick < 0.8 ? 1 : pick < 0.93 ? 2 : 3;
      move = (r.lines[Math.min(idx, r.lines.length - 1)] ?? { move: r.best }).move;
    }
  } else if (elo <= 3190) {
    const movetime = 250 + Math.round(((elo - 1320) / 1870) * 900);
    const r = await engine.search(fen, { movetime, elo });
    move = r.best;
  } else {
    const movetime = 900 + Math.round(((elo - 3190) / 310) * 1600);
    const ply = chess.history().length;
    if (ply < 8) {
      // Variedad en la apertura: elegir entre las mejores jugadas casi equivalentes.
      const r = await engine.search(fen, { movetime: 400, multipv: Math.min(3, legal.length), elo: null });
      const top = r.lines[0];
      const near = r.lines.filter(
        (l) => top && l.cp != null && top.cp != null && l.mate == null && top.cp - l.cp <= 25,
      );
      move = (near.length ? near[Math.floor(Math.random() * near.length)] : top ?? { move: r.best }).move;
    } else {
      const r = await engine.search(fen, { movetime, elo: null });
      move = r.best;
    }
  }

  const elapsed = Date.now() - started;
  if (elapsed < 450) await sleep(450 - elapsed);
  return move || toUci(legal[0]);
}
