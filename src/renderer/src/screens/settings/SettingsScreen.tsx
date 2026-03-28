import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Laptop2,
  LifeBuoy,
  Moon,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useMemo } from 'react';

import type { ScrapeDraft } from '@/components/scrapeModal/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_CONFIG } from '@/config/app';
import { useTheme } from '@/theme/theme.context';

type AppInfo = Awaited<ReturnType<typeof window.app.getAppInfo>>;
type UpdateStatus = Awaited<ReturnType<typeof window.app.getUpdateStatus>>;

function getUpdateLabel(status?: string) {
  switch (status) {
    case 'downloaded':
      return 'Ready to install';
    case 'available':
      return 'Update available';
    case 'checking':
      return 'Checking';
    case 'downloading':
      return 'Downloading';
    case 'error':
      return 'Attention needed';
    default:
      return 'Up to date';
  }
}

function getBuildLabel(appInfo: AppInfo | null) {
  if (!appInfo) return 'Loading';
  return appInfo.isPackaged ? 'Packaged desktop build' : 'Development build';
}

export default function SettingsScreen({
  onRequestNewScrape,
}: {
  onRequestNewScrape: (draft?: ScrapeDraft) => void;
}) {
  const { theme, setTheme } = useTheme();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [info, updates] = await Promise.all([
      window.app.getAppInfo(),
      window.app.getUpdateStatus(),
    ]);

    setAppInfo(info);
    setUpdateStatus(updates);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const runAction = async (action: () => Promise<UpdateStatus>) => {
    setBusy(true);
    try {
      const result = await action();
      setUpdateStatus(result);
    } finally {
      setBusy(false);
    }
  };

  const updateLabel = useMemo(() => getUpdateLabel(updateStatus?.status), [updateStatus?.status]);

  return (
    <section className="space-y-6 px-6 py-6">
      <div className="rounded-[30px] border border-border/70 bg-muted/20 px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Settings
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Control the desktop workspace</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Keep the app stable, quiet, and ready for daily use. Everything here is focused on
              appearance, updates, runtime visibility, and support.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => runAction(window.app.check_for_updates)} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check updates
            </Button>
            <Button variant="outline" onClick={() => onRequestNewScrape()}>
              <Rocket className="mr-2 h-4 w-4" />
              New scrape
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Version</p>
            <p className="mt-2 text-lg font-semibold">{appInfo?.version ?? 'Loading...'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Release state</p>
            <p className="mt-2 text-lg font-semibold">{updateLabel}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Build</p>
            <p className="mt-2 text-lg font-semibold">{getBuildLabel(appInfo)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Workspace feel</CardTitle>
                <CardDescription>Choose the appearance and the defaults that keep the app calm.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  theme === 'light'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-background hover:border-primary/35'
                }`}
              >
                <Sun className="mb-4 h-5 w-5" />
                <p className="font-medium">Light mode</p>
                <p className={`mt-1 text-sm ${theme === 'light' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Bright canvas with strong page contrast for daytime use.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  theme === 'dark'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-background hover:border-primary/35'
                }`}
              >
                <Moon className="mb-4 h-5 w-5" />
                <p className="font-medium">Dark mode</p>
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Reduced glare for long review sessions and focused evening work.
                </p>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Search className="h-4 w-4" />
                  Search palette
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use <span className="font-mono">Ctrl/Cmd + K</span> to jump across pages, presets, and live jobs.
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Stable desktop flow
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The app is designed around a bundled backend, clear status feedback, and safer updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Release management</CardTitle>
                <CardDescription>Track desktop updates and install them when they are ready.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{updateLabel}</p>
                <span className="rounded-full border border-border/70 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {updateStatus?.status ?? 'idle'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {updateStatus?.message ?? 'Update status will appear here after the app checks the release feed.'}
              </p>
              {updateStatus?.downloadedVersion && (
                <p className="mt-3 text-sm">
                  Downloaded version: <span className="font-mono">{updateStatus.downloadedVersion}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button disabled={busy} onClick={() => runAction(window.app.check_for_updates)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check updates
              </Button>
              <Button
                disabled={busy || updateStatus?.status === 'downloaded'}
                variant="outline"
                onClick={() => runAction(window.app.download_update)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                disabled={busy || updateStatus?.status !== 'downloaded'}
                variant="secondary"
                onClick={() => window.app.quit_and_install_update()}
              >
                Restart to install
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Laptop2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Runtime details</CardTitle>
                <CardDescription>Useful system information when you are validating installs or debugging.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
              <p className="mt-2 font-mono text-sm">{appInfo?.platform ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Logs path</p>
              <p className="mt-2 break-all font-mono text-sm">{appInfo?.logsPath ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Data path</p>
              <p className="mt-2 break-all font-mono text-sm">{appInfo?.userDataPath ?? 'Loading...'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader className="gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Project access</CardTitle>
                <CardDescription>Only the links and contacts that matter in day-to-day use.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium">{APP_CONFIG.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Desktop-first job discovery with repeatable presets, packaged runtime support, and controlled updates.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}>
                Open repository
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.app.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}>
                Contact support
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Need a fresh run? Start a new scrape from here, then save useful searches as presets so the team can reuse them.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
