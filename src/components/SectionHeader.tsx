import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-800 leading-snug">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className="btn-secondary flex-shrink-0">
          {action.label}
        </button>
      )}
    </div>
  );
}
