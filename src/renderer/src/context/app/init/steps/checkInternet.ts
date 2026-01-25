// context/app/init/steps/checkInternet.ts
import type { InitStep } from '../types';

export const checkInternetStep: InitStep = {
  id: 'checking_internet',
  label: 'Checking internet connection',
  progressKey: 'checking_internet',

  async run(setState) {
    const online = await window.app.check_internet();
    if (!online) {
      throw {
        id: 'NO_INTERNET',
        message: 'No internet connection detected.',
      };
    }
  },
};
