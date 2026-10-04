import { CheckCircle, AlertCircle, XCircle, HelpCircle, Circle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EvidenceStatus } from "../models";

interface ProvenanceBadgeProps {
  status: EvidenceStatus;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; icon: LucideIcon; classes: string }
> = {
  documented: {
    label: "Documented",
    icon: CheckCircle,
    classes: "bg-green-50 text-green-700 border border-green-200",
  },
  inferred: {
    label: "Inferred",
    icon: AlertCircle,
    classes: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  },
  disputed: {
    label: "Disputed",
    icon: XCircle,
    classes: "bg-red-50 text-red-700 border border-red-200",
  },
  inconclusive: {
    label: "Inconclusive",
    icon: HelpCircle,
    classes: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  unverified: {
    label: "Unverified",
    icon: Circle,
    classes: "bg-slate-100 text-slate-600 border border-slate-200",
  },
};

const SIZE_CONFIG: Record<
  NonNullable<ProvenanceBadgeProps["size"]>,
  { badge: string; icon: number }
> = {
  sm: { badge: "px-1.5 py-0 text-[0.625rem] gap-1", icon: 10 },
  md: { badge: "px-2 py-0.5 text-[0.6875rem] gap-1", icon: 12 },
  lg: { badge: "px-2.5 py-1 text-xs gap-1.5", icon: 14 },
};

export default function ProvenanceBadge({ status, size = "md" }: ProvenanceBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={`badge ${config.classes} ${sizeConfig.badge}`}
      title={`Evidence status: ${config.label}`}
      aria-label={`Evidence status: ${config.label}`}
    >
      <Icon size={sizeConfig.icon} aria-hidden="true" />
      {config.label}
    </span>
  );
}
