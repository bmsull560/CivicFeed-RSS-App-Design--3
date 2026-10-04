import { useState } from "react";

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

interface Preset {
  label: string;
  getRange: () => { start: string; end: string };
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const PRESETS: Preset[] = [
  {
    label: "Last Year",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setFullYear(start.getFullYear() - 1);
      return { start: toISODate(start), end: toISODate(end) };
    },
  },
  {
    label: "Last 5 Years",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setFullYear(start.getFullYear() - 5);
      return { start: toISODate(start), end: toISODate(end) };
    },
  },
  {
    label: "Last Decade",
    getRange: () => {
      const end = new Date();
      const start = new Date(end);
      start.setFullYear(start.getFullYear() - 10);
      return { start: toISODate(start), end: toISODate(end) };
    },
  },
  {
    label: "All Time",
    getRange: () => ({ start: "", end: "" }),
  },
];

const INPUT_CLASSES =
  "rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

/**
 * Date-range filter with start/end inputs, Apply/Clear buttons, and
 * quick-select presets.
 */
export default function DateRangeFilter({
  startDate,
  endDate,
  onChange,
}: DateRangeFilterProps) {
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);

  const apply = () => onChange(draftStart, draftEnd);

  const clear = () => {
    setDraftStart("");
    setDraftEnd("");
    onChange("", "");
  };

  const applyPreset = (preset: Preset) => {
    const { start, end } = preset.getRange();
    setDraftStart(start);
    setDraftEnd(end);
    onChange(start, end);
  };

  return (
    <div
      className="card flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-end"
      role="group"
      aria-label="Filter timeline by date range"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="date-range-start"
          className="text-xs font-medium text-slate-600"
        >
          Start date
        </label>
        <input
          id="date-range-start"
          type="date"
          value={draftStart}
          onChange={(e) => setDraftStart(e.target.value)}
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="date-range-end"
          className="text-xs font-medium text-slate-600"
        >
          End date
        </label>
        <input
          id="date-range-end"
          type="date"
          value={draftEnd}
          onChange={(e) => setDraftEnd(e.target.value)}
          className={INPUT_CLASSES}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Clear
        </button>
      </div>
      <div
        className="flex flex-wrap gap-1 sm:ml-auto"
        role="group"
        aria-label="Date range presets"
      >
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="badge bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
