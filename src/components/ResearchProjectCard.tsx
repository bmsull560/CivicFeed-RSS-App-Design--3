import { BookOpen, HelpCircle, Layers, Lightbulb } from "lucide-react";
import type { ResearchProject, ResearchQuestion } from "../models/research";

const QUESTION_STATUS_STYLES: Record<ResearchQuestion["status"], string> = {
  open: "bg-slate-100 text-slate-600",
  investigating: "bg-blue-100 text-blue-700",
  answered: "bg-green-100 text-green-700",
  unanswerable: "bg-amber-100 text-amber-700",
};

interface ResearchProjectCardProps {
  project: ResearchProject;
  onClick?: () => void;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5" title={label} aria-label={`${value} ${label}`}>
      {icon}
      <span className="text-xs font-semibold text-slate-700">{value}</span>
      <span className="text-[0.6875rem] text-slate-400">{label}</span>
    </div>
  );
}

/** Summary card for a research project. */
export default function ResearchProjectCard({ project, onClick }: ResearchProjectCardProps) {
  const claimCount = project.questions.reduce((n, q) => n + q.claims.length, 0);
  const sourceCount = project.sourceCollections.reduce((n, c) => n + c.sources.length, 0);
  const questionStatuses = project.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});

  const Wrapper: React.ElementType = onClick ? "button" : "article";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${onClick ? "card-hover w-full text-left cursor-pointer" : "card"} p-5`}
      aria-label={`Research project: ${project.title}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{project.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
            {project.description}
          </p>
        </div>
        <time className="shrink-0 text-[0.6875rem] text-slate-400" dateTime={project.updatedAt}>
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </time>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
        <Stat icon={<HelpCircle className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />} value={project.questions.length} label="questions" />
        <Stat icon={<Layers className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />} value={claimCount} label="claims" />
        <Stat icon={<BookOpen className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />} value={sourceCount} label="sources" />
        <Stat icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />} value={project.findings.length} label="findings" />
      </div>

      {project.questions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Question status summary">
          {(Object.entries(questionStatuses) as [ResearchQuestion["status"], number][]).map(
            ([status, count]) => (
              <span key={status} className={`badge ${QUESTION_STATUS_STYLES[status]}`}>
                {count} {status}
              </span>
            ),
          )}
        </div>
      )}
    </Wrapper>
  );
}
