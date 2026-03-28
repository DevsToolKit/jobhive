import NoJobAvailable from '@/components/states/NoJobAvailable';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import DashboardHeader from './DashboardHeader';
import DashboardJobsGrid from './DashboardJobsGrid';
import { useDashboard } from './DashboardContext';

type DashboardProps = {
  onNewScrape: () => void;
};

export default function Dashboard({ onNewScrape }: DashboardProps) {
  const { session, jobs, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session || jobs.length === 0) {
    return <NoJobAvailable onNewScrape={onNewScrape} />;
  }

  return (
    <section className="px-6 py-3 flex flex-col gap-5">
      <DashboardHeader session={session} onNewScrape={onNewScrape} />

      <DashboardJobsGrid jobs={jobs} />
    </section>
  );
}
