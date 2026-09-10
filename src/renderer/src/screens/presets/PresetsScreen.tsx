import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Globe,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { deletePreset, fetchPreset, fetchPresets } from '@/api/presets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackend } from '@/hooks/useBaseUrl';
import type { ScrapeDraft } from '@/components/scrapeModal/types';
import type { PresetSummary } from '@/types/preset';

function formatLastUsed(value: string | null): string {
  if (!value) return 'Never used';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Never used';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Never used';
  }
}

export default function PresetsScreen({
  onUsePreset,
  onCreatePreset,
}: {
  onUsePreset: (draft: ScrapeDraft) => void;
  onCreatePreset: () => void;
}) {
  const { baseUrl } = useBackend();
  const [presets, setPresets] = useState<PresetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPresets = useCallback(
    async (isManual = false) => {
      if (!baseUrl) return;

      try {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const data = await fetchPresets(baseUrl);
        setPresets(data);
        if (isManual) toast.success('Presets refreshed');
      } catch {
        setError('Unable to load presets right now.');
        if (isManual) toast.error('Failed to refresh presets');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseUrl]
  );

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const filteredPresets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return presets;

    return presets.filter((preset) =>
      [preset.name, preset.search_term, preset.location ?? ''].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [presets, search]);

  const handleUsePreset = async (presetId: string) => {
    if (!baseUrl) return;

    try {
      const preset = await fetchPreset(baseUrl, presetId);
      onUsePreset({
        ...(preset.config as ScrapeDraft),
        preset_id: preset.id,
        save_as_preset: false,
        preset_name: '',
      });
    } catch {
      toast.error('Unable to load preset configuration');
    }
  };

  const handleDeletePreset = async (presetId: string, presetName: string) => {
    if (!baseUrl) return;

    try {
      await deletePreset(baseUrl, presetId);
      setPresets((current) => current.filter((p) => p.id !== presetId));
      toast.success(`Deleted preset "${presetName}"`);
    } catch {
      toast.error('Unable to delete preset');
    }
  };

  return (
    <section className="space-y-4 px-6 py-4 max-w-[1400px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Saved Presets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Repeat high-value job searches fast with one-click reruns and consistent tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPresets(true)}
            disabled={loading || refreshing}
            className="h-8.5 gap-1.5 text-xs font-medium border-border/80 shadow-2xs cursor-pointer"
            title="Refresh presets"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={onCreatePreset}
            className="h-8.5 gap-1.5 text-xs font-medium shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Preset</span>
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8.5 w-64 rounded-lg" />
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-28" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 p-0">
            <p className="text-xs font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPresets()}
              className="text-xs shrink-0 h-8"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* If there are no presets saved at all */}
          {presets.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card/50 py-16 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                  <SlidersHorizontal className="h-7 w-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    No Presets Saved Yet
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Save any search configuration during scrape setup to reuse your favorite keywords, locations, and filters with a single click.
                  </p>
                </div>
                <Button
                  onClick={onCreatePreset}
                  className="gap-2 mt-2 shadow-xs font-medium text-xs h-8.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create from New Scrape
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Compact Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter presets by role, location, or name..."
                    className="pl-8.5 pr-7.5 h-8.5 text-xs bg-card/60 border-border/70 focus-visible:ring-primary/20 rounded-lg"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm cursor-pointer"
                      aria-label="Clear filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Showing <strong className="text-foreground font-medium">{filteredPresets.length}</strong> of{' '}
                    <strong className="text-foreground font-medium">{presets.length}</strong> presets
                  </span>

                  {search.trim() && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearch('')}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* No matching presets found for current filter */}
              {filteredPresets.length === 0 ? (
                <Card className="border-dashed border-border/80 bg-card/50 py-12 text-center">
                  <CardContent className="flex flex-col items-center justify-center space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      No presets match &ldquo;{search}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try searching with different keywords or clear your search query.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearch('')}
                      className="h-8 gap-1.5 text-xs mt-1 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Preset Cards Grid */
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card/80 p-4 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-border hover:shadow-sm"
                    >
                      {/* Top Row: Icon + Title + Usage badge */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <SlidersHorizontal className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <h3
                                className="font-semibold text-sm text-foreground truncate"
                                title={preset.name}
                              >
                                {preset.name}
                              </h3>
                              <span className="text-[11px] text-muted-foreground font-mono block">
                                ID: {preset.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>

                          <span className="inline-flex items-center shrink-0 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {preset.use_count} {preset.use_count === 1 ? 'use' : 'uses'}
                          </span>
                        </div>

                        {/* Search Term & Location */}
                        <div className="space-y-1.5 pt-1 text-xs">
                          <div className="flex items-center gap-1.5 text-foreground/90 capitalize truncate">
                            <span className="font-medium">{preset.search_term}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] capitalize truncate">
                            {preset.location ? (
                              <>
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{preset.location}</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 shrink-0" />
                                <span>Anywhere / Remote</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Last used timestamp */}
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                          <Clock3 className="h-3 w-3 shrink-0" />
                          <span>Last used: {formatLastUsed(preset.last_used)}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/40">
                        <Button
                          size="sm"
                          onClick={() => handleUsePreset(preset.id)}
                          className="flex-1 h-8 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Use Preset</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="Delete preset"
                              aria-label="Delete preset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete preset?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove{' '}
                                <strong className="text-foreground">&ldquo;{preset.name}&rdquo;</strong> from your
                                saved presets.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePreset(preset.id, preset.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Preset
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
