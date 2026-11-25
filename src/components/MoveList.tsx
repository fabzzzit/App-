"use client";

import { useEffect, useRef } from "react";

interface Props {
  moves: string[];
  /** Número de jugadas aplicadas (ply actual). */
  current: number;
  onSelect?: (ply: number) => void;
  /** Color de marca por ply (1-indexado) */
  marks?: Record<number, string>;
}

export default function MoveList({ moves, current, onSelect, marks }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [moves.length]);

  const rows: { n: number; w?: string; b?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) rows.push({ n: i / 2 + 1, w: moves[i], b: moves[i + 1] });

  const cell = (san: string | undefined, ply: number) =>
    san ? (
      <button
        onClick={() => onSelect?.(ply)}
        className={`flex items-center gap-1 rounded px-2 py-1 text-left text-sm font-bold ${
          ply === current ? "bg-panel2 text-white" : "text-[#d6d2c8]"
        } ${onSelect ? "hover:bg-panel2" : "cursor-default"}`}
      >
        {marks?.[ply] && <span className="h-2 w-2 rounded-full" style={{ background: marks[ply] }} />}
        {san}
      </button>
    ) : (
      <span />
    );

  return (
    <div ref={ref} className="scroll-thin max-h-40 overflow-y-auto sm:max-h-64">
      {rows.length === 0 && <p className="py-2 text-sm text-muted">Aún no hay jugadas. ¡Mueve una pieza!</p>}
      {rows.map((r) => (
        <div key={r.n} className="grid grid-cols-[2rem_1fr_1fr] items-center text-sm">
          <span className="pl-1 text-xs text-muted">{r.n}.</span>
          {cell(r.w, r.n * 2 - 1)}
          {cell(r.b, r.n * 2)}
        </div>
      ))}
    </div>
  );
}
