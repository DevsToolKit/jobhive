import { getBackendSnapshot } from '@/state/backend/backendStore';

export function getApiBaseUrl() {
  const backend = getBackendSnapshot();

  if (!backend.running || !backend.url) {
    throw new Error('Backend not running');
  }

  return backend.url;
}
