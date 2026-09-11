import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  LoaderCircle,
  Moon,
  RefreshCw,
  ServerCog,
  Settings2,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';

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
      className={`rounded-2xl border px-5 py-5 text-left transition cursor-pointer ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-background hover:border-primary/35'
      }`}
    >
      <div className="mb-4">{icon}</div>
      <p className="font-medium text-base">{title}</p>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          active ? 'text-primary-foreground/80' : 'text-muted-foreground'
        }`}
      >
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
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background px-5 py-5 text-left transition cursor-pointer hover:border-border"
    >
      <div>
        <p className="font-medium text-base text-foreground">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Checkbox checked={checked} className="pointer-events-none mt-1 shrink-0" />
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
  const [copiedKey, setCopiedKey] = useState<'logs' | 'data' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);

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
          toast.error('Some settings could not be loaded.');
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
    if (!baseUrl) {
      toast.error('Backend is offline.');
      return;
    }

    setSavingPreferences(true);

    try {
      const saved = await updateAppSettings(baseUrl, settingsForm);
      setSettingsForm(saved);
      setTheme(saved.theme);
      toast.success('Workspace preferences saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save preferences.');
    } finally {
      setSavingPreferences(false);
    }
  };

  const saveUpdatePolicy = async () => {
    setSavingUpdatePrefs(true);

    try {
      const saved = await window.app.setUpdatePreferences(updatePreferences);
      setUpdatePreferences(saved);
      toast.success('Update policy saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save update policy.');
    } finally {
      setSavingUpdatePrefs(false);
    }
  };

  const refreshRuntime = async () => {
    setBusyAction('backend');

    try {
      const [updates, backend, internet] = await Promise.all([
        window.app.getUpdateStatus(),
        window.app.get_backend_status(),
        window.app.check_internet(),
      ]);

      setUpdateStatus(updates);
      setBackendStatus(backend);
      setInternetAvailable(internet);
      toast.success('Runtime status refreshed.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to refresh runtime state.');
    } finally {
      setBusyAction(null);
    }
  };

  const restartBackend = async () => {
    setBusyAction('backend');

    try {
      toast.info('Restarting backend...');
      const nextStatus = await window.app.restart_backend();
      setBackendStatus(nextStatus);
      setInternetAvailable(await window.app.check_internet());
      if (nextStatus.ok) {
        toast.success('Backend restarted.');
      } else {
        toast.warning('Backend restart reported an issue.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to restart backend.');
    } finally {
      setBusyAction(null);
    }
  };

  const runUpdateAction = async (action: () => Promise<UpdateStatus>, label: string) => {
    setBusyAction('updates');

    try {
      toast.info(`${label}...`);
      const nextStatus = await action();
      setUpdateStatus(nextStatus);
      toast.success(`${label} finished.`);
    } catch (error) {
      console.error(error);
      toast.error(`${label} failed.`);
    } finally {
      setBusyAction(null);
    }
  };

  const copyPath = async (path: string, key: 'logs' | 'data') => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedKey(key);
      toast.success(`${key === 'logs' ? 'Logs' : 'Data'} path copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Failed to copy path');
    }
  };

  return (
    <section className="w-full px-6 py-8 md:px-8">
      <div className="w-full space-y-8">
        {/* Header Section without top pill */}
        <header className="space-y-4 border-b border-border/50 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Configure application appearance, scraper search defaults, update policies, and
                runtime services.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant={getUpdateTone(updateStatus?.status)} className="px-3 py-1 text-xs">
                {releaseLabel}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                Backend {getBackendLabel(backendStatus)}
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-xs">
                v{appInfo?.version ?? '...'}
              </Badge>
            </div>
          </div>
        </header>

        {/* Card 1: Workspace Preferences */}
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Workspace preferences</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Set the visual tone and the defaults the app should use for a fresh scrape.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 pt-8">
            {/* Theme Mode */}
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

            {/* Inputs: Location & Country */}
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="default-location" className="text-sm font-medium">
                  Default location
                </Label>
                <Input
                  id="default-location"
                  value={settingsForm.default_location}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_location: event.target.value,
                    }))
                  }
                  placeholder="e.g. Mumbai, IN or Remote"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Default Indeed country</Label>
                <Select
                  value={settingsForm.default_country_indeed}
                  onValueChange={(value) =>
                    setSettingsForm((current) => ({
                      ...current,
                      default_country_indeed: value,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 text-sm">
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

            {/* Results Slider */}
            <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <Label className="text-sm font-medium">Default results target</Label>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    This controls the initial result count whenever a new scrape form is opened.
                  </p>
                </div>
                <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm font-medium">
                  {settingsForm.default_results_wanted} results
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
                className="cursor-pointer py-1"
              />
            </div>

            {/* Preferred Sources */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Preferred sources</Label>
              <div className="flex flex-wrap gap-3">
                {SITES.map((site) => {
                  const active = settingsForm.default_sites.includes(site.value);

                  return (
                    <button
                      key={site.value}
                      type="button"
                      onClick={() => toggleSite(site.value)}
                      className={`flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm transition cursor-pointer ${
                        active
                          ? 'border-primary bg-primary/10 text-foreground font-medium'
                          : 'border-border/70 bg-background text-muted-foreground hover:border-primary/35'
                      }`}
                    >
                      <Checkbox checked={active} className="pointer-events-none" />
                      <span>{site.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Active theme: <span className="font-medium capitalize text-foreground">{theme}</span>
              </p>
              <Button
                onClick={savePreferences}
                disabled={savingPreferences || loading || !baseUrl}
                className="cursor-pointer"
              >
                {savingPreferences && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Release Management */}
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Release management</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Decide how updates are checked, downloaded, and installed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{releaseLabel}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {updateStatus?.message ??
                      'Update status will appear here after the release feed is checked.'}
                  </p>
                </div>
                <Badge variant={getUpdateTone(updateStatus?.status)} className="self-start sm:self-center">
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
              <Button
                variant="outline"
                onClick={saveUpdatePolicy}
                disabled={savingUpdatePrefs}
                className="cursor-pointer"
              >
                {savingUpdatePrefs && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save policy
              </Button>
              <Button
                variant="outline"
                onClick={() => runUpdateAction(window.app.check_for_updates, 'Checking for updates')}
                disabled={busyAction === 'updates'}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check now
              </Button>
              <Button
                variant="outline"
                onClick={() => runUpdateAction(window.app.download_update, 'Downloading update')}
                disabled={busyAction === 'updates' || updateStatus?.status === 'downloaded'}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => window.app.quit_and_install_update()}
                disabled={updateStatus?.status !== 'downloaded'}
                className="cursor-pointer"
              >
                Install update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Backend and Runtime */}
        <Card className="border-border/70 bg-card shadow-[0_20px_45px_-36px_rgba(15,23,42,0.22)]">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <ServerCog className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Backend and runtime</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monitor service health, connectivity, and install details without leaving the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Backend
                </p>
                <p className="mt-3 text-xl font-semibold text-foreground">
                  {getBackendLabel(backendStatus)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {backendStatus?.message ?? 'No backend message.'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Internet
                </p>
                <p className="mt-3 text-xl font-semibold text-foreground">
                  {internetAvailable === null
                    ? 'Loading'
                    : internetAvailable
                      ? 'Available'
                      : 'Unavailable'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Current backend port: {backendStatus?.port ?? 'not assigned'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Build
                </p>
                <p className="mt-3 text-xl font-semibold text-foreground">
                  {appInfo
                    ? appInfo.isPackaged
                      ? 'Packaged'
                      : 'Development'
                    : 'Loading'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {appInfo?.platform ?? 'Detecting platform'}
                </p>
              </div>
            </div>

            {backendStatus?.errorId && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{backendStatus.errorId}</p>
                <p className="mt-2 leading-relaxed">{backendStatus.message}</p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                    Logs path
                  </p>
                  {appInfo?.logsPath && (
                    <button
                      type="button"
                      onClick={() => copyPath(appInfo.logsPath, 'logs')}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'logs' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedKey === 'logs' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <p className="mt-3 break-all font-mono text-sm leading-relaxed text-foreground">
                  {appInfo?.logsPath ?? 'Loading...'}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                    Data path
                  </p>
                  {appInfo?.userDataPath && (
                    <button
                      type="button"
                      onClick={() => copyPath(appInfo.userDataPath, 'data')}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {copiedKey === 'data' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedKey === 'data' ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <p className="mt-3 break-all font-mono text-sm leading-relaxed text-foreground">
                  {appInfo?.userDataPath ?? 'Loading...'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/70 pt-6">
              <Button
                variant="outline"
                onClick={refreshRuntime}
                disabled={busyAction === 'backend'}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh status
              </Button>
              <Button
                onClick={restartBackend}
                disabled={busyAction === 'backend'}
                className="cursor-pointer"
              >
                <ServerCog className="mr-2 h-4 w-4" />
                Restart backend
              </Button>
              <Button
                variant="outline"
                onClick={() => window.app.openExternalUrl(APP_CONFIG.repository.url)}
                className="cursor-pointer"
              >
                Open repository
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.app.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}
                className="cursor-pointer"
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
