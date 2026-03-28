import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <section className="space-y-6 px-6 py-4">
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-3xl">{session.search_term}</CardTitle>
          <CardDescription>
            {session.location} · {session.total_jobs} jobs · {session.status}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Review a prior scrape session and open jobs directly from the saved results.
        </CardContent>
      </Card>

      <DashboardJobsGrid jobs={jobs} />
    </section>
  );
}
