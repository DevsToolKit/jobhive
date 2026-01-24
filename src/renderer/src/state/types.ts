export type InitStep = 'checking_internet' | 'starting_backend' | 'initializing_db' | 'ready';

export type AppState = {
  isLoading: boolean;
  isInitialized: boolean;
  progress: number;
  currentStep: InitStep;
  error: string | null;
};
