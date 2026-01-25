import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { BackendStatus } from './types';

type BackendContextValue = {
  backend: BackendStatus;
  refresh: () => Promise<void>;
};

const BackendContext = createContext<BackendContextValue | undefined>(undefined);

const initialBackendState: BackendStatus = {
  running: false,
  port: null,
  url: null,
};

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [backend, setBackend] = useState<BackendStatus>(initialBackendState);

  const initializedRef = useRef(false);

  async function fetchBackendStatus() {
    const status = await window.app.get_backend_status();

    if (!status?.running) {
      setBackend(initialBackendState);
      return;
    }

    const url = `http://127.0.0.1:${status.port}`;

    setBackend({
      running: true,
      port: status.port,
      url,
    });
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetchBackendStatus();
  }, []);

  return (
    <BackendContext.Provider
      value={{
        backend,
        refresh: fetchBackendStatus,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}

/* ---------------- Hook ---------------- */

export function useBackend() {
  const ctx = useContext(BackendContext);
  if (!ctx) {
    throw new Error('useBackend must be used inside BackendProvider');
  }
  return ctx;
}
