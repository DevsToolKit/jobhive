import React from 'react';
import JobCard from '@/components/jobCard/job-card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { GoInfo, GoPlusCircle } from 'react-icons/go';
import { Button } from '@/components/ui/button';
import NoJobAvailable from '@/components/states/NoJobAvailable';
import DashboardSkeleton from '@/components/skeleton/DashboardSkeleton';

function Dashboard() {
  const isJobsAvailable = false;

  if (!isJobsAvailable) {
    return <NoJobAvailable />;
  }

  // if (!isJobsAvailable) {
  //   return <DashboardSkeleton />;
  // }

  return (
    <section className="px-6 py-3 flex flex-col gap-5">
      <div className="flex flex-row justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold">Todays Scrape</h1>
          <div>
            <span className="text-[14px] text-muted-foreground dark:text-muted-foreground">
              33edc5a3-34e9-4085-b8d1-9afc4376cc81
            </span>
          </div>
          <div className="flex flex-row items-center gap-3 mt-5">
            <p className=" text-[20px]">Full stack Developer (Mumbai, IN)</p>
            <HoverCard openDelay={100} closeDelay={200}>
              <HoverCardTrigger>
                <GoInfo />
              </HoverCardTrigger>
              <HoverCardContent>
                The React Framework - created and maintained by @vercel.
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
        <div>
          <Button>
            <GoPlusCircle /> New Scrape
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {[...Array(10)].map((_, index) => (
          <JobCard key={index} />
        ))}
      </div>
    </section>
  );
}

export default Dashboard;
