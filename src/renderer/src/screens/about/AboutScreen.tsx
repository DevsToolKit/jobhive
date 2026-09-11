import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bug,
  Check,
  Copy,
  Github,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import appLogo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useTerms } from '@/context/terms/TermsContext';

interface AppInfoState {
  name: string;
  version: string;
  isPackaged: boolean;
  platform: string;
  logsPath: string;
  userDataPath: string;
}

export default function AboutScreen() {
  const { openTerms } = useTerms();
  const [appInfo, setAppInfo] = useState<AppInfoState>({
    name: APP_CONFIG.name,
    version: '1.0.2',
    isPackaged: false,
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    logsPath: '',
    userDataPath: '',
  });

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.app?.getAppInfo) {
      window.app
        .getAppInfo()
        .then((info) => setAppInfo(info))
        .catch(() => {});
    }
  }, []);

  const handleCheckForUpdates = async () => {
    if (!window.app?.check_for_updates) {
      toast.info('Update checking is available in packaged builds.');
      return;
    }

    try {
      setCheckingUpdate(true);
      setUpdateMessage('Checking for updates...');
      const result = await window.app.check_for_updates();

      if (result.updateAvailable) {
        setUpdateMessage(`Version ${result.downloadedVersion || 'latest'} available`);
        toast.success('A new version is available for download.');
      } else {
        setUpdateMessage(`JobHive is up to date (v${appInfo.version})`);
        toast.info(`You are running the latest version.`);
      }
    } catch {
      setUpdateMessage('Unable to reach update server');
      toast.error('Failed to check for updates.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleCopyDiagnostics = async () => {
    const specs = [
      `JobHive: v${appInfo.version} (${appInfo.isPackaged ? 'Production' : 'Development'})`,
      `Platform: ${appInfo.platform || navigator.platform}`,
      `User Agent: ${navigator.userAgent}`,
      `Logs: ${appInfo.logsPath || 'N/A'}`,
      `UserData: ${appInfo.userDataPath || 'N/A'}`,
      `Date: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(specs);
      setCopied(true);
      toast.success('System diagnostics copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getPlatformLabel = () => {
    const p = appInfo.platform.toLowerCase();
    if (p.includes('darwin') || p.includes('mac')) return 'macOS';
    if (p.includes('win')) return 'Windows';
    if (p.includes('linux')) return 'Linux';
    return appInfo.platform || 'Desktop';
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-12">
      {/* Product Hero Header - Open & Cardless */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={appLogo}
              alt="JobHive Logo"
              className="h-16 w-16 object-contain rounded-2xl drop-shadow-sm select-none"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  {APP_CONFIG.name}
                </h1>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/60">
                  v{appInfo.version}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ● {appInfo.isPackaged ? 'Stable Release' : 'Dev Build'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {APP_CONFIG.tagline}
              </p>
            </div>
          </div>

          {/* External Links */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.app?.openExternalUrl(APP_CONFIG.repository.url)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.app?.openExternalUrl(`${APP_CONFIG.repository.url}/issues`)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Bug className="h-3.5 w-3.5" />
              <span>Issues</span>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          JobHive is a local-first desktop workspace built for focused job market discovery.
          It concurrently queries top job platforms—including LinkedIn, Indeed, Glassdoor, and
          Google Jobs—normalizing unstructured postings into a unified schema without cloud
          tracking, accounts, or browser tab overload.
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            size="sm"
            onClick={handleCheckForUpdates}
            disabled={checkingUpdate}
            className="h-8.5 gap-2 text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
            <span>{checkingUpdate ? 'Checking...' : 'Check for Updates'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDiagnostics}
            className="h-8.5 gap-2 text-xs font-medium cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy System Diagnostics</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.app?.openExternalUrl(`mailto:${APP_CONFIG.supportEmail}`)}
            className="h-8.5 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Support</span>
          </Button>

          {updateMessage && (
            <span className="text-xs text-muted-foreground font-medium pl-1">
              {updateMessage}
            </span>
          )}
        </div>
      </div>

      {/* Philosophy & Architecture - Clean Narrative */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Architecture & Principles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-[14px]">
              Local-First & Private
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Search history, saved presets, and extracted job cards remain exclusively
              on your local machine. There are no remote telemetry trackers, user tracking
              beacons, or cloud databases.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-[14px]">
              Multi-Platform Aggregation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              JobHive runs parallel extractions against LinkedIn, Indeed, Glassdoor, and
              Google Jobs, performing real-time deduplication and cleaning compensation,
              location, and role metadata.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-[14px]">
              Repeatable Search Presets
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Save multi-site query configurations with location filters and target roles
              to execute automated sweeps in a single click without repetitive form entry.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground text-[14px]">
              Structured Exports
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instantly export any scrape session into clean CSV or JSON format, optimized
              for Google Sheets, personal ATS trackers, or custom analysis pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* System Specifications Table - Clean Line Items */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          System Specifications
        </h2>

        <div className="divide-y divide-border/40 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Application Version</span>
            <span className="font-mono font-medium text-foreground">
              {appInfo.version} ({appInfo.isPackaged ? 'Packaged' : 'Unpackaged Dev'})
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Host Platform</span>
            <span className="text-foreground font-medium">
              {getPlatformLabel()} ({appInfo.platform || 'unknown'})
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Core Stack</span>
            <span className="text-foreground font-medium">
              Electron 40 · React 19 · Vite · Python 3
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Storage Engine</span>
            <span className="text-foreground font-medium">
              Local SQLite (Direct File I/O)
            </span>
          </div>

          {appInfo.logsPath && (
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground font-medium shrink-0">Logs Directory</span>
              <span
                className="font-mono text-[11px] text-muted-foreground truncate max-w-sm text-right"
                title={appInfo.logsPath}
              >
                {appInfo.logsPath}
              </span>
            </div>
          )}

          {appInfo.userDataPath && (
            <div className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-muted-foreground font-medium shrink-0">User Data Path</span>
              <span
                className="font-mono text-[11px] text-muted-foreground truncate max-w-sm text-right"
                title={appInfo.userDataPath}
              >
                {appInfo.userDataPath}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legal & Open Source Footer */}
      <div className="pt-6 border-t border-border/50 space-y-4 text-xs text-muted-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p>
            Created & maintained by{' '}
            <button
              type="button"
              onClick={() => window.app?.openExternalUrl('https://github.com/DevsToolKit')}
              className="font-medium text-foreground hover:underline cursor-pointer"
            >
              {APP_CONFIG.company}
            </button>
            {' '}(DevsToolKit).
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openTerms}
              className="hover:text-foreground transition-colors cursor-pointer font-medium text-foreground/90 underline-offset-4 hover:underline"
            >
              Terms & Privacy
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => window.app?.openExternalUrl(`${APP_CONFIG.repository.url}/blob/main/LICENSE`)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              MIT License
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => window.app?.openExternalUrl(`${APP_CONFIG.repository.url}/releases`)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Changelog
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => window.app?.openExternalUrl(APP_CONFIG.repository.url)}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Source Code
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Disclaimer: JobHive is an independent local search aggregation application. It is not
          affiliated with, endorsed by, or sponsored by LinkedIn, Indeed, Glassdoor, or Google.
          All trademarks belong to their respective copyright holders.
        </p>
      </div>
    </div>
  );
}
