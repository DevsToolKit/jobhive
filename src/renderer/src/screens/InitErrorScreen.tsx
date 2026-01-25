import { AlertTriangle } from 'lucide-react';
import { useAppContext } from '@/context/app/AppContext';

export function InitErrorScreen() {
  const app = useAppContext();

  if (!app.error) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-[420px] rounded-xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>

        <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>

        <p className="mb-4 text-sm text-muted-foreground">{app.error.message}</p>

        <div className="flex gap-2">
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

        {import.meta.env.DEV && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error code: <span className="font-mono">{app.error.id}</span>
          </p>
        )}
      </div>
    </div>
  );
}
