// types/scrape.ts
export type ScrapeStatus = 'started' | 'scraping' | 'completed' | 'error' | 'cancelled';

export interface ScrapeProgressEvent {
  session_id: string;
  status: ScrapeStatus;
  progress?: number;
  current_site?: string;
  jobs_found?: number;
  message?: string;
  error?: string;
}

export interface ScrapeStartResponse {
  session_id: string;
  status: string;
  message: string;
}
