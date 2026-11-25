"use client";

import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

interface BoardProps {
  fen: string;
  orientation?: "w" | "b";
  /** Color que puede mover piezas. null/undefined = tablero solo de lectura. */
  movableColor?: "w" | "b" | null;
  onMove?: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  arrows?: Arrow[];
  marks?: { square: string; color: string }[];
}

const FILES = "abcdefgh";

function sqName(file: number, rank: number) {
  return FILES[file] + (rank + 1);
}

export default function Board({
  fen,
  orientation = "w",
  movableColor = null,
  onMove,
  lastMove,
  arrows = [],
  marks = [],
}: BoardProps) {
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: string; x: number; y: number; moved: boolean; startX: number; startY: number; size: number } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);

  // Reiniciar selección cuando cambia la posición
  useEffect(() => {
    setSelected(null);
    setDrag(null);
    setPromo(null);
  }, [fen]);

  const canMove = !!movableColor && chess.turn() === movableColor && !chess.isGameOver();

  const legalFromSelected = useMemo(() => {
    if (!selected || !canMove) return [];
    return chess.moves({ square: selected as Square, verbose: true });
  }, [selected, chess, canMove]);

  const dests = useMemo(() => new Set<string>(legalFromSelected.map((m) => m.to)), [legalFromSelected]);

  const kingInCheck = useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    for (const row of chess.board())
      for (const p of row) if (p && p.type === "k" && p.color === turn) return p.square;
    return null;
  }, [chess]);

  function tryMove(from: string, to: string) {
    const m = legalFromSelected.find((x) => x.from === from && x.to === to);
    const candidates = chess.moves({ square: from as Square, verbose: true }).filter((x) => x.to === to);
    if (!m && candidates.length === 0) return false;
    const mv = m ?? candidates[0];
    if (mv.promotion) {
      setPromo({ from, to });
      setSelected(null);
      return true;
    }
    setSelected(null);
    onMove?.(from, to);
    return true;
  }

  function squareFromPoint(x: number, y: number): string | null {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cx = Math.floor(((x - r.left) / r.width) * 8);
    const cy = Math.floor(((y - r.top) / r.height) * 8);
    if (cx < 0 || cx > 7 || cy < 0 || cy > 7) return null;
    const file = orientation === "w" ? cx : 7 - cx;
    const rank = orientation === "w" ? 7 - cy : cy;
    return sqName(file, rank);
  }

  function onSquareDown(sq: string, e: React.PointerEvent) {
    if (!canMove || promo) return;
    if (selected && dests.has(sq)) {
      tryMove(selected, sq);
      return;
    }
    const piece = chess.get(sq as Square);
    if (piece && piece.color === movableColor) {
      setSelected(sq);
      setDrag({
        from: sq,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        size: (boardRef.current?.getBoundingClientRect().width ?? 384) / 8,
      });
    } else {
      setSelected(null);
    }
  }

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      setDrag((d) =>
        d
          ? {
              ...d,
              x: e.clientX,
              y: e.clientY,
              moved: d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 6,
            }
          : d,
      );
    };
    const up = (e: PointerEvent) => {
      const d = drag;
      setDrag(null);
      if (d.moved) {
        const to = squareFromPoint(e.clientX, e.clientY);
        if (to && to !== d.from) {
          const ok = tryMove(d.from, to);
          if (!ok) setSelected(null);
        }
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.from, legalFromSelected, orientation]);

  const boardRows = chess.board();
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const file = orientation === "w" ? c : 7 - c;
      const rank = orientation === "w" ? 7 - r : r;
      const sq = sqName(file, rank);
      const piece = boardRows[7 - rank][file];
      const dark = (file + rank) % 2 === 0;
      const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
      const isSel = selected === sq;
      const isDest = dests.has(sq);
      const mark = marks.find((m) => m.square === sq);
      const hiding = drag?.moved && drag.from === sq;
      const showFile = r === 7;
      const showRank = c === 0;
      cells.push(
        <div
          key={sq}
          onPointerDown={(e) => onSquareDown(sq, e)}
          className="relative"
          style={{ background: dark ? "#739552" : "#ebecd0" }}
        >
          {isLast && <div className="absolute inset-0" style={{ background: "rgba(255, 230, 0, 0.38)" }} />}
          {isSel && <div className="absolute inset-0" style={{ background: "rgba(255, 235, 59, 0.55)" }} />}
          {mark && <div className="absolute inset-0" style={{ background: mark.color }} />}
          {kingInCheck === sq && (
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle, rgba(255,0,0,0.85) 0%, rgba(231,0,0,0.5) 40%, rgba(169,0,0,0) 75%)" }}
            />
          )}
          {showRank && (
            <span
              className="pointer-events-none absolute left-[3%] top-[2%] text-[clamp(8px,2.2vw,13px)] font-bold leading-none"
              style={{ color: dark ? "#ebecd0" : "#739552" }}
            >
              {rank + 1}
            </span>
          )}
          {showFile && (
            <span
              className="pointer-events-none absolute bottom-[2%] right-[4%] text-[clamp(8px,2.2vw,13px)] font-bold leading-none"
              style={{ color: dark ? "#ebecd0" : "#739552" }}
            >
              {FILES[file]}
            </span>
          )}
          {piece && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/pieces/${piece.color}${piece.type.toUpperCase()}.svg`}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ opacity: hiding ? 0.25 : 1 }}
            />
          )}
          {isDest && !piece && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25" />
          )}
          {isDest && piece && (
            <div className="pointer-events-none absolute inset-[4%] rounded-full border-[length:clamp(3px,0.9vw,6px)] border-black/25" />
          )}
        </div>,
      );
    }
  }

  const toXY = (sq: string) => {
    const file = FILES.indexOf(sq[0]);
    const rank = Number(sq[1]) - 1;
    const x = orientation === "w" ? file : 7 - file;
    const y = orientation === "w" ? 7 - rank : rank;
    return { x: x + 0.5, y: y + 0.5 };
  };

  const squareSize = drag?.size ?? 48;
  const dragPiece = drag?.moved ? chess.get(drag.from as Square) : null;

  return (
    <div className="relative w-full select-none" style={{ touchAction: "none" }}>
      <div
        ref={boardRef}
        className="relative grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-md shadow-xl shadow-black/50"
      >
        {cells}
        {arrows.length > 0 && (
          <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              {arrows.map((a, i) => (
                <marker key={i} id={`ah-${i}`} markerWidth="4" markerHeight="4" refX="2.2" refY="2" orient="auto">
                  <polygon points="0,0 4,2 0,4" fill={a.color ?? "rgba(255,170,0,0.9)"} />
                </marker>
              ))}
            </defs>
            {arrows.map((a, i) => {
              const f = toXY(a.from);
              const t = toXY(a.to);
              const dx = t.x - f.x;
              const dy = t.y - f.y;
              const len = Math.hypot(dx, dy) || 1;
              const sx = f.x + (dx / len) * 0.25;
              const sy = f.y + (dy / len) * 0.25;
              const ex = t.x - (dx / len) * 0.2;
              const ey = t.y - (dy / len) * 0.2;
              return (
                <line
                  key={i}
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke={a.color ?? "rgba(255,170,0,0.9)"}
                  strokeWidth="0.17"
                  strokeLinecap="round"
                  markerEnd={`url(#ah-${i})`}
                />
              );
            })}
          </svg>
        )}
        {promo && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <div className="flex gap-2 rounded-xl bg-[#262522] p-3 shadow-2xl">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const pr = promo;
                    setPromo(null);
                    onMove?.(pr.from, pr.to, p);
                  }}
                  className="h-14 w-14 rounded-lg bg-[#3c3a37] p-1 hover:bg-[#4a4845] sm:h-16 sm:w-16"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/pieces/${movableColor}${p.toUpperCase()}.svg`} alt={p} draggable={false} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {drag?.moved && dragPiece && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/pieces/${dragPiece.color}${dragPiece.type.toUpperCase()}.svg`}
          alt=""
          draggable={false}
          className="pointer-events-none fixed z-50"
          style={{
            width: squareSize * 1.15,
            height: squareSize * 1.15,
            left: drag.x - (squareSize * 1.15) / 2,
            top: drag.y - (squareSize * 1.15) / 2,
          }}
        />
      )}
    </div>
  );
}
