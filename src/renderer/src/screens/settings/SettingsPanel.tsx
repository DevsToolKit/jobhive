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

function getUpdateLabel(status?: string) {
  if (status === 'downloaded') return 'Ready to install';
  if (status === 'available') return 'Update available';
  if (status === 'downloading') return 'Downloading';
  if (status === 'checking') return 'Checking';
  if (status === 'error') return 'Attention needed';
  return 'Up to date';
}

function getBackendLabel(status: BackendStatus | null) {
  if (!status) return 'Loading';
  return status.running ? 'Online' : 'Offline';
}

function ToneButton({
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
      className={`rounded-2xl border px-5 py-5 text-left transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-background hover:border-primary/35'
      }`}
    >
      <div className="mb-4">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className={`mt-2 text-sm leading-6 ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        {description}
      </p>
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background px-5 py-5 text-left"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} />
    </button>
  );
}

export default function SettingsPanel() {
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
          setSettingsForm((current) => ({
            ...settings,
            theme: current.theme,
          }));
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
  }, [baseUrl]);

  useEffect(() => {
    setSettingsForm((current) => {
      if (current.theme === theme) {
        return current;
      }

      return {
        ...current,
        theme,
      };
    });
  }, [theme]);

  const releaseLabel = useMemo(() => getUpdateLabel(updateStatus?.status), [updateStatus]);

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
    <section className="px-6 py-8 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-5 pb-2">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Settings
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">Desktop control panel</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Configure how the app looks, how new scrapes start, how releases are handled,
                and how the backend is monitored.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant={getUpdateTone(updateStatus?.status)} className="px-3 py-1.5 text-xs">
                {releaseLabel}
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-xs">
                Backend {getBackendLabel(backendStatus)}
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-xs">
                v{appInfo?.version ?? '...'}
              </Badge>
            </div>
          </div>

          {feedback && (
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {feedback}
            </div>
          )}
        </header>

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Workspace preferences</CardTitle>
                <CardDescription>
                  Set the visual tone and the defaults the app should use for a fresh scrape.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Theme mode</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <ToneButton
                  active={theme === 'system'}
                  title="System"
                  description="Follow the operating system appearance automatically."
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  onClick={() => setThemePreference('system')}
                />
                <ToneButton
                  active={theme === 'light'}
                  title="Light"
                  description="Use a bright surface with stronger contrast between content layers."
                  icon={<Sun className="h-5 w-5" />}
                  onClick={() => setThemePreference('light')}
                />
                <ToneButton
                  active={theme === 'dark'}
                  title="Dark"
                  description="Lower glare for longer sessions and quieter late-night work."
                  icon={<Moon className="h-5 w-5" />}
                  onClick={() => setThemePreference('dark')}
                />
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-3">
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

              <div className="space-y-3">
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

            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <Label>Default results target</Label>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This controls the initial result count whenever a new scrape form is opened.
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

            <div className="space-y-4">
              <Label>Preferred sources</Label>
              <div className="flex flex-wrap gap-3">
                {SITES.map((site) => {
                  const active = settingsForm.default_sites.includes(site.value);

                  return (
                    <button
                      key={site.value}
                      type="button"
                      onClick={() => toggleSite(site.value)}
                      className={`flex items-center gap-3 rounded-full border px-4 py-3 text-sm transition ${
                        active
                          ? 'border-primary bg-primary/8 text-foreground'
                          : 'border-border/70 bg-background text-muted-foreground hover:border-primary/35'
                      }`}
                    >
                      <Checkbox checked={active} />
                      {site.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
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

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Release management</CardTitle>
                <CardDescription>
                  Decide how updates are checked, downloaded, and installed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{releaseLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {updateStatus?.message ??
                      'Update status will appear here after the release feed is checked.'}
                  </p>
                </div>
                <Badge variant={getUpdateTone(updateStatus?.status)}>
                  {updateStatus?.status ?? 'idle'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <ToggleRow
                title="Check for updates automatically"
                description="Run the release check during startup and keep scheduled checks active."
                checked={updatePreferences.autoCheckOnLaunch}
                onToggle={() =>
                  setUpdatePreferences((current) => ({
                    ...current,
                    autoCheckOnLaunch: !current.autoCheckOnLaunch,
                  }))
                }
              />
              <ToggleRow
                title="Download updates automatically"
                description="Disable this if you want manual control before downloading new releases."
                checked={updatePreferences.autoDownload}
                onToggle={() =>
                  setUpdatePreferences((current) => ({
                    ...current,
                    autoDownload: !current.autoDownload,
                  }))
                }
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/70 pt-6">
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

        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <ServerCog className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Backend and runtime</CardTitle>
                <CardDescription>
                  Monitor service health, connectivity, and install details without leaving the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Backend
                </p>
                <p className="mt-3 text-xl font-semibold">{getBackendLabel(backendStatus)}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {backendStatus?.message ?? 'No backend message.'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Internet
                </p>
                <p className="mt-3 text-xl font-semibold">
                  {internetAvailable === null
                    ? 'Loading'
                    : internetAvailable
                      ? 'Available'
                      : 'Unavailable'}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Current backend port: {backendStatus?.port ?? 'not assigned'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Build
                </p>
                <p className="mt-3 text-xl font-semibold">
                  {appInfo
                    ? appInfo.isPackaged
                      ? 'Packaged'
                      : 'Development'
                    : 'Loading'}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {appInfo?.platform ?? 'Detecting platform'}
                </p>
              </div>
            </div>

            {backendStatus?.errorId && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{backendStatus.errorId}</p>
                <p className="mt-2 leading-6">{backendStatus.message}</p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Logs path
                </p>
                <p className="mt-3 break-all font-mono text-sm leading-6">
                  {appInfo?.logsPath ?? 'Loading...'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Data path
                </p>
                <p className="mt-3 break-all font-mono text-sm leading-6">
                  {appInfo?.userDataPath ?? 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/70 pt-6">
              <Button variant="outline" onClick={refreshRuntime} disabled={busyAction === 'backend'}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh status
              </Button>
              <Button onClick={restartBackend} disabled={busyAction === 'backend'}>
                <ServerCog className="mr-2 h-4 w-4" />
                Restart backend
              </Button>
              <Button
                variant="outline"
                onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}
              >
                Open repository
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.app.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}
              >
                Contact support
                <ShieldCheck className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
