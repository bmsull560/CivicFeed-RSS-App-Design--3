import { useMemo, useState } from "react";
import type { TimelineEvent, TimelineMode } from "../models/timeline";
import TimelineEventCard from "./TimelineEventCard";
import { formatDate } from "./timelineUtils";

export interface TimelineProps {
  events: TimelineEvent[];
  mode?: TimelineMode;
  onEventClick?: (e: TimelineEvent) => void;
}

/**
 * Vertical timeline with date markers on the left and color-coded event
 * cards on the right. Events are sorted by date descending. Clicking a card
 * expands its details; `onEventClick` is also fired for navigation.
 */
export default function Timeline({ events, mode, onEventClick }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [events]
  );

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No timeline events to display.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto" role="region" aria-label="Timeline">
      <ol className="relative min-w-0 space-y-4 border-l-2 border-slate-200 pl-6 md:pl-8">
        {sorted.map((event) => {
          const isExpanded = expandedId === event.id;
          return (
            <li key={event.id} className="relative">
              {/* Date marker on the rail */}
              <span
                className="absolute -left-6 top-4 hidden h-2 w-2 -translate-x-1/2 rounded-full bg-slate-400 md:block"
                aria-hidden="true"
              />
              <time
                dateTime={event.date}
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 md:absolute md:-left-8 md:top-3 md:mb-0 md:w-24 md:-translate-x-full md:text-right"
              >
                {formatDate(event.date)}
              </time>
              <div
                role={onEventClick ? "button" : undefined}
                tabIndex={onEventClick ? 0 : undefined}
                onClick={onEventClick ? () => onEventClick(event) : undefined}
                onKeyDown={
                  onEventClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onEventClick(event);
                        }
                      }
                    : undefined
                }
                className={
                  onEventClick
                    ? "cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    : undefined
                }
              >
                <TimelineEventCard
                  event={event}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : event.id)
                  }
                />
              </div>
            </li>
          );
        })}
      </ol>
      {mode && (
        <p className="mt-3 text-xs text-slate-400">
          Viewing {sorted.length} events ({mode} perspective)
        </p>
      )}
    </div>
  );
}
