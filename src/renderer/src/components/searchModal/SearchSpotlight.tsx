import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Command,
  FileSearch,
  Info,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';

import { fetchPresets, fetchPreset } from '@/api/presets';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { APP_CONFIG } from '@/config/app';
import { useBackend } from '@/hooks/useBaseUrl';
import { useDashboard } from '@/screens/dashboard/DashboardContext';
import type { ScrapeDraft } from '@/components/scrapeModal/types';
import type { PresetSummary } from '@/types/preset';

type SpotlightItem = {
  id: string;
  label: string;
  description: string;
  section: string;
  icon: ReactNode;
  action: () => void | Promise<void>;
};

function normalizeDescription(value: string) {
  return value.replaceAll('Â·', '·').replaceAll('â€™', "'");
}

export default function SearchSpotlight({
  open,
  onClose,
  onRequestScrape,
}: {
  open: boolean;
  onClose: () => void;
  onRequestScrape: (draft?: ScrapeDraft) => void;
}) {
  const navigate = useNavigate();
  const { baseUrl } = useBackend();
  const { jobs } = useDashboard();

  const [query, setQuery] = useState('');
  const [presets, setPresets] = useState<PresetSummary[]>([]);

  useEffect(() => {
    if (!open || !baseUrl) return;

    fetchPresets(baseUrl)
      .then(setPresets)
      .catch(() => setPresets([]));
  }, [baseUrl, open]);

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  const items = useMemo<SpotlightItem[]>(() => {
    const staticItems: SpotlightItem[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        description: 'Open today’s active job workspace',
        section: 'Navigate',
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => navigate('/'),
      },
      {
        id: 'nav-history',
        label: 'History',
        description: 'Review previous scrape sessions',
        section: 'Navigate',
        icon: <FileSearch className="h-4 w-4" />,
        action: () => navigate('/history'),
      },
      {
        id: 'nav-presets',
        label: 'Presets',
        description: 'Run or manage saved search configurations',
        section: 'Navigate',
        icon: <Sparkles className="h-4 w-4" />,
        action: () => navigate('/presets'),
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        description: 'Manage theme, updates, and runtime preferences',
        section: 'Navigate',
        icon: <Settings className="h-4 w-4" />,
        action: () => navigate('/settings'),
      },
      {
        id: 'nav-about',
        label: 'About',
        description: 'Read product context, ownership, and app intent',
        section: 'Navigate',
        icon: <Info className="h-4 w-4" />,
        action: () => navigate('/about'),
      },
      {
        id: 'action-new-scrape',
        label: 'New Scrape',
        description: 'Open a fresh scrape setup',
        section: 'Actions',
        icon: <Command className="h-4 w-4" />,
        action: () => onRequestScrape(),
      },
      {
        id: 'action-github',
        label: APP_CONFIG.repository.label,
        description: 'Open the project repository in your browser',
        section: 'Actions',
        icon: <ArrowUpRight className="h-4 w-4" />,
        action: () => window.app.openExternalUrl(APP_CONFIG.repository.url),
      },
    ];

    const presetItems = presets.map<SpotlightItem>((preset) => ({
      id: `preset-${preset.id}`,
      label: preset.name,
      description: `${preset.search_term}${preset.location ? ` · ${preset.location}` : ''}`,
      section: 'Presets',
      icon: <Sparkles className="h-4 w-4" />,
      action: async () => {
        if (!baseUrl) return;
        const fullPreset = await fetchPreset(baseUrl, preset.id);
        onRequestScrape({
          ...(fullPreset.config as ScrapeDraft),
          preset_id: fullPreset.id,
          save_as_preset: false,
          preset_name: '',
        });
      },
    }));

    const jobItems = jobs.slice(0, 8).map<SpotlightItem>((job) => ({
      id: `job-${job.id}`,
      label: job.title,
      description: `${job.company ?? 'Unknown company'} · ${job.location_city ?? job.location_state ?? 'Remote'}`,
      section: 'Current Jobs',
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      action: () => window.app.openExternalUrl(job.job_url),
    }));

    return [...staticItems, ...presetItems, ...jobItems].map((item) => ({
      ...item,
      description: normalizeDescription(item.description),
    }));
  }, [baseUrl, jobs, navigate, onRequestScrape, presets]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) =>
      [item.label, item.description, item.section].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [items, query]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce<Record<string, SpotlightItem[]>>((accumulator, item) => {
      if (!accumulator[item.section]) {
        accumulator[item.section] = [];
      }

      accumulator[item.section].push(item);
      return accumulator;
    }, {});
  }, [filteredItems]);

  const handleSelect = async (item: SpotlightItem) => {
    await item.action();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border/70 bg-card/96 p-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <DialogTitle className="text-xl">Search everything</DialogTitle>
          <DialogDescription>
            Navigate quickly, rerun presets, or jump into today’s active jobs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={APP_CONFIG.searchPlaceholder}
              className="h-11 rounded-xl border-border/70 bg-background/70 pl-10"
            />
          </div>

          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {Object.entries(groupedItems).map(([section, sectionItems]) => (
              <div key={section} className="space-y-2">
                <p className="px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {section}
                </p>
                <div className="space-y-2">
                  {sectionItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-left transition hover:border-primary/35 hover:bg-primary/5"
                    >
                      <span className="mt-0.5 rounded-full border border-border/70 p-2 text-muted-foreground">
                        {item.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No matches found.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
