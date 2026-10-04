import { useMemo, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import Timeline from "../components/Timeline";
import DateRangeFilter from "../components/DateRangeFilter";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import SourceCard from "../components/SourceCard";
import type { TimelineEvent, TimelineMode } from "../models/timeline";
import { getTimelineView } from "../lib/domain";
import { formatDate } from "../components/timelineUtils";

const MODES: { value: TimelineMode | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chronological", label: "Chronological" },
  { value: "legislative", label: "Legislative" },
  { value: "regulatory", label: "Regulatory" },
  { value: "judicial", label: "Judicial" },
  { value: "administrative", label: "Administrative" },
  { value: "funding", label: "Funding" },
  { value: "organizational", label: "Organizational" },
];

export default function TimelinePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mode, setMode] = useState<TimelineMode | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const allEvents = useMemo(() => getTimelineView().events, []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (mode !== "all" && mode !== "chronological" && event.mode !== mode) return false;
      if (startDate && event.date < startDate) return false;
      if (endDate && event.date > endDate) return false;
      return true;
    });
  }, [allEvents, mode, startDate, endDate]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <SectionHeader
        title="Timeline"
        subtitle="Chronological view of civic events across all tracked topics — legislation, regulation, court decisions, and funding actions."
        icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
      />

      <div className="mt-6 space-y-4">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
        />

        <fieldset>
          <legend className="sr-only">Timeline mode</legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Timeline mode">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                aria-pressed={mode === m.value}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  mode === m.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-slate-500" aria-live="polite">
          Showing <span className="font-semibold text-slate-700">{filteredEvents.length}</span>{" "}
          of {allEvents.length} events
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          {filteredEvents.length === 0 ? (
            <EmptyState
              message="No events match the current filters"
              subMessage="Try widening the date range or choosing a different mode."
              action={{
                label: "Clear filters",
                onClick: () => {
                  setStartDate("");
                  setEndDate("");
                  setMode("all");
                },
              }}
            />
          ) : (
            <Timeline
              events={filteredEvents}
              mode={mode === "all" ? undefined : mode}
              onEventClick={setSelectedEvent}
            />
          )}
        </div>

        <aside aria-label="Event details" className="lg:sticky lg:top-6 lg:self-start">
          {selectedEvent ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{selectedEvent.title}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close event details"
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <dl className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-slate-500">Date</dt>
                  <dd>{formatDate(selectedEvent.date)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-slate-500">Mode</dt>
                  <dd className="capitalize">{selectedEvent.mode}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-slate-500">Significance</dt>
                  <dd>
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium capitalize text-slate-600">
                      {selectedEvent.significance}
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {selectedEvent.description}
              </p>
              {selectedEvent.sources.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sources ({selectedEvent.sources.length})
                  </h3>
                  <div className="mt-2 space-y-2">
                    {selectedEvent.sources.map((source) => (
                      <SourceCard key={source.id} source={source} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Select an event to view its details and sources.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
