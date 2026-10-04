import type { EvidenceConnection } from "../models/research";

interface Point {
  x: number;
  y: number;
}

interface EvidenceConnectionLineProps {
  from: Point;
  to: Point;
  type: EvidenceConnection["relationshipType"];
  label?: string;
  /** Render a dashed line (inferred) vs solid (documented). */
  dashed?: boolean;
}

const TYPE_COLORS: Record<EvidenceConnection["relationshipType"], string> = {
  supports: "#16a34a", // green-600
  contradicts: "#dc2626", // red-600
  related: "#94a3b8", // slate-400
  depends_on: "#2563eb", // blue-600
};

/**
 * SVG line with an arrowhead connecting two claims on an evidence board.
 * Color encodes the relationship type; dashed lines indicate inferred
 * connections, solid lines documented ones.
 */
export default function EvidenceConnectionLine({
  from,
  to,
  type,
  label,
  dashed = false,
}: EvidenceConnectionLineProps) {
  const color = TYPE_COLORS[type];
  const markerId = `arrow-${type}-${dashed ? "dashed" : "solid"}`;
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  // Slight curve so parallel connections are distinguishable.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = midX - dy * 0.08;
  const cy = midY + dx * 0.08;

  return (
    <g aria-label={`${type.replace("_", " ")} connection${label ? `: ${label}` : ""}`}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <path
        d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? "6 4" : undefined}
        markerEnd={`url(#${markerId})`}
        opacity={0.85}
      />
      {label && (
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize={11}
        >
          {label}
        </text>
      )}
    </g>
  );
}
