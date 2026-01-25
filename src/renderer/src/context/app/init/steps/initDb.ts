// context/app/init/steps/initDb.ts
import type { InitStep } from '../types';

export const initDbStep: InitStep = {
  id: 'initializing_db',
  label: 'Initializing database',
  progressKey: 'initializing_db',

  async run(setState) {
    await new Promise((res) => setTimeout(res, 500));
  },
};
