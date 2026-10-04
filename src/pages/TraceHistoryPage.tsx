import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { GitBranch, ArrowLeft } from "lucide-react";
import TraceHistoryChain from "../components/TraceHistoryChain";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import SourceCard from "../components/SourceCard";
import { useState } from "react";
import type { TraceHistoryNode } from "../models/timeline";
import { getTraceHistoryView } from "../lib/domain";
import { formatDate } from "../components/timelineUtils";

export default function TraceHistoryPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [selectedNode, setSelectedNode] = useState<TraceHistoryNode | null>(null);

  const view = useMemo(
    () => (topicId ? getTraceHistoryView(topicId) : undefined),
    [topicId]
  );

  if (!view) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <EmptyState
          message="Topic not found"
          subMessage={`No topic matches "${topicId ?? ""}".`}
          action={{ label: "Back to timeline", onClick: () => window.history.back() }}
        />
      </div>
    );
  }

  const rootNode = view.root;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link
        to="/timeline"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to timeline
      </Link>

      <div className="mt-3">
        <SectionHeader
          title={`Trace History: ${view.topicName}`}
          subtitle="Provenance chain from the current rule back to its original legal authority. The current rule appears at the top; the original authority at the bottom."
          icon={<GitBranch className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          {rootNode ? (
            <TraceHistoryChain rootNode={rootNode} onNodeClick={setSelectedNode} />
          ) : (
            <EmptyState
              message="No clear trace chain for this topic"
              subMessage="A trace chain requires at least two dated legal authorities (statutes or regulations). This topic's record does not yet include enough dated authorities to reconstruct the chain."
            />
          )}
        </div>

        <aside aria-label="Node details" className="lg:sticky lg:top-6 lg:self-start">
          {selectedNode ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">{selectedNode.title}</h2>
              <dl className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">Role</dt>
                  <dd className="capitalize">{selectedNode.type.replace(/_/g, " ")}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 font-medium text-slate-500">Date</dt>
                  <dd>{formatDate(selectedNode.date)}</dd>
                </div>
                {selectedNode.changeType && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 font-medium text-slate-500">Change</dt>
                    <dd className="capitalize">{selectedNode.changeType}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {selectedNode.description}
              </p>
              {selectedNode.changeDescription && (
                <p className="mt-2 text-xs italic text-slate-500">
                  {selectedNode.changeDescription}
                </p>
              )}
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Documenting source
                </h3>
                <div className="mt-2">
                  <SourceCard source={selectedNode.source} compact showPassage />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Select a node in the chain to view its details and documenting source.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
