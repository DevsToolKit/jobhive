// screens/Dashboard.tsx
import { useEffect, useState } from 'react';
import JobCard from '@/components/jobCard/job-card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { GoInfo, GoPlusCircle } from 'react-icons/go';
import { Button } from '@/components/ui/button';
import NoJobAvailable from '@/components/states/NoJobAvailable';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import { useBackend } from '@/hooks/useBaseUrl';
import { Session } from '@/types/session';
import { Job } from '@/types/job';

function Dashboard() {
  const { baseUrl, isReady } = useBackend();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [jobsData, setJobsData] = useState<Job[]>([]);

  useEffect(() => {
    if (!isReady || !baseUrl) {
      console.log('[Dashboard] Waiting for backend...', { isReady, baseUrl });
      return;
    }

    console.log('[Dashboard] Fetching data with baseUrl:', baseUrl);

    const fetchData = async () => {
      try {
        setLoading(true);

        const sessionResponse = await fetch(`${baseUrl}/api/sessions/latest`);
        if (!sessionResponse.ok) throw new Error('Failed to fetch session');

        const sessionData = await sessionResponse.json();
        setSession(sessionData);

        const jobsResponse = await fetch(`${baseUrl}/api/sessions/${sessionData.id}/jobs`);
        if (!jobsResponse.ok) throw new Error('Failed to fetch jobs');

        const jobs = await jobsResponse.json();
        setJobsData(jobs);
      } catch (error) {
        console.error('[Dashboard] Error:', error);
        setSession(null);
        setJobsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, isReady]);

  useEffect(() => {
    console.log('[Dashboard] Jobs data:', jobsData);
  }, [jobsData]);

  if (!isReady || loading) {
    return <DashboardSkeleton />;
  }

  // Show NoJobAvailable if no session OR if jobs array is empty
  if (!session || jobsData.length === 0) {
    return <NoJobAvailable />;
  }

  return (
    <section className="px-6 py-3 flex flex-col gap-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Todays Scrape</h1>
          <span className="text-[14px] text-muted-foreground">{session.id}</span>

          <div className="flex items-center gap-3 mt-5">
            <p className="text-[20px] capitalize">
              {session.search_term} ({session.location})
            </p>

            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger>
                <GoInfo />
              </HoverCardTrigger>
              <HoverCardContent className="w-[500px]">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Scrape ID:</span>
                    <span>{session.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Search Term:</span>
                    <span>{session.search_term}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{session.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span>{session.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Jobs:</span>
                    <span>{session.total_jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Created At:</span>
                    <span>{new Date(session.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        <Button>
          <GoPlusCircle /> New Scrape
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {jobsData.map((job) => (
          <JobCard key={job.id} job={job} tags={JSON.parse(job.tags)} />
        ))}
      </div>
    </section>
  );
}

export default Dashboard;
