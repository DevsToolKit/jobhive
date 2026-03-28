export {};

type BackendDiagnostics = {
  stdout: string[];
  stderr: string[];
};

type BackendStatus = {
  ok: boolean;
  running: boolean;
  port: number | null;
  errorId: string | null;
  message: string | null;
  details: unknown;
  logsPath: string | null;
  diagnostics: BackendDiagnostics | null;
};

type AppInfo = {
  name: string;
  version: string;
  isPackaged: boolean;
  platform: string;
  logsPath: string;
  userDataPath: string;
};

type UpdateStatus = {
  ok: boolean;
  enabled: boolean;
  status: string;
  message: string;
  currentVersion: string;
  updateAvailable: boolean;
  downloadedVersion: string | null;
};

declare global {
  interface Window {
    app: {
      getAppInfo: () => Promise<AppInfo>;
      get_backend_status: () => Promise<BackendStatus>;
      start_backend: () => Promise<BackendStatus>;
      check_internet: () => Promise<boolean>;
      getUpdateStatus: () => Promise<UpdateStatus>;
      check_for_updates: () => Promise<UpdateStatus>;
      download_update: () => Promise<UpdateStatus>;
      quit_and_install_update: () => Promise<{ ok: true }>;
      openExternalUrl: (url: string) => Promise<{ ok: true }>;
    };
  }
}
