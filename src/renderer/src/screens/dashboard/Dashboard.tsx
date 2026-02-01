import NoJobAvailable from '@/components/states/NoJobAvailable';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';
import { ModalId } from '@/App';
import DashboardHeader from './DashboardHeader';
import DashboardJobsGrid from './DashboardJobsGrid';
import { useDashboard } from './DashboardContext';

type DashboardProps = {
  setOpenModal: React.Dispatch<React.SetStateAction<ModalId | null>>;
};

export default function Dashboard({ setOpenModal }: DashboardProps) {
  // Use the context instead of the hook directly
  const { session, jobs, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session || jobs.length === 0) {
    return <NoJobAvailable setOpenModal={setOpenModal} />;
  }

  return (
    <section className="px-6 py-3 flex flex-col gap-5">
      <DashboardHeader
        session={session}
        onNewScrape={() => {
          setOpenModal('new-scrape');
        }}
      />

      <DashboardJobsGrid jobs={jobs} />
    </section>
  );
}
