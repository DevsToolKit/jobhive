import { AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/app/AppContext';

export function InitErrorScreen() {
  const app = useAppContext();

  if (!app.error) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Desktop startup failed</h1>
            <p className="text-sm text-muted-foreground">
              JobHive could not finish booting. You can retry once the issue is fixed.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <p>{app.error.message}</p>

          <div className="grid gap-2 text-xs text-muted-foreground">
            <div>
              Error code: <span className="font-mono text-foreground">{app.error.id}</span>
            </div>

            {app.error.logsPath && (
              <div>
                Logs: <span className="font-mono text-foreground">{app.error.logsPath}</span>
              </div>
            )}
          </div>

          {app.error.details && (
            <pre className="max-h-48 overflow-auto rounded-lg bg-background p-3 font-mono text-xs text-foreground/80">
              {app.error.details}
            </pre>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={app.retry}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Retry
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex-1 rounded-md border px-4 py-2"
          >
            Restart App
          </button>
        </div>
      </div>
    </div>
  );
}
