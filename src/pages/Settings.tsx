import { useState, useRef } from "react";
import { Moon, Sun, Monitor, Trash2, Download, Upload, Info, AlertCircle, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useUserFeeds } from "../hooks/useUserFeeds";
import { generateOpml, parseOpml, parsedOpmlToUserFeeds } from "../lib/opml";
import { getPreferences, updatePreferences, loadUserData, clearUserData } from "../lib/userData";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserPreferences } from "../types";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { enabledFeeds, refresh, importFeeds } = useUserFeeds();
  const [preferences, setPreferences] = useState<UserPreferences>(() => getPreferences());
  const [localProfile, setLocalProfile] = useState<{ name: string; title: string; agency: string; avatarUrl: string }>({
    name: "",
    title: "",
    agency: "",
    avatarUrl: "",
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");

  // Load profile from preferences if exists
  const userData = loadUserData();
  const savedProfile = userData.preferences.userProfile;

  // Sync local profile with saved
  if (savedProfile && !localProfile.name) {
    setLocalProfile(savedProfile);
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: unknown) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    updatePreferences(updated);
  };

  const handleProfileChange = (field: keyof typeof localProfile, value: string) => {
    const updated = { ...localProfile, [field]: value };
    setLocalProfile(updated);
    // Save to preferences
    const updatedPrefs = { ...preferences, userProfile: updated };
    setPreferences(updatedPrefs);
    updatePreferences(updatedPrefs);
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
    importFileRef.current?.click();
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
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  const handleClearData = () => {
    clearUserData();
    setPreferences({
      defaultView: "list",
      reduceMotion: false,
      onboardingComplete: false,
      followedHubs: [],
      digestFrequency: null,
      onboardingDismissed: false,
      density: "comfortable",
      userProfile: { name: "", title: "", agency: "", avatarUrl: "" },
    });
    setLocalProfile({ name: "", title: "", agency: "", avatarUrl: "" });
    setShowClearConfirm(false);
    refresh();
    window.location.reload();
  };

  const densityOptions = [
    { value: "compact", label: "Compact", description: "More content, smaller spacing" },
    { value: "comfortable", label: "Comfortable", description: "Balanced spacing (default)" },
    { value: "spacious", label: "Spacious", description: "More breathing room" },
  ] as const;

  const digestOptions = [
    { value: null, label: "Off", description: "No automatic digest" },
    { value: "realtime", label: "Real-time", description: "Updates as they arrive" },
    { value: "daily", label: "Daily at 8:00 AM", description: "Morning briefing" },
    { value: "weekly", label: "Weekly on Saturday", description: "Weekly recap" },
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[hsl(var(--foreground))]">Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Manage your preferences, profile, and data. All settings are stored locally on this device.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 pt-4">
          <section className="space-y-4">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Appearance</h2>
            <div className="card p-4 space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Theme</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Choose your preferred color scheme</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    aria-pressed={theme === "light"}
                  >
                    <Sun size={16} /> Light
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    aria-pressed={theme === "dark"}
                  >
                    <Moon size={16} /> Dark
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                    aria-pressed={theme === "system"}
                  >
                    <Monitor size={16} /> System
                  </Button>
                </div>
              </div>

              {/* Density */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Density</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Adjust content spacing</p>
                </div>
                <div className="flex items-center gap-2">
                  {densityOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={preferences.density === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePreferenceChange("density", opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Reduced Motion</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Minimize animations and transitions</p>
                </div>
                <Switch
                  checked={preferences.reduceMotion}
                  onCheckedChange={(checked) => handlePreferenceChange("reduceMotion", checked)}
                />
              </div>

              {/* Default View */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Default View</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Feed directory default layout</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={preferences.defaultView === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferenceChange("defaultView", "list")}
                  >
                    List
                  </Button>
                  <Button
                    type="button"
                    variant={preferences.defaultView === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePreferenceChange("defaultView", "grid")}
                  >
                    Grid
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 pt-4">
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-[hsl(var(--foreground))]">Local Profile</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  This profile is stored only on this device. It is not synced to any server or used for authentication.
                </p>
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden">
                {localProfile.avatarUrl ? (
                  <img src={localProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[hsl(var(--muted-foreground))]">
                    {localProfile.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
            </div>

            <div className="card p-4 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Display Name</label>
                <input
                  type="text"
                  value={localProfile.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  placeholder="Your name"
                  className="input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Title / Role</label>
                <input
                  type="text"
                  value={localProfile.title}
                  onChange={(e) => handleProfileChange("title", e.target.value)}
                  placeholder="e.g., Policy Analyst, Journalist, Researcher"
                  className="input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Agency / Organization</label>
                <input
                  type="text"
                  value={localProfile.agency}
                  onChange={(e) => handleProfileChange("agency", e.target.value)}
                  placeholder="e.g., Congressional Research Service, ProPublica"
                  className="input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Avatar URL</label>
                <input
                  type="url"
                  value={localProfile.avatarUrl}
                  onChange={(e) => handleProfileChange("avatarUrl", e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="input w-full"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Must be a direct image link. Stored locally only.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[hsl(var(--muted))] rounded-lg">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                <Info size={14} className="inline-block align-middle mr-1" />
                <strong>Privacy Note:</strong> This profile is stored in your browser's localStorage. It is not transmitted to any server.
                Clearing browser data will remove it permanently.
              </p>
            </div>
          </section>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6 pt-4">
          <section className="space-y-4">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Activity & Digest</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Configure how you receive updates and what appears in your Activity feed.
            </p>

            <div className="card p-4 space-y-4">
              {/* Digest Frequency */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Digest Frequency</label>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">How often to generate your personalized briefing</p>
                <select
                  value={preferences.digestFrequency || ""}
                  onChange={(e) => handlePreferenceChange("digestFrequency", e.target.value || null)}
                  className="input w-full max-w-xs"
                >
                  {digestOptions.map((opt) => (
                    <option key={opt.value} value={opt.value || ""}>
                      {opt.label} — {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Followed Hubs */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Followed Topics</label>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Select hubs to prioritize in your briefing and Activity feed</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "health-environment", label: "Health & Environment" },
                    { key: "economy-trade", label: "Economy & Trade" },
                    { key: "defense-security", label: "Defense & Security" },
                    { key: "law-policy", label: "Law & Policy" },
                    { key: "general-bulletins", label: "General Bulletins" },
                  ].map((hub) => (
                    <Button
                      key={hub.key}
                      type="button"
                      variant={preferences.followedHubs?.includes(hub.key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const followed = preferences.followedHubs || [];
                        const updated = followed.includes(hub.key)
                          ? followed.filter((h) => h !== hub.key)
                          : [...followed, hub.key];
                        handlePreferenceChange("followedHubs", updated);
                      }}
                    >
                      {hub.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Urgency Display */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[hsl(var(--foreground))]">Activity Urgency Thresholds</label>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Minimum urgency level to show in Activity feed</p>
                <div className="flex flex-wrap gap-2">
                  <span className="badge-destructive">Alert</span>
                  <span className="badge-warning">High</span>
                  <span className="badge-primary">Update</span>
                  <span className="badge-secondary">Announcement</span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Activity is derived from feed health, AI tags, and new content in followed feeds.
                  <a href="/activity" className="text-[hsl(var(--primary))] hover:underline ml-1">View Activity →</a>
                </p>
              </div>
            </div>
          </section>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6 pt-4">
          <section className="space-y-4">
            <h2 className="font-semibold text-[hsl(var(--foreground))]">Data & Portability</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Import, export, or clear your local data. All data stays on this device.
            </p>

            <div className="card p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Export Data (OPML)</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Download your feed subscriptions and preferences</p>
                </div>
                <Button type="button" variant="outline" onClick={handleExportOpml}>
                  <Download size={16} /> Export OPML
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <p className="font-medium text-[hsl(var(--foreground))]">Import Data (OPML)</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Import feeds from an OPML file</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={handleImportClick}>
                    <Upload size={16} /> Import OPML
                  </Button>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".opml,.xml,text/xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <section className="space-y-4 border-t border-[hsl(var(--border))] pt-4">
              <h2 className="font-semibold text-[hsl(var(--destructive))] flex items-center gap-2">
                <AlertCircle size={20} /> Danger Zone
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                These actions are irreversible. All local data will be permanently deleted.
              </p>

              <div className="card p-4 border border-[hsl(var(--destructive))/20] bg-[hsl(var(--destructive))/5]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[hsl(var(--destructive))]">Clear All Local Data</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Removes: followed feeds, read/bookmark/archive state, preferences, profile, custom feeds
                    </p>
                  </div>
                  <Button type="button" variant="destructive" onClick={() => setShowClearConfirm(true)}>
                    <Trash2 size={16} /> Clear Data
                  </Button>
                </div>
              </div>

              <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Local Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your local CivicFeed data including followed feeds, reading state,
                      preferences, and profile. This cannot be undone. Your data is not backed up anywhere else.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleClearData}>Yes, Clear Everything</Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </section>
          </section>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6 pt-4">
          <section className="space-y-4">
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
                  <CheckCircle size={24} className="text-[hsl(var(--primary-foreground))]" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-[hsl(var(--foreground))]">CivicFeed</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Version 1.0.0</p>
                </div>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-4 space-y-2">
                <p className="text-sm text-[hsl(var(--foreground))]">
                  A local-first civic intelligence platform that turns fragmented government publications
                  into a clear, personalized, source-grounded daily briefing.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[hsl(var(--primary))] hover:underline">
                    GitHub Repository
                  </a>
                  <span className="text-[hsl(var(--muted-foreground))]">•</span>
                  <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">License (MIT)</a>
                  <span className="text-[hsl(var(--muted-foreground))]">•</span>
                  <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">Privacy Note</a>
                </div>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-4">
                <h3 className="font-medium text-[hsl(var(--foreground))] mb-2">Architecture</h3>
                <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                  <li>Frontend: React 19 + TypeScript + Vite + Tailwind CSS</li>
                  <li>Backend: Express + TypeScript + SQLite (better-sqlite3)</li>
                  <li>RSS: Backend-owned fetch, parse, cache, and AI enrichment</li>
                  <li>Storage: Local browser localStorage only (no cloud sync)</li>
                  <li>AI: Async enrichment queue with extractive fallback</li>
                </ul>
              </div>

              <div className="border-t border-[hsl(var(--border))] pt-4">
                <h3 className="font-medium text-[hsl(var(--foreground))] mb-2">Non-Goals</h3>
                <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                  <li>No authentication or cloud synchronization</li>
                  <li>No API key management (localStorage is not a secret vault)</li>
                  <li>No push notifications or real-time server updates</li>
                  <li>No social features, comments, or engagement ranking</li>
                </ul>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}