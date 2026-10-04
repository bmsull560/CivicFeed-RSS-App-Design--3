import { useCallback, useMemo, useRef, useState } from "react";
import { Maximize, Minus, Plus, Workflow } from "lucide-react";
import type { EvidenceBoard } from "../models/research";
import type { Claim, EvidenceStatus } from "../models/evidence";
import EvidenceConnectionLine from "./EvidenceConnectionLine";

const CARD_W = 240;
const CARD_H = 96;
const GRID_SIZE = 10;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

const STATUS_STYLES: Record<EvidenceStatus, string> = {
  documented: "bg-green-100 text-green-700",
  inferred: "bg-blue-100 text-blue-700",
  disputed: "bg-red-100 text-red-700",
  inconclusive: "bg-amber-100 text-amber-700",
  unverified: "bg-slate-100 text-slate-600",
};

interface NodePos {
  x: number;
  y: number;
}

interface ResearchBoardProps {
  board: EvidenceBoard;
  onClaimMove?: (claimId: string, x: number, y: number) => void;
}

/**
 * Visual evidence board canvas. Claims are positioned nodes; connections
 * are drawn as colored arrows. Click a card to select it, then move it
 * with the arrow keys. Drag empty space to pan; use the toolbar to zoom.
 */
export default function ResearchBoard({ board, onClaimMove }: ResearchBoardProps) {
  const initialNodes = useMemo(() => {
    const map = new Map<string, NodePos>();
    board.layout?.nodes.forEach((n) => map.set(n.claimId, { x: n.x, y: n.y }));
    // Auto-layout claims without a saved position in a grid.
    let i = 0;
    board.claims.forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, { x: 40 + (i % 3) * (CARD_W + 60), y: 40 + Math.floor(i / 3) * (CARD_H + 70) });
        i += 1;
      }
    });
    return map;
  }, [board]);

  const [nodes, setNodes] = useState(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(board.layout?.zoom ?? 1);
  const [pan, setPan] = useState<NodePos>({
    x: board.layout?.panX ?? 0,
    y: board.layout?.panY ?? 0,
  });
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ px: number; py: number; mx: number; my: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const positions = useMemo(() => {
    const map = new Map<string, NodePos>();
    nodes.forEach((v, k) => map.set(k, v));
    return map;
  }, [nodes]);

  const moveClaim = useCallback(
    (claimId: string, x: number, y: number) => {
      setNodes((prev) => {
        const next = new Map(prev);
        next.set(claimId, { x, y });
        return next;
      });
      onClaimMove?.(claimId, x, y);
    },
    [onClaimMove],
  );

  const handleKeyDown = (e: React.KeyboardEvent, claim: Claim) => {
    const pos = positions.get(claim.id);
    if (!pos) return;
    let { x, y } = pos;
    switch (e.key) {
      case "ArrowLeft": x -= GRID_SIZE; break;
      case "ArrowRight": x += GRID_SIZE; break;
      case "ArrowUp": y -= GRID_SIZE; break;
      case "ArrowDown": y += GRID_SIZE; break;
      case "Escape": setSelectedId(null); return;
      default: return;
    }
    e.preventDefault();
    moveClaim(claim.id, x, y);
  };

  const startPan = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.boardSurface) return;
    panStart.current = { px: pan.x, py: pan.y, mx: e.clientX, my: e.clientY };
    setPanning(true);
  };
  const onPanMove = (e: React.MouseEvent) => {
    if (!panStart.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.mx) / zoom,
      y: panStart.current.py + (e.clientY - panStart.current.my) / zoom,
    });
  };
  const endPan = () => {
    panStart.current = null;
    setPanning(false);
  };

  const zoomBy = (delta: number) =>
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((z + delta).toFixed(2)))));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const centerOf = (claimId: string): NodePos => {
    const p = positions.get(claimId);
    return p ? { x: p.x + CARD_W / 2, y: p.y + CARD_H / 2 } : { x: 0, y: 0 };
  };

  return (
    <section className="card overflow-hidden" aria-label={`Evidence board: ${board.title}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Workflow className="h-4 w-4 text-blue-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{board.title}</h3>
            {board.description && (
              <p className="text-xs text-slate-500 truncate">{board.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" role="toolbar" aria-label="Zoom controls">
          <button type="button" className="btn-secondary !px-2 !py-1.5" onClick={() => zoomBy(-0.2)} aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-medium text-slate-600" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className="btn-secondary !px-2 !py-1.5" onClick={() => zoomBy(0.2)} aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" className="btn-secondary !px-2 !py-1.5" onClick={resetView} aria-label="Reset zoom and pan">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={canvasRef}
        data-board-surface="true"
        className={`relative h-[520px] overflow-hidden bg-slate-50 ${panning ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x * zoom}px ${pan.y * zoom}px`,
        }}
        onMouseDown={startPan}
        onMouseMove={onPanMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
      >
        {board.claims.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No claims on this board yet.</p>
          </div>
        ) : (
          <div
            className="absolute left-0 top-0"
            style={{ transform: `translate(${pan.x * zoom}px, ${pan.y * zoom}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width={1}
              height={1}
              aria-hidden="true"
            >
              {board.connections.map((conn) => {
                if (!positions.has(conn.fromClaimId) || !positions.has(conn.toClaimId)) return null;
                const fromClaim = board.claims.find((c) => c.id === conn.fromClaimId);
                return (
                  <EvidenceConnectionLine
                    key={conn.id}
                    from={centerOf(conn.fromClaimId)}
                    to={centerOf(conn.toClaimId)}
                    type={conn.relationshipType}
                    label={conn.notes}
                    dashed={fromClaim?.evidenceStatus === "inferred"}
                  />
                );
              })}
            </svg>
            {board.claims.map((claim) => {
              const pos = positions.get(claim.id);
              if (!pos) return null;
              const selected = selectedId === claim.id;
              return (
                <button
                  key={claim.id}
                  type="button"
                  className={`absolute cursor-pointer rounded-lg border bg-white p-3 text-left shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    selected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200 hover:shadow-md"
                  }`}
                  style={{ left: pos.x, top: pos.y, width: CARD_W, minHeight: CARD_H }}
                  aria-pressed={selected}
                  aria-label={`Claim: ${claim.statement}. ${selected ? "Use arrow keys to move, Escape to deselect." : "Press Enter to select."}`}
                  onClick={() => setSelectedId(selected ? null : claim.id)}
                  onKeyDown={(e) => {
                    if (selected) {
                      handleKeyDown(e, claim);
                    } else if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(claim.id);
                    }
                  }}
                >
                  <p className="text-xs font-medium leading-snug text-slate-800 line-clamp-3">
                    {claim.statement}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`badge ${STATUS_STYLES[claim.evidenceStatus]}`}>
                      {claim.evidenceStatus}
                    </span>
                    <span className="text-[0.6875rem] text-slate-400">
                      {claim.sources.length} source{claim.sources.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedId && (
        <p className="border-t border-slate-100 bg-blue-50 px-4 py-2 text-xs text-blue-700" role="status">
          Claim selected — use arrow keys to move it ({GRID_SIZE}px steps), Escape to deselect.
        </p>
      )}
    </section>
  );
}
