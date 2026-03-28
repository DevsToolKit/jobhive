import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  HardDrive,
  LoaderCircle,
  Moon,
  RefreshCw,
  ServerCog,
  Settings2,
  ShieldCheck,
  Sun,
} from 'lucide-react';

import { fetchAppSettings, updateAppSettings } from '@/api/settings';
import { APP_CONFIG } from '@/config/app';
import { SITES } from '@/config/scrapeFormConfig';
import { useBackend } from '@/hooks/useBaseUrl';
import type { AppSettings, ThemePreference } from '@/types/settings';
import { useTheme } from '@/theme/theme.context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

type AppInfo = Awaited<ReturnType<typeof window.app.getAppInfo>>;
type UpdateStatus = Awaited<ReturnType<typeof window.app.getUpdateStatus>>;
type UpdatePreferences = Awaited<ReturnType<typeof window.app.getUpdatePreferences>>;
type BackendStatus = Awaited<ReturnType<typeof window.app.get_backend_status>>;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  default_location: '',
  default_results_wanted: 20,
  default_country_indeed: 'india',
  default_sites: [],
};

const COUNTRY_OPTIONS = [
  { label: 'India', value: 'india' },
  { label: 'United States', value: 'usa' },
  { label: 'United Kingdom', value: 'uk' },
] as const;

