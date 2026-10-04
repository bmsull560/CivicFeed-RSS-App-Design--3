import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Clock, Tag, ArrowRight } from "lucide-react";
import { listTopicCards } from "../lib/domain";
import SearchBar from "../components/SearchBar";
import EmptyState from "../components/EmptyState";

export default function ExplorePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listTopicCards();
    return listTopicCards().filter(
      (topic) =>
        topic.name.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.categories.some((c) => c.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-center gap-2.5">
          <Compass size={22} className="text-blue-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900">Explore Topics</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {listTopicCards().length} curated civic research topics — each backed by primary sources,
          entities, and a cross-referenced timeline.
        </p>
        <div className="mt-4 max-w-md">
          <SearchBar
            placeholder="Search topics by name, description, or category…"
            value={query}
            onChange={setQuery}
            onSearch={setQuery}
          />
        </div>
      </section>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => navigate(`/topic/${topic.slug}`)}
              className="card p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-700">
                {topic.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-3">{topic.description}</p>
              <div className="flex flex-wrap items-center gap-1 mt-3">
                <Tag size={12} className="text-slate-400" aria-hidden="true" />
                {topic.categories.slice(0, 3).map((category) => (
                  <span key={category} className="badge bg-slate-100 text-slate-600">{category}</span>
                ))}
                {topic.categories.length > 3 && (
                  <span className="badge bg-slate-100 text-slate-500">
                    +{topic.categories.length - 3}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} className="text-slate-400" aria-hidden="true" />
                  {topic.eventCount} event{topic.eventCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:gap-1.5 transition-all">
                  View topic <ArrowRight size={13} aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState
            message={`No topics match "${query}"`}
            subMessage="Try a different search term or browse all topics."
            action={{ label: "Clear Search", onClick: () => setQuery("") }}
          />
        </div>
      )}
    </div>
  );
}
