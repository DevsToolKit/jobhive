// /api/sessions.ts
import { Session } from '../types';

export async function fetchSessions(baseUrl: string): Promise<Session[]> {
  const res = await fetch(`${baseUrl}/api/sessions`);

  if (!res.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return res.json();
}

export async function deleteSession(baseUrl: string, sessionId: string) {
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete session');
  }

  return res.json();
}
