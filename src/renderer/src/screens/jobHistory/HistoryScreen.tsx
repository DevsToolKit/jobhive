// HistoryScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackend } from '@/hooks/useBaseUrl';
import { deleteSession, fetchSessions } from './api/sessions';
import { Session } from './types';
import { HistoryFilters } from './HistoryFilters';
import { HistoryTable } from './HistoryTable';

export default function HistoryScreen() {
  const { baseUrl } = useBackend();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Session['status']>('all');

  useEffect(() => {
    if (!baseUrl) return;

    async function loadSessions() {
      try {
        const data = await fetchSessions(baseUrl || '');
        setSessions(data);
      } catch {
        setError('Unable to load history');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [baseUrl]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!baseUrl) return;

    try {
      await deleteSession(baseUrl, sessionId);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
    } catch {
      setError('Unable to delete history item');
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.search_term.toLowerCase().includes(search.toLowerCase()) ||
        s.location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === 'all' ? true : s.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, status]);

  return (
    <section className="px-6 py-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">History</h1>

      <HistoryFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <HistoryTable
          sessions={filteredSessions}
          onView={(id) => navigate(`/results/${id}`)}
          onDelete={handleDeleteSession}
        />
      )}
    </section>
  );
}
