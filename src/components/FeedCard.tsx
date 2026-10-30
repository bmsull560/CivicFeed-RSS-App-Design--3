import { useNavigate } from "react-router-dom";
import { MoreVertical, Trash2, Globe, Edit } from "lucide-react";
import { Feed } from "@/types";
import { FeedFormDialog } from "./FeedFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  feed: Feed;
  variant?: "list" | "grid" | "compact";
  showActions?: boolean;
  onToggleEnabled?: (id: string, enabled: boolean) => void;
  onEdit?: (feed: Feed) => void;
  onRemove?: (id: string) => void;
  onNavigate?: (id: string) => void;
  isUserFeed?: boolean;
  className?: string;
}

function statusDot(status: string): string {
  switch (status) {
    case "working":
      return "status-working";
    case "blocked":
      return "status-blocked";
    default:
      return "status-unverified";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "working":
      return "Working";
    case "blocked":
      return "Blocked";
    default:
      return "Unverified";
  }
}

export function FeedCard({
  feed,
  variant = "list",
  showActions = true,
  onToggleEnabled,
  onEdit,
  onRemove,
  onNavigate,
  isUserFeed = feed.userAdded === true,
  className,
}: FeedCardProps) {
  const navigate = useNavigate();
  const handleNavigate = onNavigate || ((id: string) => navigate(`/feed/${id}`));

  const handleToggleEnabled = (enabled: boolean) => {
    onToggleEnabled?.(feed.id, enabled);
  };

  const handleRemove = () => {
    onRemove?.(feed.id);
  };

  const baseClasses = "card-hover transition-all duration-200";
  const variantClasses = {
    list: "flex items-center gap-3 px-4 py-3 divide-y divide-[hsl(var(--border))]",
    grid: "flex flex-col p-4 text-left h-full",
    compact: "flex items-center gap-2 px-3 py-2",
  };

  if (variant === "grid") {
    return (
      <div className={cn(baseClasses, variantClasses.grid, className)}>
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn("mt-0.5 w-2 h-2 rounded-full flex-shrink-0", statusDot(feed.status))}
            title={statusLabel(feed.status)}
            aria-label={`Feed status: ${statusLabel(feed.status)}`}
          />
          <div className="min-w-0 flex-1">
            <button
              onClick={() => handleNavigate(feed.id)}
              className="w-full text-left"
              type="button"
            >
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                {feed.shortName}
              </h3>
              <p className="text-[0.6875rem] text-[hsl(var(--muted-foreground))] mt-0.5">
                {feed.agency}
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="badge-outline text-[0.6875rem]">{feed.category}</span>
          {feed.priority && (
            <span className="badge-primary text-[0.6875rem]">Tier {feed.priority}</span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--border))]">
            <Switch
              checked={feed.enabled !== false}
              onCheckedChange={(checked) => handleToggleEnabled(checked)}
              aria-label={`${feed.shortName} ${feed.enabled !== false ? "enabled" : "disabled"}`}
            />
            {feed.website && (
              <a
                href={feed.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent-foreground))]"
                title="Visit website"
                aria-label={`Visit ${feed.shortName} website`}
              >
                <Globe size={14} />
              </a>
            )}
            {isUserFeed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent-foreground))]"
                    aria-label={`${feed.shortName} actions`}
                  >
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <FeedFormDialog
                      mode="edit"
                      feed={feed}
                      onSave={(updates) => onEdit?.({ ...feed, ...updates })}
                      trigger={<span className="w-full cursor-pointer flex items-center gap-2"><Edit size={14} /> Edit</span>}
                    />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleRemove}
                    className="text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isUserFeed && (
              <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))] ml-auto">
                Built-in
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // List and compact variants
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <button
        onClick={() => handleNavigate(feed.id)}
        className="min-w-0 flex flex-1 items-center gap-3 text-left"
        type="button"
      >
        <div
          className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot(feed.status))}
          title={statusLabel(feed.status)}
          aria-label={`Feed status: ${statusLabel(feed.status)}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
            {feed.shortName}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
              {feed.agency}
            </span>
            <span className="badge-outline text-[0.6875rem]">{feed.category}</span>
            {feed.priority && (
              <span className="badge-primary text-[0.6875rem]">Tier {feed.priority}</span>
            )}
          </div>
        </div>
      </button>

      {showActions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Switch
            checked={feed.enabled !== false}
            onCheckedChange={(checked) => handleToggleEnabled(checked)}
            aria-label={`${feed.shortName} ${feed.enabled !== false ? "enabled" : "disabled"}`}
          />
          {feed.website && (
            <a
              href={feed.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent-foreground))]"
              title="Visit website"
              aria-label={`Visit ${feed.shortName} website`}
            >
              <Globe size={14} />
            </a>
          )}
          {isUserFeed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent-foreground))]"
                  aria-label={`${feed.shortName} actions`}
                >
                  <MoreVertical size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <FeedFormDialog
                    mode="edit"
                    feed={feed}
                    onSave={(updates) => onEdit?.({ ...feed, ...updates })}
                    trigger={<span className="w-full cursor-pointer flex items-center gap-2"><Edit size={14} /> Edit</span>}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRemove}
                  className="text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-[0.6875rem] text-[hsl(var(--muted-foreground))]">
              Built-in
            </span>
          )}
        </div>
      )}
    </div>
  );
}