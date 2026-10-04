import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  HelpCircle,
  LayoutGrid,
  FolderOpen,
  Lightbulb,
} from "lucide-react";
import NavigationTabs, { type NavigationTab } from "../components/NavigationTabs";
import ResearchBoard from "../components/ResearchBoard";
import SourceCollectionCard from "../components/SourceCollectionCard";
import FindingCard from "../components/FindingCard";
import ClaimCard from "../components/ClaimCard";
import EmptyState from "../components/EmptyState";
import { getResearchProjectView } from "../lib/domain";
import { formatDate } from "../components/timelineUtils";

const QUESTION_STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-600",
  investigating: "bg-blue-100 text-blue-700",
  answered: "bg-green-100 text-green-700",
  unanswerable: "bg-amber-100 text-amber-700",
};

export default function ResearchProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("questions");

  const project = useMemo(() => (id ? getResearchProjectView(id) : undefined), [id]);

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <EmptyState
          message="Research project not found"
          subMessage={`No project matches "${id ?? ""}".`}
        />
        <div className="mt-4 text-center">
          <Link to="/research" className="text-sm text-blue-600 hover:underline">
            Back to research workspace
          </Link>
        </div>
      </div>
    );
  }

  const tabs: NavigationTab[] = [
    {
      id: "questions",
      label: "Questions",
      icon: <HelpCircle className="h-4 w-4" aria-hidden="true" />,
      badge: String(project.questions.length),
    },
    {
      id: "boards",
      label: "Evidence Boards",
      icon: <LayoutGrid className="h-4 w-4" aria-hidden="true" />,
      badge: String(project.evidenceBoards.length),
    },
    {
      id: "sources",
      label: "Sources",
      icon: <FolderOpen className="h-4 w-4" aria-hidden="true" />,
      badge: String(project.sourceCollections.length),
    },
    {
      id: "findings",
      label: "Findings",
      icon: <Lightbulb className="h-4 w-4" aria-hidden="true" />,
      badge: String(project.findings.length),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Link
        to="/research"
        className="inline-flex items-center gap-1 rounded text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to research workspace
      </Link>

      <header className="mt-3">
        <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{project.description}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <div className="flex gap-1.5">
            <dt className="font-medium">Created</dt>
            <dd>{formatDate(project.createdAt.slice(0, 10))}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-medium">Updated</dt>
            <dd>{formatDate(project.updatedAt.slice(0, 10))}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-6">
        <NavigationTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="mt-6" role="tabpanel" aria-label={tabs.find((t) => t.id === activeTab)?.label}>
        {activeTab === "questions" &&
          (project.questions.length === 0 ? (
            <EmptyState message="No research questions yet" subMessage="Questions drive the investigation and anchor claims." />
          ) : (
            <ol className="space-y-4">
              {project.questions.map((question) => (
                <li
                  key={question.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                      {question.question}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium capitalize ${QUESTION_STATUS_STYLES[question.status]}`}
                    >
                      {question.status}
                    </span>
                  </div>
                  {question.claims.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Claims ({question.claims.length})
                      </h3>
                      {question.claims.map((claim) => (
                        <ClaimCard key={claim.id} claim={claim} compact showSources />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      No claims assembled for this question yet.
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ))}

        {activeTab === "boards" &&
          (project.evidenceBoards.length === 0 ? (
            <EmptyState message="No evidence boards yet" subMessage="Boards visually organize claims and their connections." />
          ) : (
            <div className="space-y-6">
              {project.evidenceBoards.map((board) => (
                <section key={board.id} aria-label={board.title}>
                  <h2 className="text-sm font-semibold text-slate-900">{board.title}</h2>
                  {board.description && (
                    <p className="mt-0.5 text-xs text-slate-500">{board.description}</p>
                  )}
                  <div className="mt-2">
                    <ResearchBoard board={board} />
                  </div>
                </section>
              ))}
            </div>
          ))}

        {activeTab === "sources" &&
          (project.sourceCollections.length === 0 ? (
            <EmptyState message="No source collections yet" subMessage="Curated collections keep primary sources organized." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {project.sourceCollections.map((collection) => (
                <SourceCollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          ))}

        {activeTab === "findings" &&
          (project.findings.length === 0 ? (
            <EmptyState message="No findings yet" subMessage="Findings synthesize the evidence into conclusions with confidence levels." />
          ) : (
            <div className="space-y-4">
              {project.findings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
