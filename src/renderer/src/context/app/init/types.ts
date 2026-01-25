// context/app/init/types.ts
import type { AppState } from '../types';

export type InitStepId = 'checking_internet' | 'starting_backend' | 'initializing_db' | 'ready';

export interface InitStep {
  id: InitStepId;
  label: string;
  progressKey: string;
  run: (setState: React.Dispatch<React.SetStateAction<AppState>>) => Promise<void>;
}
