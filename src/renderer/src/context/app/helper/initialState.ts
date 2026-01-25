// context/app/helper/initialState.ts
import type { AppState } from '../types';

export const initialState: AppState = {
  isLoading: true,
  isInitialized: false,
  progress: 0,
  currentStep: 'checking_internet',
  error: null,
  backendPort: null,
  backendBaseUrl: null,
};
