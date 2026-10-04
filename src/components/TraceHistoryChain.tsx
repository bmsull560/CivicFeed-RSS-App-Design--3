import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  Landmark,
  Pencil,
  FileText,
  BookMarked,
  Scroll,
  type LucideIcon,
} from "lucide-react";
import type { TraceHistoryNode } from "../models/timeline";
import {
  CHANGE_TYPE_COLORS,
  formatChangeType,
  formatDate,
} from "./timelineUtils";

export interface TraceHistoryChainProps {
  rootNode: TraceHistoryNode;
  onNodeClick?: (node: TraceHistoryNode) => void;
}

const NODE_TYPE_ICONS: Record<TraceHistoryNode["type"], LucideIcon> = {
  current_rule: FileText,
  recent_amendment: Pencil,
  prior_regulation: BookMarked,
  agency_guidance: GitBranch,
  statutory_authority: Landmark,
  original_authority: Scroll,
};

const NODE_TYPE_LABELS: Record<TraceHistoryNode["type"], string> = {
  current_rule: "Current Rule",
  recent_amendment: "Recent Amendment",
  prior_regulation: "Prior Regulation",
  agency_guidance: "Agency Guidance",
  statutory_authority: "Statutory Authority",
  original_authority: "Original Authority",
};

const NODE_TYPE_COLORS: Record<TraceHistoryNode["type"], string> = {
  current_rule: "bg-blue-100 text-blue-800 border-blue-300",
  recent_amendment: "bg-amber-100 text-amber-800 border-amber-300",
  prior_regulation: "bg-cyan-100 text-cyan-800 border-cyan-300",
  agency_guidance: "bg-violet-100 text-violet-800 border-violet-300",
  statutory_authority: "bg-emerald-100 text-emerald-800 border-emerald-300",
  original_authority: "bg-teal-100 text-teal-800 border-teal-300",
};

interface ChainNodeProps {
  node: TraceHistoryNode;
  depth: number;
  onNodeClick?: (node: TraceHistoryNode) => void;
}

function ChainNode({ node, depth, onNodeClick }: ChainNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = NODE_TYPE_ICONS[node.type];
  const colors = NODE_TYPE_COLORS[node.type];

  return (
    <li className="relative">
      {/* Connector line to next node */}
      <span
        className="absolute left-4 top-10 h-[calc(100%-2rem)] w-0.5 bg-slate-200"
        aria-hidden="true"
      />
      <div className="relative flex gap-3 pb-4">
        <span
          className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${colors}`}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="card min-w-0 flex-1 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge border ${colors}`}>
              {NODE_TYPE_LABELS[node.type]}
            </span>
            {node.changeType && (
              <span className={`badge ${CHANGE_TYPE_COLORS[node.changeType]}`}>
                {formatChangeType(node.changeType)}
              </span>
            )}
            <time
              dateTime={node.date}
              className="text-xs text-slate-500"
            >
              {formatDate(node.date)}
            </time>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsExpanded((v) => !v);
              onNodeClick?.(node);
            }}
            aria-expanded={isExpanded}
            className="mt-1 flex w-full items-center justify-between gap-2 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <h4 className="text-sm font-semibold text-slate-900">
              {node.title}
            </h4>
            {isExpanded ? (
              <ChevronUp
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            )}
          </button>

          <p className="mt-1 text-sm text-slate-600">{node.description}</p>

          {isExpanded && (
            <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
              {node.changeDescription && (
                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Change:</span>{" "}
                  {node.changeDescription}
                </p>
              )}
              <a
                href={node.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {node.source.title}
              </a>
              {node.source.relevantPassage && (
                <blockquote className="border-l-2 border-slate-200 pl-2 text-xs italic text-slate-500">
                  {node.source.relevantPassage}
                </blockquote>
              )}
            </div>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <ol
          className={depth > 0 ? "ml-8" : ""}
          aria-label={`Earlier history of ${node.title}`}
        >
          {node.children.map((child) => (
            <ChainNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

/**
 * Reverse-chronological provenance chain from the current rule back to the
 * original statutory authority, rendered as a connected vertical chain.
 */
export default function TraceHistoryChain({
  rootNode,
  onNodeClick,
}: TraceHistoryChainProps) {
  return (
    <div role="region" aria-label="Trace history provenance chain">
      <ol className="p-1">
        <ChainNode node={rootNode} depth={0} onNodeClick={onNodeClick} />
      </ol>
    </div>
  );
}
