import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type AppInfo = Awaited<ReturnType<typeof window.app.getAppInfo>>;
type UpdateStatus = Awaited<ReturnType<typeof window.app.getUpdateStatus>>;

export default function SettingsScreen() {
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

  return (
    <div className="space-y-6 p-6">
      <Card className="space-y-4 p-6">
        <div>
          <h1 className="text-xl font-semibold">Desktop Runtime</h1>
          <p className="text-sm text-muted-foreground">
            Version, logs, and update state for the packaged Electron app.
          </p>
        </div>

        <div className="grid gap-3 text-sm">
          <div>
            Version: <span className="font-mono">{appInfo?.version ?? 'Loading...'}</span>
          </div>
          <div>
            Platform: <span className="font-mono">{appInfo?.platform ?? 'Loading...'}</span>
          </div>
          <div>
            Logs: <span className="font-mono break-all">{appInfo?.logsPath ?? 'Loading...'}</span>
          </div>
          <div>
            Data: <span className="font-mono break-all">{appInfo?.userDataPath ?? 'Loading...'}</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Auto Updates</h2>
          <p className="text-sm text-muted-foreground">
            Free setup: publish Windows artifacts and update metadata to GitHub Releases or a static URL.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="font-medium">{updateStatus?.status ?? 'idle'}</div>
          <p className="mt-1 text-muted-foreground">{updateStatus?.message ?? 'Loading update status...'}</p>
          {updateStatus?.downloadedVersion && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ready to install: <span className="font-mono">{updateStatus.downloadedVersion}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => runAction(window.app.check_for_updates)}>
            Check for updates
          </Button>

          <Button
            disabled={busy || updateStatus?.status === 'downloaded'}
            variant="outline"
            onClick={() => runAction(window.app.download_update)}
          >
            Download update
          </Button>

          <Button
            disabled={busy || updateStatus?.status !== 'downloaded'}
            variant="secondary"
            onClick={() => window.app.quit_and_install_update()}
          >
            Restart and install
          </Button>
        </div>
      </Card>
    </div>
  );
}
