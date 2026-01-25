import React from 'react';
import { Button } from '../ui/button';

function NoJobAvailable() {
  return (
    <div className="w-full h-[88vh] flex flex-col items-center justify-center text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold text-gray-900">No Jobs Available</h1>
        <p className="mt-2 text-sm text-gray-600">
          There are currently no job listings available. You can start a new job scrape or review
          previously scraped jobs from the history.
        </p>
      </div>

      <div className="mt-6 flex gap-4">
        <Button>Start New Scrape</Button>
        <Button variant="outline">View Scrape History</Button>
      </div>
    </div>
  );
}

export default NoJobAvailable;
