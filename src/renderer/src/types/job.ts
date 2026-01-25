// types/job.ts
export interface Job {
  id: number;
  session_id: string;
  site: string;
  title: string;
  company: string | null;
  company_url: string | null;
  job_url: string;
  location_country: string | null;
  location_city: string | null;
  location_state: string | null;
  is_remote: boolean;
  description: string;
  tags: string;
  job_type: string;
  min_amount: number | null;
  max_amount: number | null;
  currency: string | null;
  interval: string | null;
  date_posted: string;
  scraped_at: string;
}