function getUpdateTone(status?: string): 'default' | 'destructive' | 'outline' {
  switch (status) {
    case 'downloaded':
      return 'default';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getBackendLabel(status: BackendStatus | null) {
  if (!status) return 'Loading';
  return status.running ? 'Online' : 'Offline';
}

function ThemeButton({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-background hover:border-primary/35'
      }`}
    >
      <div className="mb-4">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className={`mt-1 text-sm ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        {description}
      </p>
    </button>
  );
}

export default function SettingsControlCenter() {
  const { baseUrl } = useBackend();
  const { theme, setTheme } = useTheme();

  const [settingsForm, setSettingsForm] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [updatePreferences, setUpdatePreferences] = useState<UpdatePreferences>({
    autoCheckOnLaunch: true,
    autoDownload: true,
  });
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [internetAvailable, setInternetAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingUpdatePrefs, setSavingUpdatePrefs] = useState(false);
  const [busyAction, setBusyAction] = useState<'updates' | 'backend' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);
      setFeedback(null);

      try {
        const [info, updates, updaterPreferences, backend, internet] = await Promise.all([
          window.app.getAppInfo(),
          window.app.getUpdateStatus(),
          window.app.getUpdatePreferences(),
          window.app.get_backend_status(),
          window.app.check_internet(),
        ]);

        if (cancelled) return;

        setAppInfo(info);
        setUpdateStatus(updates);
        setUpdatePreferences(updaterPreferences);
        setBackendStatus(backend);
        setInternetAvailable(internet);

        if (baseUrl) {
          const settings = await fetchAppSettings(baseUrl);
          if (cancelled) return;
          setSettingsForm(settings);
          setTheme(settings.theme);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setFeedback('Some settings could not be loaded.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, setTheme]);

  const updateBadgeLabel = useMemo(() => {
    if (!updateStatus) return 'Loading';
    if (updateStatus.status === 'downloaded') return 'Ready to install';
    if (updateStatus.status === 'available') return 'Update available';
    if (updateStatus.status === 'downloading') return 'Downloading';
    if (updateStatus.status === 'checking') return 'Checking';
    if (updateStatus.status === 'error') return 'Attention needed';
    return 'Up to date';
  }, [updateStatus]);

  const setThemePreference = (nextTheme: ThemePreference) => {
    setTheme(nextTheme);
    setSettingsForm((current) => ({
      ...current,
      theme: nextTheme,
    }));
  };

  const toggleSite = (site: string) => {
    setSettingsForm((current) => ({
      ...current,
      default_sites: current.default_sites.includes(site)
        ? current.default_sites.filter((value) => value !== site)
        : [...current.default_sites, site],
    }));
  };

  const savePreferences = async () => {
    if (!baseUrl) return;

    setSavingPreferences(true);
    setFeedback(null);

    try {
      const saved = await updateAppSettings(baseUrl, settingsForm);
      setSettingsForm(saved);
      setTheme(saved.theme);
      setFeedback('Preferences saved.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const saveUpdatePolicy = async () => {
    setSavingUpdatePrefs(true);
    setFeedback(null);

    try {
      const saved = await window.app.setUpdatePreferences(updatePreferences);
      setUpdatePreferences(saved);
      setFeedback('Update policy saved.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to save update policy.');
    } finally {
      setSavingUpdatePrefs(false);
    }
  };

  const refreshRuntime = async () => {
    setBusyAction('backend');
    setFeedback(null);

    try {
      const [updates, backend, internet] = await Promise.all([
        window.app.getUpdateStatus(),
        window.app.get_backend_status(),
        window.app.check_internet(),
      ]);

      setUpdateStatus(updates);
      setBackendStatus(backend);
      setInternetAvailable(internet);
    } catch (error) {
      console.error(error);
      setFeedback('Failed to refresh runtime state.');
    } finally {
      setBusyAction(null);
    }
  };

  const restartBackend = async () => {
    setBusyAction('backend');
    setFeedback(null);

    try {
      const nextStatus = await window.app.restart_backend();
      setBackendStatus(nextStatus);
      setInternetAvailable(await window.app.check_internet());
      setFeedback(nextStatus.ok ? 'Backend restarted.' : 'Backend restart reported an error.');
    } catch (error) {
      console.error(error);
      setFeedback('Failed to restart backend.');
    } finally {
      setBusyAction(null);
    }
  };

  const runUpdateAction = async (action: () => Promise<UpdateStatus>) => {
    setBusyAction('updates');
    setFeedback(null);

    try {
      const nextStatus = await action();
      setUpdateStatus(nextStatus);
    } catch (error) {
      console.error(error);
      setFeedback('Update action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="space-y-6 px-6 py-6">
      <div className="rounded-[30px] border border-border/70 bg-muted/20 px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Settings
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Manage the app from one place
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Control appearance, scrape defaults, update behavior, and backend health without
              leaving the desktop app.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Version
              </p>
              <p className="mt-2 text-lg font-semibold">{appInfo?.version ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Updates
              </p>
              <p className="mt-2 text-lg font-semibold">{updateBadgeLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Backend
              </p>
              <p className="mt-2 text-lg font-semibold">{getBackendLabel(backendStatus)}</p>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            {feedback}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Workspace preferences</CardTitle>
                <CardDescription>
                  Persist how the app looks and how a new scrape starts.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme mode</Label>
              <div className="grid gap-3 md:grid-cols-3">
                <ThemeButton
                  active={settingsForm.theme === 'system'}
                  title="System"
                  description="Follow the operating system appearance."
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  onClick={() => setThemePreference('system')}
                />
                <ThemeButton
                  active={settingsForm.theme === 'light'}
                  title="Light"
                  description="Bright interface with stronger content separation."
                  icon={<Sun className="h-5 w-5" />}
                  onClick={() => setThemePreference('light')}
                />
                <ThemeButton
                  active={settingsForm.theme === 'dark'}
                  title="Dark"
                  description="Lower glare for longer review sessions."
                  icon={<Moon className="h-5 w-5" />}
                  onClick={() => setThemePreference('dark')}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default-location">Default location</Label>
                <Input
                  id="default-location"
                  value={settingsForm.default_location}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_location: event.target.value,
                    }))
                  }
                  placeholder="Mumbai, IN"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Indeed country</Label>
                <Select
                  value={settingsForm.default_country_indeed}
                  onValueChange={(value) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_country_indeed: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Default results target</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This becomes the initial result count when a new scrape opens.
                  </p>
                </div>
                <span className="rounded-full border border-border/70 px-3 py-1 text-sm font-medium">
                  {settingsForm.default_results_wanted}
                </span>
              </div>

              <Slider
                min={10}
                max={60}
                step={5}
                value={[settingsForm.default_results_wanted]}
                onValueChange={([value]) =>
                  setSettingsForm((current) => ({
                    ...current,
                    default_results_wanted: value,
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Preferred sources</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {SITES.map((site) => {
                  const active = settingsForm.default_sites.includes(site.value);

                  return (
                    <button
                      key={site.value}
                      type="button"
                      onClick={() => toggleSite(site.value)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? 'border-primary bg-primary/8'
                          : 'border-border/70 bg-background hover:border-primary/35'
                      }`}
                    >
                      <Checkbox checked={active} />
                      <span className="text-sm font-medium">{site.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Current theme in app: <span className="font-medium capitalize">{theme}</span>
              </p>
              <Button onClick={savePreferences} disabled={savingPreferences || loading || !baseUrl}>
                {savingPreferences && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
            <CardHeader>
              <CardTitle>Update policy</CardTitle>
              <CardDescription>
                Decide how aggressively the desktop app handles releases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Release state</span>
                  <Badge variant={getUpdateTone(updateStatus?.status)}>
                    {updateStatus?.status ?? 'idle'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {updateStatus?.message ??
                    'Update status will appear after the app checks the release feed.'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    setUpdatePreferences((current) => ({
                      ...current,
                      autoCheckOnLaunch: !current.autoCheckOnLaunch,
                    }))
                  }
                  className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background px-4 py-4 text-left"
                >
                  <div>
                    <p className="font-medium">Check for updates automatically</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Run the release check during startup and keep scheduled checks active.
                    </p>
                  </div>
                  <Checkbox checked={updatePreferences.autoCheckOnLaunch} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUpdatePreferences((current) => ({
                      ...current,
                      autoDownload: !current.autoDownload,
                    }))
                  }
                  className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background px-4 py-4 text-left"
                >
                  <div>
                    <p className="font-medium">Download updates automatically</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep downloads manual if you want stricter control over release rollout.
                    </p>
                  </div>
                  <Checkbox checked={updatePreferences.autoDownload} />
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={saveUpdatePolicy} disabled={savingUpdatePrefs}>
                  {savingUpdatePrefs && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Save policy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runUpdateAction(window.app.check_for_updates)}
                  disabled={busyAction === 'updates'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runUpdateAction(window.app.download_update)}
                  disabled={busyAction === 'updates' || updateStatus?.status === 'downloaded'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => window.app.quit_and_install_update()}
                  disabled={updateStatus?.status !== 'downloaded'}
                >
                  Install update
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
            <CardHeader>
              <CardTitle>Backend control</CardTitle>
              <CardDescription>
                Monitor the bundled backend and recover quickly when needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Service
                  </p>
                  <p className="mt-2 text-lg font-semibold">{getBackendLabel(backendStatus)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {backendStatus?.message ?? 'No backend message.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Internet
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {internetAvailable === null
                      ? 'Loading'
                      : internetAvailable
                        ? 'Available'
                        : 'Unavailable'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Port {backendStatus?.port ?? 'not assigned'}
                  </p>
                </div>
              </div>

              {backendStatus?.errorId && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{backendStatus.errorId}</p>
                  <p className="mt-1">{backendStatus.message}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={refreshRuntime} disabled={busyAction === 'backend'}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh status
                </Button>
                <Button onClick={restartBackend} disabled={busyAction === 'backend'}>
                  <ServerCog className="mr-2 h-4 w-4" />
                  Restart backend
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.25)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>System reference</CardTitle>
              <CardDescription>
                Key install and support information for this desktop build.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Platform
              </p>
              <p className="mt-2 font-mono text-sm">{appInfo?.platform ?? 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Build type
              </p>
              <p className="mt-2 text-sm font-medium">
                {appInfo
                  ? appInfo.isPackaged
                    ? 'Packaged desktop build'
                    : 'Development build'
                  : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Logs path
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {appInfo?.logsPath ?? 'Loading...'}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Data path
              </p>
              <p className="mt-2 break-all font-mono text-sm">
                {appInfo?.userDataPath ?? 'Loading...'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-medium">{APP_CONFIG.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Managed desktop runtime with local data, bundled backend, and controlled update flow.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}
              className="w-full"
            >
              Open repository
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.app.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}
              className="w-full"
            >
              Contact support
              <ShieldCheck className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
