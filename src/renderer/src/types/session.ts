// types/session.ts
export interface Session {
  id: string;
  search_term: string;
  location: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  total_jobs: number;
}
