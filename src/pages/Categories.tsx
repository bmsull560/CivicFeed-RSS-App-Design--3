import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Search, Filter, Download, Upload, Plus } from "lucide-react";
import { useUserFeeds } from "../hooks/useUserFeeds";
import { generateOpml, parseOpml, parsedOpmlToUserFeeds } from "../lib/opml";
import { thematicHubs } from "../lib/hubs";
import CategoryCard from "../components/CategoryCard";
import FeedCard from "../components/FeedCard";
import FeedFormDialog from "../components/FeedFormDialog";
import EmptyState from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Feed, UserFeed } from "../types";
import { cn } from "@/lib/utils";

export default function Categories() {
  const navigate = useNavigate();
  const {
    allFeeds,
    enabledFeeds,
    addFeed,
    updateFeed,
    removeFeed,
    toggleFeedEnabled,
    importFeeds,
    refresh,
  } = useUserFeeds();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  // Group feeds by category
  const feedsByCategory = useMemo(() => {
    const map = new Map<string, Feed[]>();
    const feedsToShow = showCustomOnly ? allFeeds.filter((f) => f.userAdded === true) : allFeeds;

    for (const feed of feedsToShow) {
      if (!map.has(feed.category)) {
        map.set(feed.category, []);
      }
      map.get(feed.category)!.push(feed);
    }
    return map;
  }, [allFeeds, showCustomOnly]);

  // Sort categories alphabetically
  const sortedCategories = useMemo(() => {
    return Array.from(feedsByCategory.keys()).sort((a, b) => a.localeCompare(b));
  }, [feedsByCategory]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return sortedCategories;
    const lower = searchQuery.toLowerCase();
    return sortedCategories.filter((cat) => cat.toLowerCase().includes(lower));
  }, [sortedCategories, searchQuery]);

  const handleToggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleExportOpml = () => {
    const xml = generateOpml(enabledFeeds);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "civicfeed-subscriptions.opml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseOpml(text);
      if (parsed.length === 0) {
        alert("No valid RSS feeds found in the OPML file.");
        return;
      }
      const imported = parsedOpmlToUserFeeds(parsed);
      importFeeds(imported);
      refresh();
      alert(`Imported ${imported.length} feed${imported.length === 1 ? "" : "s"}.`);
    } catch (err) {
      alert(`Failed to import OPML: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddCustomFeed = (feedData: Omit<Feed, "id" | "status" | "userAdded" | "enabled" | "addedAt">) => {
    addFeed(feedData);
  };

  const handleEditFeed = (feed: Feed, updates: Partial<Feed>) => {
    updateFeed(feed.id, updates);
  };

  const handleRemoveFeed = (id: string) => {
    removeFeed(id);
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    toggleFeedEnabled(id);
  };

  // Custom feeds section
  const customFeeds = allFeeds.filter((f) => f.userAdded === true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[hsl(var(--foreground))]">
            Categories
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Browse and manage feeds by category. {allFeeds.length} feeds across {sortedCategories.length} categories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={handleImportClick}>
            <Upload size={16} /> Import OPML
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml,text/xml"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleExportOpml}>
            <Download size={16} /> Export OPML
          </Button>
          <FeedFormDialog mode="add" onSave={handleAddCustomFeed} trigger={
            <Button type="button" size="sm">
              <Plus size={16} /> Add Feed
            </Button>
          } />
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="input pl-9 pr-4 py-2 text-sm w-full"
            aria-label="Search categories"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCustomOnly}
            onChange={(e) => setShowCustomOnly(e.target.checked)}
            className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
          />
          <span className="text-sm text-[hsl(var(--foreground))]">Custom feeds only</span>
        </label>
      </div>

      {/* Categories list */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          variant={showCustomOnly ? "no-custom-feeds" : "no-feeds"}
          action={showCustomOnly ? { label: "Add Custom Feed", onClick: () => setShowCustomOnly(false) } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const feeds = feedsByCategory.get(category) || [];
            const workingCount = feeds.filter((f) => f.status === "working").length;
            const blockedCount = feeds.filter((f) => f.status === "blocked").length;
            const isExpanded = expandedCategories.has(category);

            // Get hub icon for this category
            const hub = thematicHubs.find((h) => h.categories.includes(category));
            const icon = hub?.icon;

            return (
              <div key={category} className="card overflow-hidden">
                <button
                  onClick={() => handleToggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[hsl(var(--accent))] transition-colors"
                  type="button"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 size-10 rounded-xl bg-[hsl(var(--primary))/10] flex items-center justify-center text-[hsl(var(--primary))]">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">{category}</h3>
                      <p className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
                        {feeds.length} feed{feeds.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden" role="progressbar" aria-valuenow={feeds.length > 0 ? Math.round((workingCount / feeds.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label={`Feed health: ${feeds.length > 0 ? Math.round((workingCount / feeds.length) * 100) : 0}% working`}>
                      <span className="block h-full rounded-full transition-all duration-300" style={{ width: `${feeds.length > 0 ? Math.round((workingCount / feeds.length) * 100) : 0}%`, backgroundColor: `hsl(${feeds.length > 0 && workingCount / feeds.length >= 0.8 ? "var(--success)" : feeds.length > 0 && workingCount / feeds.length >= 0.5 ? "var(--warning)" : "var(--destructive)"})` }} />
                    </div>
                    <span className="text-[0.6875rem] font-medium text-[hsl(var(--muted-foreground))]">
                      {feeds.length > 0 ? Math.round((workingCount / feeds.length) * 100) : 0}%
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-[hsl(var(--muted-foreground))]" /> : <ChevronDown size={16} className="text-[hsl(var(--muted-foreground))]" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-[hsl(var(--border))] px-4 pb-4">
                    {feeds.map((feed) => (
                      <FeedCard
                        key={feed.id}
                        feed={feed}
                        variant="compact"
                        onToggleEnabled={handleToggleEnabled}
                        onEdit={handleEditFeed}
                        onRemove={handleRemoveFeed}
                        onNavigate={(id) => navigate(`/feed/${id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom feeds section (if not filtered) */}
      {!showCustomOnly && customFeeds.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Plus size={20} className="text-[hsl(var(--primary))]" />
            Custom Feeds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customFeeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                variant="grid"
                onToggleEnabled={handleToggleEnabled}
                onEdit={handleEditFeed}
                onRemove={handleRemoveFeed}
                onNavigate={navigate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}