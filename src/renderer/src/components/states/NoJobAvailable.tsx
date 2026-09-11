import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoJobAvailableProps {
  onNewScrape: () => void;
}

function NoJobAvailable({ onNewScrape }: NoJobAvailableProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-8 ring-muted/20 mb-4">
        <Briefcase className="h-7 w-7 stroke-[1.75]" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          No Jobs Available
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          There are currently no job listings to display. You can start a new job scrape
          or review previously scraped jobs from your history.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onNewScrape} className="gap-2 shadow-xs cursor-pointer">
          <Plus className="h-4 w-4" />
          New Scrape
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/history')}
          className="gap-2 border-border/80 shadow-xs cursor-pointer"
        >
          <History className="h-4 w-4" />
          View Scrape History
        </Button>
      </div>
    </div>
  );
}

export default NoJobAvailable;

