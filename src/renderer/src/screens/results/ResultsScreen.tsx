import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useBackend } from '@/hooks/useBaseUrl';
import DashboardJobsGrid from '@/screens/dashboard/DashboardJobsGrid';
import type { Job } from '@/types/job';
import type { Session } from '@/types/session';

export default function ResultsScreen() {
  const { sessionId } = useParams();
  const { baseUrl } = useBackend();

  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseUrl || !sessionId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sessionResponse, jobsResponse] = await Promise.all([
          fetch(`${baseUrl}/api/sessions/${sessionId}`),
          fetch(`${baseUrl}/api/sessions/${sessionId}/jobs`),
        ]);

        if (!sessionResponse.ok || !jobsResponse.ok) {
          throw new Error('Unable to load session results');
        }

        setSession(await sessionResponse.json());
        setJobs(await jobsResponse.json());
      } catch {
        setError('Unable to load this scrape session.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [baseUrl, sessionId]);

  if (loading) {
    return <section className="px-6 py-4 text-sm text-muted-foreground">Loading results...</section>;
  }

  if (error || !session) {
    return <section className="px-6 py-4 text-sm text-red-500">{error ?? 'Session not found'}</section>;
  }

  return (
    <section className="px-6 py-3 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground capitalize">
              {session.search_term}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {session.location && (
              <>
                <span className="capitalize">{session.location}</span>
                <span className="text-muted-foreground/40">·</span>
              </>
            )}
            <span>Status: <span className="capitalize font-medium text-foreground">{session.status}</span></span>
          </div>
        </div>
      </div>

      <DashboardJobsGrid jobs={jobs} />
    </section>
  );
}
