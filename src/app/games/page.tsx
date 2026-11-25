"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { botByElo } from "@/lib/bots";
import { listGames } from "@/lib/store";

interface Item {
  id: number;
  botName: string;
  botElo: number;
  playerColor: "w" | "b";
  result: "win" | "loss" | "draw";
  reason: string;
  moves: number;
  accuracy: number | null;
  createdAt: string;
}

export default function GamesPage() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    setItems(listGames());
  }, []);

  const wins = items?.filter((g) => g.result === "win").length ?? 0;
  const losses = items?.filter((g) => g.result === "loss").length ?? 0;
  const draws = items?.filter((g) => g.result === "draw").length ?? 0;
  const accs = items?.filter((g) => g.accuracy) ?? [];
  const avg = accs.length ? Math.round(accs.reduce((s, g) => s + (g.accuracy ?? 0), 0) / accs.length) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Mis partidas</h1>
      <p className="mt-1 text-sm text-muted">Revisa cada partida con el entrenador para ver qué hiciste bien y qué debiste jugar.</p>

      {items && items.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["Victorias", wins, "text-brand"],
            ["Derrotas", losses, "text-red-400"],
            ["Tablas", draws, "text-yellow-400"],
            ["Precisión", avg !== null ? `${avg}%` : "—", "text-white"],
          ].map(([l, v, c]) => (
            <div key={l as string} className="card p-3">
              <div className={`text-xl font-extrabold ${c}`}>{v}</div>
              <div className="text-[11px] font-bold text-muted">{l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {items === null && <p className="py-10 text-center text-muted">Cargando…</p>}
        {items?.length === 0 && (
          <div className="card p-8 text-center">
            <div className="text-5xl">♟</div>
            <p className="mt-2 font-bold">Aún no jugaste ninguna partida.</p>
            <Link href="/play" className="btn btn-primary mt-4">
              Jugar ahora
            </Link>
          </div>
        )}
        {items?.map((g) => {
          const bot = botByElo(g.botElo);
          const color = g.result === "win" ? "bg-brand" : g.result === "loss" ? "bg-red-500" : "bg-yellow-500";
          return (
            <Link key={g.id} href={`/review?id=${g.id}`} className="card flex items-center gap-3 p-3 transition hover:bg-panel2">
              <span className={`h-12 w-1.5 rounded-full ${color}`} />
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-panel2 text-2xl">{bot.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">
                  {g.botName} <span className="text-sm font-bold text-muted">({g.botElo})</span>
                </div>
                <div className="truncate text-xs text-muted">
                  {g.result === "win" ? "Victoria" : g.result === "loss" ? "Derrota" : "Tablas"} · {g.reason} · {g.moves} jugadas ·{" "}
                  {g.playerColor === "w" ? "Blancas" : "Negras"}
                </div>
                <div className="text-[11px] text-muted">{new Date(g.createdAt).toLocaleString("es")}</div>
              </div>
              <div className="text-right">
                {g.accuracy ? (
                  <>
                    <div className="text-lg font-extrabold text-brand">{g.accuracy}%</div>
                    <div className="text-[10px] font-bold text-muted">precisión</div>
                  </>
                ) : (
                  <span className="rounded bg-brand/20 px-2 py-1 text-xs font-bold text-brand">Revisar</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
