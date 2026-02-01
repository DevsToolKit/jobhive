import JobCard from '@/components/jobCard/job-card';
import { Job } from '@/types/job';

type Props = {
  jobs: Job[];
};

export default function DashboardJobsGrid({ jobs }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} tags={JSON.parse(job.tags)} />
      ))}
    </div>
  );
}
