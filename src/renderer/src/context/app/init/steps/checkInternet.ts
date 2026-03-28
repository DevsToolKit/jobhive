import type { InitStep } from '../types';

export const checkInternetStep: InitStep = {
  id: 'checking_internet',
  label: 'Checking internet connection',
  progressKey: 'checking_internet',

  async run() {
    try {
      await window.app.check_internet();
    } catch {
      // Network availability should not block the desktop app from opening.
    }
  },
};
