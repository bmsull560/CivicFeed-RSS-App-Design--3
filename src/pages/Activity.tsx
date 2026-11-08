import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Zap, Info, RefreshCw, Filter, X } from "lucide-react";
import { useUserFeeds } from "../hooks/useUserFeeds";
import { getPreferences } from "../lib/userData";
import { thematicHubs } from "../lib/hubs";
import EmptyState from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { FeedHealth } from "../types";
import { cn } from "@/lib/utils";

type UrgencyLevel = "alert" | "high" | "update" | "announcement";

interface ActivityItem {
  id: string;
  type: "feed-health" | "new-article" | "ai-tag" | "recap" | "system";
  urgency: UrgencyLevel;
  title: string;
  description: string;
  timestamp: number;
  feedId?: string;
  feedName?: string;
  entryId?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
}

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  alert: 4,
  high: 3,
  update: 2,
  announcement: 1,
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  alert: "Alert",
  high: "High",
  update: "Update",
  announcement: "Announcement",
};

const URGENCY_ICONS: Record<UrgencyLevel, React.ReactNode> = {
  alert: <AlertTriangle size={14} className="text-[hsl(var(--destructive))]" />,
  high: <Zap size={14} className="text-[hsl(var(--warning))]" />,
  update: <Info size={14} className="text-[hsl(var(--primary))]" />,
  announcement: <Bell size={14} className="text-[hsl(var(--muted-foreground))]" />,
};

const URGENCY_BADGES: Record<UrgencyLevel, string> = {
  alert: "urgency-alert",
  high: "urgency-high",
  update: "urgency-update",
  announcement: "urgency-announcement",
};

