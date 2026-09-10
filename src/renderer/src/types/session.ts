// types/session.ts
export type SessionStatus = 'completed' | 'pending' | 'failed' | 'running' | 'cancelled';

export interface Session {
  id: string;
  search_term: string;
  location: string | null;
  created_at: string;
  status: SessionStatus;
  total_jobs: number;
}

