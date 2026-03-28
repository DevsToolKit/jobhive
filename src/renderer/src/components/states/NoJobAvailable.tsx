import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { GoPlusCircle } from 'react-icons/go';

function NoJobAvailable({ onNewScrape }: { onNewScrape: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-[88vh] flex flex-col items-center justify-center text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">No Jobs Available</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          There are currently no job listings available. You can start a new job scrape or review
          previously scraped jobs from the history.
        </p>
      </div>

      <div className="mt-6 flex gap-4">
        <Button onClick={onNewScrape}>
          <GoPlusCircle /> New Scrape
        </Button>
        <Button variant="outline" onClick={() => navigate('/history')}>
          View Scrape History
        </Button>
      </div>
    </div>
  );
}

export default NoJobAvailable;
