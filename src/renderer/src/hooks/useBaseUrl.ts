import { useAppContext } from '@/context/app/AppContext';

export function useBackend() {
  const { backendBaseUrl, backendPort, isInitialized } = useAppContext();

  return {
    baseUrl: backendBaseUrl,
    port: backendPort,
    isReady: isInitialized && backendBaseUrl !== null,
  };
}
