import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "text" | "title" | "card" | "feed-card" | "entry-card" | "avatar" | "circular" | "rectangular";
  className?: string;
  style?: React.CSSProperties;
}

export function LoadingSkeleton({ variant = "text", className, style }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-[hsl(var(--muted))] rounded";

  const variantClasses = {
    text: "h-4 w-full",
    title: "h-6 w-3/4",
    card: "h-32 w-full rounded-[var(--radius)]",
    "feed-card": "h-28 w-full rounded-[var(--radius)]",
    "entry-card": "h-24 w-full rounded-[var(--radius)]",
    avatar: "h-10 w-10 rounded-full",
    circular: "h-10 w-10 rounded-full",
    rectangular: "h-20 w-full rounded-lg",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      aria-hidden="true"
    />
  );
}

export function LoadingSkeletonGroup({ count = 5, variant = "feed-card" }: { count?: number; variant?: LoadingSkeletonProps["variant"] }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
}