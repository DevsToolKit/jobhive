export type AppError = {
  id: string;
  message: string;
  details?: string | null;
  logsPath?: string | null;
  diagnostics?: {
    stdout: string[];
    stderr: string[];
  } | null;
};

export interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  progress: number;
  currentStep: 'checking_internet' | 'starting_backend' | 'initializing_db' | 'ready';
  error: AppError | null;
  backendPort: number | null;
  backendBaseUrl: string | null;
}
