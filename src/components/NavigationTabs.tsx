import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface NavigationTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
}

interface NavigationTabsProps {
  tabs: NavigationTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function NavigationTabs({ tabs, activeTab, onTabChange }: NavigationTabsProps) {
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div>
      {/* Mobile: dropdown */}
      <div className="sm:hidden">
        <label htmlFor="nav-tabs-select" className="sr-only">
          Select section
        </label>
        <div className="relative">
          <select
            id="nav-tabs-select"
            value={activeTab}
            onChange={(event) => onTabChange(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
                {tab.badge ? ` (${tab.badge})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        {active?.badge && (
          <span className="badge bg-blue-50 text-blue-700 mt-2">{active.badge}</span>
        )}
      </div>

      {/* Desktop: horizontal tabs */}
      <nav className="hidden sm:flex items-center gap-1 border-b border-slate-200" aria-label="Sections">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span
                  className={`badge ${
                    isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
