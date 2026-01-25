export type AppError = {
  id: string;
  message: string;
};

export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  progress: number;
  currentStep: 'checking_internet' | 'starting_backend' | 'initializing_db' | 'ready';
  error: AppError | null;
}