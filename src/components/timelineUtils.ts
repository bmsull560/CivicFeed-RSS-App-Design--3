import {
  BookOpen,
  Building2,
  CheckSquare,
  Circle,
  DollarSign,
  Edit,
  Edit3,
  FileText,
  Gavel,
  Mic,
  Scale,
  Scroll,
  Star,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { TimelineEventType, ChangeType } from "../models/timeline";

/** Icon per timeline event type. */
export const EVENT_TYPE_ICONS: Record<TimelineEventType, LucideIcon> = {
  law_enacted: Scroll,
  law_amended: Edit,
  law_repealed: Trash2,
  regulation_proposed: FileText,
  regulation_final: CheckSquare,
  regulation_amended: Edit3,
  regulation_repealed: Trash2,
  executive_order: Star,
  guidance_issued: FileText,
  policy_changed: Edit3,
  court_filed: Gavel,
  court_decided: Scale,
  court_appealed: Gavel,
  court_overturned: Scale,
  agency_established: Building2,
  agency_reorganized: Building2,
  agency_abolished: Trash2,
  funding_appropriated: DollarSign,
  funding_allocated: DollarSign,
  grant_awarded: DollarSign,
  contract_awarded: FileText,
  person_appointed: UserPlus,
  person_resigned: UserPlus,
  person_confirmed: UserPlus,
  investigation_opened: FileText,
  report_published: BookOpen,
  hearing_held: Mic,
  other: Circle,
};

/** Tailwind classes per event type (badge / dot / border accent). */
export const EVENT_TYPE_COLORS: Record<TimelineEventType, string> = {
  law_enacted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  law_amended: "bg-amber-100 text-amber-800 border-amber-300",
  law_repealed: "bg-red-100 text-red-800 border-red-300",
  regulation_proposed: "bg-sky-100 text-sky-800 border-sky-300",
  regulation_final: "bg-blue-100 text-blue-800 border-blue-300",
  regulation_amended: "bg-amber-100 text-amber-800 border-amber-300",
  regulation_repealed: "bg-red-100 text-red-800 border-red-300",
  executive_order: "bg-violet-100 text-violet-800 border-violet-300",
  guidance_issued: "bg-cyan-100 text-cyan-800 border-cyan-300",
  policy_changed: "bg-amber-100 text-amber-800 border-amber-300",
  court_filed: "bg-slate-200 text-slate-800 border-slate-300",
  court_decided: "bg-indigo-100 text-indigo-800 border-indigo-300",
  court_appealed: "bg-slate-200 text-slate-800 border-slate-300",
  court_overturned: "bg-red-100 text-red-800 border-red-300",
  agency_established: "bg-teal-100 text-teal-800 border-teal-300",
  agency_reorganized: "bg-teal-100 text-teal-800 border-teal-300",
  agency_abolished: "bg-red-100 text-red-800 border-red-300",
  funding_appropriated: "bg-lime-100 text-lime-800 border-lime-300",
  funding_allocated: "bg-lime-100 text-lime-800 border-lime-300",
  grant_awarded: "bg-lime-100 text-lime-800 border-lime-300",
  contract_awarded: "bg-lime-100 text-lime-800 border-lime-300",
  person_appointed: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  person_resigned: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  person_confirmed: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
  investigation_opened: "bg-orange-100 text-orange-800 border-orange-300",
  report_published: "bg-cyan-100 text-cyan-800 border-cyan-300",
  hearing_held: "bg-orange-100 text-orange-800 border-orange-300",
  other: "bg-slate-100 text-slate-700 border-slate-300",
};

/** Badge classes per change type. */
export const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  added: "bg-emerald-100 text-emerald-800",
  removed: "bg-red-100 text-red-800",
  modified: "bg-amber-100 text-amber-800",
  renumbered: "bg-slate-100 text-slate-700",
  reinterpreted: "bg-violet-100 text-violet-800",
  delegated: "bg-sky-100 text-sky-800",
  exempted: "bg-cyan-100 text-cyan-800",
  expanded: "bg-emerald-100 text-emerald-800",
  restricted: "bg-red-100 text-red-800",
};

/** Human-readable label for an event type. */
export function formatEventType(type: TimelineEventType): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Human-readable label for a change type. */
export function formatChangeType(type: ChangeType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Format an ISO date for display. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
