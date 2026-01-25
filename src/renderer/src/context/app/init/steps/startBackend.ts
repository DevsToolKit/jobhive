import type { InitStep } from '../types';

export const startBackendStep: InitStep = {
  id: 'starting_backend',
  label: 'Starting backend',
  progressKey: 'starting_backend',

  async run() {
    const res = await window.app.start_backend();
    if (!res.ok) {
      throw {
        id: res.errorId,
        message: 'Failed to start backend service.',
      };
    }
  },
};
