import { useEffect, useRef, useState } from 'react';
import { useBackend } from './useBaseUrl';

export type ScrapeProgress = {
  status: 'running' | 'completed' | 'error' | 'cancelled';
  progress?: number;
  message?: string;
  jobs_found?: number;
};

export function useScrapeProgress(sessionId: string | null) {
  const [progress, setProgress] = useState<ScrapeProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { baseUrl, isReady } = useBackend();

  useEffect(() => {
    if (!sessionId || !isReady) return;

    const es = new EventSource(`${baseUrl}/api/scrape/progress/${sessionId}`);

    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    });

    es.addEventListener('status', (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    });

    es.addEventListener('error', () => {
      setConnected(false);
      es.close();
    });

    es.addEventListener('close', () => {
      setConnected(false);
      es.close();
    });

    return () => {
      es.close();
    };
  }, [sessionId]);

  return {
    progress,
    connected,
  };
}
