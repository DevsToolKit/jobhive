import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type BackendStatus = 'idle' | 'starting' | 'ready' | 'error';

interface BackendState {
  port: number | null;
  baseUrl: string | null;
  status: BackendStatus;
  errorId: string | null;
  refresh: () => Promise<void>;
}

export const BackendContext = createContext<BackendState | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [port, setPort] = useState<number | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<BackendStatus>('idle');
  const [errorId, setErrorId] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const result = await window.app.get_backend_status();

      if (!result.ok || !result.port) {
        setStatus('error');
        setErrorId(result.errorId ?? 'UNKNOWN');
        return;
      }

      const url = `http://127.0.0.1:${result.port}`;

      setPort(result.port);
      setBaseUrl(url);
      setStatus('ready');
      setErrorId(null);
    } catch (err) {
      console.error('Failed to get backend status', err);
      setStatus('error');
      setErrorId('STATUS_FAILED');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <BackendContext.Provider
      value={{
        port,
        baseUrl,
        status,
        errorId,
        refresh: fetchStatus,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}
