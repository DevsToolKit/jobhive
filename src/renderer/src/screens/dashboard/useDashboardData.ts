import { useCallback, useEffect, useState } from 'react';
import { Session } from '@/types/session';
import { Job } from '@/types/job';
import { useBackend } from '@/hooks/useBaseUrl';

type DashboardData = {
  session: Session | null;
  jobs: Job[];
  isLoading: boolean;
  refreshDashboard: () => Promise<void>;
};

export function useDashboardData(): DashboardData {
  const { baseUrl, isReady } = useBackend();

  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!isReady || !baseUrl) return;

    try {
      setIsLoading(true);

      const sessionResponse = await fetch(`${baseUrl}/api/sessions/latest`);
      if (!sessionResponse.ok) throw new Error('Failed to fetch session');

      const sessions: Session[] = await sessionResponse.json();
      const latestSession = sessions[0] ?? null;

      setSession(latestSession);

      if (!latestSession) {
        setJobs([]);
        return;
      }

      const jobsResponse = await fetch(`${baseUrl}/api/sessions/${latestSession.id}/jobs`);
      if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');

      const fetchedJobs: Job[] = await jobsResponse.json();
      setJobs(fetchedJobs);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, isReady]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    session,
    jobs,
    isLoading,
    refreshDashboard: fetchDashboardData,
  };
}
