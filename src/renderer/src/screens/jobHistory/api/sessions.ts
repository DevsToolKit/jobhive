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

export async function exportSession(
  baseUrl: string,
  sessionId: string,
  format: 'csv' | 'json',
  defaultFilename?: string
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/export/${format}`);

  if (!res.ok) {
    throw new Error(`Failed to export session as ${format.toUpperCase()}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename || `jobhive_session_${sessionId}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

