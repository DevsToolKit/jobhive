import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { GoPlusCircle } from 'react-icons/go';

function NoJobAvailable({ onNewScrape }: { onNewScrape: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">No Jobs Available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          There are currently no job listings available. You can start a new job scrape or review
          previously scraped jobs from the history.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={onNewScrape} className="gap-2 shadow-sm">
          <GoPlusCircle className="size-4" /> New Scrape
        </Button>
        <Button variant="outline" onClick={() => navigate('/history')}>
          View Scrape History
        </Button>
      </div>
    </div>
  );
}

export default NoJobAvailable;
