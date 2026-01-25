import type { AppState } from '../types';

export type InitStepId = 'checking_internet' | 'starting_backend' | 'initializing_db' | 'ready';

export type InitStep = {
  id: InitStepId;
  label: string;
  progressKey: InitStepId;
  run: () => Promise<void>;
};

export type InitContext = {
  setState: React.Dispatch<React.SetStateAction<AppState>>;
};
