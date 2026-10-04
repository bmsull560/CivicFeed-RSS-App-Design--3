import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import ResearchProjectCard from "../components/ResearchProjectCard";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import { listResearchProjects } from "../lib/domain";

export default function ResearchWorkspacePage() {
  const navigate = useNavigate();
  const [placeholderNotice, setPlaceholderNotice] = useState(false);

  const projects = useMemo(() => listResearchProjects(), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SectionHeader
        title="Research Workspace"
        subtitle="Evidence-first research projects: questions, claims, evidence boards, curated sources, and synthesized findings."
        icon={<FlaskConical className="h-5 w-5" aria-hidden="true" />}
        action={{
          label: "New Project",
          onClick: () => setPlaceholderNotice(true),
        }}
      />

      {placeholderNotice && (
        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700" role="status">
          Project creation is a placeholder in this demo and is not yet available.
        </p>
      )}

      <p className="mt-4 text-sm text-slate-500" aria-live="polite">
        <span className="font-semibold text-slate-700">{projects.length}</span> project
        {projects.length === 1 ? "" : "s"}
      </p>

      {projects.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="No research projects yet"
            subMessage="Create a project to start organizing questions, evidence, and findings."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ResearchProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/research/${project.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
