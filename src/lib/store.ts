import type { Analysis } from "@/lib/analysis";

export interface StoredGame {
  id: number;
  botName: string;
  botElo: number;
  playerColor: "w" | "b";
  result: "win" | "loss" | "draw";
  reason: string;
  pgn: string;
  moves: number;
  analysis: Analysis | null;
  accuracy: number | null;
  createdAt: string;
}

const KEY = "mentorchess-games";
const MAX_GAMES = 100;

function readAll(): StoredGame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(games: StoredGame[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(games));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

export function listGames(): StoredGame[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getGame(id: number): StoredGame | null {
  return readAll().find((g) => g.id === id) ?? null;
}

export function saveGame(
  g: Omit<StoredGame, "id" | "createdAt" | "analysis" | "accuracy">,
): number {
  const all = readAll();
  const id = all.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  all.push({ ...g, id, analysis: null, accuracy: null, createdAt: new Date().toISOString() });
  all.sort((a, b) => b.id - a.id);
  writeAll(all.slice(0, MAX_GAMES));
  return id;
}

export function saveAnalysis(id: number, analysis: Analysis, accuracy: number) {
  const all = readAll();
  const g = all.find((x) => x.id === id);
  if (!g) return;
  g.analysis = analysis;
  g.accuracy = Math.round(accuracy) || 0;
  writeAll(all);
}
