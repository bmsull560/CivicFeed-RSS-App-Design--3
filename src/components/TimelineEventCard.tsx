import { CalendarDays, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { TimelineEvent } from "../models/timeline";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_ICONS,
  formatDate,
  formatEventType,
} from "./timelineUtils";

export interface TimelineEventCardProps {
  event: TimelineEvent;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const SIGNIFICANCE_DOT: Record<TimelineEvent["significance"], string> = {
  milestone: "h-3.5 w-3.5 ring-4 ring-blue-100",
  major: "h-2.5 w-2.5",
  minor: "h-1.5 w-1.5",
};

/**
 * A single event within the vertical timeline. Collapsed view shows the
 * essentials; expanded view reveals full description, sources, and entities.
 */
export default function TimelineEventCard({
  event,
  isExpanded = false,
  onToggle,
}: TimelineEventCardProps) {
  const Icon = EVENT_TYPE_ICONS[event.eventType] ?? EVENT_TYPE_ICONS.other;
  const colors = EVENT_TYPE_COLORS[event.eventType];
  const dateRange = event.endDate
    ? `${formatDate(event.date)} – ${formatDate(event.endDate)}`
    : formatDate(event.date);

  return (
    <article
      className={`card border-l-4 ${colors.split(" ")[2]} p-4`}
      aria-label={`${event.title} (${dateRange})`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 shrink-0 rounded-full bg-blue-600 ${SIGNIFICANCE_DOT[event.significance]}`}
          title={`Significance: ${event.significance}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge border ${colors}`}>
              <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
              {formatEventType(event.eventType)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              <time dateTime={event.date}>{dateRange}</time>
            </span>
          </div>

          <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
            {event.title}
          </h3>
          <p
            className={`mt-1 text-sm text-slate-600 ${
              isExpanded ? "" : "line-clamp-2"
            }`}
          >
            {event.description}
          </p>

          {isExpanded && (
            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              {event.location && (
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">Location:</span>{" "}
                  {event.location}
                </p>
              )}
              {event.entities.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-700">
                    Entities involved
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {event.entities.map((entity) => (
                      <span
                        key={entity}
                        className="badge bg-slate-100 text-slate-700"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {event.sources.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-slate-700">
                    Sources
                  </h4>
                  <ul className="mt-1 space-y-1">
                    {event.sources.map((source) => (
                      <li key={source.id}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <ExternalLink
                            className="h-3 w-3 shrink-0"
                            aria-hidden="true"
                          />
                          {source.title}
                          <span className="text-slate-400">
                            ({formatDate(source.publicationDate)})
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? `Collapse details for ${event.title}`
                : `Expand details for ${event.title}`
            }
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
