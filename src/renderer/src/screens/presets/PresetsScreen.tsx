import { useEffect, useMemo, useState } from 'react';
import { Clock3, Play, Search, Trash2 } from 'lucide-react';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBackend } from '@/hooks/useBaseUrl';
import type { ScrapeDraft } from '@/components/scrapeModal/types';
import type { PresetSummary } from '@/types/preset';

function formatLastUsed(value: string | null) {
  if (!value) return 'Never used';

  return new Date(value).toLocaleString();
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
  const [error, setError] = useState<string | null>(null);

  const loadPresets = async () => {
    if (!baseUrl) return;

    try {
      setLoading(true);
      setError(null);
      setPresets(await fetchPresets(baseUrl));
    } catch {
      setError('Unable to load presets right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, [baseUrl]);

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

    const preset = await fetchPreset(baseUrl, presetId);
    onUsePreset({
      ...(preset.config as ScrapeDraft),
      preset_id: preset.id,
      save_as_preset: false,
      preset_name: '',
    });
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!baseUrl) return;

    await deletePreset(baseUrl, presetId);
    await loadPresets();
  };

  return (
    <section className="space-y-6 px-6 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Saved Presets
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Repeat high-value searches fast</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Presets keep your most useful job searches ready for one-click reruns and consistent tracking.
          </p>
        </div>

        <Button onClick={onCreatePreset}>Create from new scrape</Button>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter presets by role, location, or name"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Loading presets...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && filteredPresets.length === 0 && (
        <Card className="border-dashed border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>No presets yet</CardTitle>
            <CardDescription>
              Save a search during scrape setup and it will appear here for reuse.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPresets.map((preset) => (
          <Card
            key={preset.id}
            className="border-border/70 bg-card/90 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.3)]"
          >
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{preset.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {preset.search_term}
                    {preset.location ? ` in ${preset.location}` : ''}
                  </CardDescription>
                </div>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {preset.use_count} uses
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                {formatLastUsed(preset.last_used)}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleUsePreset(preset.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Use preset
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete preset?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove "{preset.name}" from saved presets.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeletePreset(preset.id)}>
                        Delete preset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
