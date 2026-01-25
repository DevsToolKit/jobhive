// context/app/init/steps/startBackend.ts
import type { InitStep } from '../types';

export const startBackendStep: InitStep = {
  id: 'starting_backend',
  label: 'Starting backend',
  progressKey: 'starting_backend',

  async run(setState) {
    const res = await window.app.start_backend();
    if (!res.ok) {
      throw {
        id: res.errorId,
        message: 'Failed to start backend service.',
      };
    }

    // Save backend info to state
    const baseUrl = `http://127.0.0.1:${res.port}`;
    setState((prev) => ({
      ...prev,
      backendPort: res.port,
      backendBaseUrl: baseUrl,
    }));
  },
};