export default function Activity() {
  const navigate = useNavigate();
  const { enabledFeeds } = useUserFeeds();
  const preferences = getPreferences();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrgencies, setSelectedUrgencies] = useState<UrgencyLevel[]>(["alert", "high", "update", "announcement"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");

  // Fetch data for activity generation
  useEffect(() => {
    const generateActivity = async () => {
      setLoading(true);
      const newItems: ActivityItem[] = [];
      const now = Date.now();
      const timeRangeMs = timeRange === "24h" ? 24 * 60 * 60 * 1000 : timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : timeRange === "30d" ? 30 * 24 * 60 * 60 * 1000 : Infinity;

      try {
        // 1. Feed health alerts (from backend)
        for (const feed of enabledFeeds) {
          try {
            const res = await fetch(`/api/feeds/${feed.id}/health`, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              const health: FeedHealth = await res.json();
              if (health.status === "fail" && health.lastValidatedAt > now - timeRangeMs) {
                newItems.push({
                  id: `health-${feed.id}-${health.lastValidatedAt}`,
                  type: "feed-health",
                  urgency: "alert",
                  title: `Feed Unavailable: ${feed.shortName}`,
                  description: `${feed.agency} — ${health.error || "Feed health check failed"}`,
                  timestamp: health.lastValidatedAt,
                  feedId: feed.id,
                  feedName: feed.shortName,
                  actionUrl: `/feed/${feed.id}`,
                  actionLabel: "View Feed",
                  metadata: { health },
                });
              } else if (health.status === "warn" && health.lastValidatedAt > now - timeRangeMs) {
                newItems.push({
                  id: `health-warn-${feed.id}-${health.lastValidatedAt}`,
                  type: "feed-health",
                  urgency: "announcement",
                  title: `Feed Degraded: ${feed.shortName}`,
                  description: `${feed.agency} — Some health checks are warning`,
                  timestamp: health.lastValidatedAt,
                  feedId: feed.id,
                  feedName: feed.shortName,
                  actionUrl: `/feed/${feed.id}`,
                  actionLabel: "View Feed",
                  metadata: { health },
                });
              }
            }
          } catch {
            // Ignore individual feed health fetch errors
          }
        }

        // 2. Recent articles in followed feeds/hubs
        try {
          const res = await fetch(`/api/articles/recent?limit=100`, { signal: AbortSignal.timeout(10000) });
          if (res.ok) {
            const data = await res.json();
            const articles = data.results || [];
            const followedCategories = new Set(
              thematicHubs.filter((h) => preferences.followedHubs?.includes(h.key)).flatMap((h) => h.categories)
            );
            const followedFeedIds = new Set(
              enabledFeeds.filter((f) => f.userAdded === true || followedCategories.has(f.category)).map((f) => f.id)
            );

            for (const article of articles) {
              if (article.pubDate && new Date(article.pubDate).getTime() > now - timeRangeMs) {
                const isFollowed = followedFeedIds.has(article.feedId);
                const hasUrgentTags = article.aiTags?.some((tag: string) =>
                  ["breaking", "urgent", "emergency", "alert", "critical"].some((t) => tag.toLowerCase().includes(t))
                );

                if (isFollowed || hasUrgentTags) {
                  newItems.push({
                    id: `article-${article.entryId}`,
                    type: "new-article",
                    urgency: hasUrgentTags ? "high" : "update",
                    title: article.title,
                    description: `${article.feedName} — ${new Date(article.pubDate).toLocaleDateString()}`,
                    timestamp: new Date(article.pubDate).getTime(),
                    feedId: article.feedId,
                    feedName: article.feedName,
                    entryId: article.entryId,
                    actionUrl: `/entry/${article.feedId}/${encodeURIComponent(article.entryId)}`,
                    actionLabel: "Read Article",
                    metadata: { aiTags: article.aiTags, aiSummary: article.aiSummary },
                  });
                }
              }
            }
          }
        } catch {
          // Ignore recent articles fetch errors
        }

        // 3. Recap generated
        try {
          const res = await fetch(`/api/recap?days=7`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const recap = await res.json();
            if (recap.generatedAt && recap.generatedAt > now - timeRangeMs) {
              newItems.push({
                id: `recap-${recap.generatedAt}`,
                type: "recap",
                urgency: "announcement",
                title: "Weekly Recap Ready",
                description: `${recap.totalArticles} articles across ${recap.categories?.length || 0} categories`,
                timestamp: recap.generatedAt,
                actionUrl: "/recap",
                actionLabel: "View Recap",
                metadata: { recap },
              });
            }
          }
        } catch {
          // Ignore recap fetch errors
        }

        // Sort by urgency then timestamp
        newItems.sort((a, b) => {
          const urgencyDiff = URGENCY_ORDER[b.urgency] - URGENCY_ORDER[a.urgency];
          if (urgencyDiff !== 0) return urgencyDiff;
          return b.timestamp - a.timestamp;
        });

        setItems(newItems);
      } finally {
        setLoading(false);
      }
    };

    generateActivity();
  }, [enabledFeeds, preferences.followedHubs, timeRange]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!selectedUrgencies.includes(item.urgency)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.type)) return false;
      return true;
    });
  }, [items, selectedUrgencies, selectedTypes]);

  // Get unique types for filter
  const availableTypes = useMemo(() => {
    const types = new Set(items.map((i) => i.type));
    return Array.from(types).sort();
  }, [items]);

  const handleUrgencyToggle = (urgency: UrgencyLevel) => {
    setSelectedUrgencies((prev) =>
      prev.includes(urgency) ? prev.filter((u) => u !== urgency) : [...prev, urgency]
    );
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedUrgencies(["alert", "high", "update", "announcement"]);
    setSelectedTypes([]);
    setTimeRange("7d");
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Bell size={24} className="text-[hsl(var(--primary))]" />
            Activity
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Derived from feed health, new articles in followed feeds, AI tags, and system status.
            <a href="/settings?tab=activity" className="text-[hsl(var(--primary))] hover:underline ml-1">Configure →</a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Urgency filter */}
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Urgency</label>
          <div className="flex flex-wrap gap-2">
            {(["alert", "high", "update", "announcement"] as UrgencyLevel[]).map((urgency) => (
              <Button
                key={urgency}
                type="button"
                variant={selectedUrgencies.includes(urgency) ? "default" : "outline"}
                size="sm"
                onClick={() => handleUrgencyToggle(urgency)}
                className={cn("gap-1", selectedUrgencies.includes(urgency) && URGENCY_BADGES[urgency])}
              >
                {URGENCY_ICONS[urgency]}
                {URGENCY_LABELS[urgency]}
              </Button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        {availableTypes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="w-full justify-start">
                  <Filter size={14} />
                  {selectedTypes.length === 0 ? "All types" : `${selectedTypes.length} selected`}
                  <X size={14} className="ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => handleTypeToggle(type)}
                      className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    />
                    <span className="capitalize">{type.replace("-", " ")}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Time range */}
        <div>
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">Time Range</label>
          <div className="flex flex-wrap gap-2">
            {(["24h", "7d", "30d", "all"] as const).map((range) => (
              <Button
                key={range}
                type="button"
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === "24h" ? "Last 24h" : range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "All time"}
              </Button>
            ))}
          </div>
        </div>

        {(selectedUrgencies.length < 4 || selectedTypes.length > 0 || timeRange !== "7d") && (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            <X size={14} /> Clear filters
          </Button>
        )}
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading activity">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-[hsl(var(--muted))] rounded" />
                  <div className="h-3 w-1/2 bg-[hsl(var(--muted))] rounded" />
                  <div className="h-3 w-1/3 bg-[hsl(var(--muted))] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          variant="no-activity"
          action={{ label: "Adjust Filters", onClick: clearFilters }}
        />
      ) : (
        <div className="space-y-3" role="feed" aria-label="Activity feed">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="card p-4 hover:shadow-[var(--elevation-2)] transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[hsl(var(--muted))]">
                  {URGENCY_ICONS[item.urgency]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-[hsl(var(--foreground))] truncate">{item.title}</h3>
                        <span className={cn("badge text-[0.625rem]", URGENCY_BADGES[item.urgency])}>
                          {URGENCY_LABELS[item.urgency]}
                        </span>
                        {item.feedName && (
                          <span className="badge-outline text-[0.625rem]">{item.feedName}</span>
                        )}
                      </div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{item.description}</p>
                      {item.metadata?.aiSummary && (
                        <p className="text-sm text-[hsl(var(--foreground))] mt-2 italic bg-[hsl(var(--accent))] p-2 rounded">
                          {item.metadata.aiSummary}
                        </p>
                      )}
                    </div>
                    <time className="text-[0.6875rem] text-[hsl(var(--muted-foreground))] whitespace-nowrap flex-shrink-0">
                      {formatTime(item.timestamp)}
                    </time>
                  </div>

                  {item.actionUrl && item.actionLabel && (
                    <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                      <Button type="button" variant="outline" size="sm" onClick={() => navigate(item.actionUrl!)}>
                        {item.actionLabel}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}