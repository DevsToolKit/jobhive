export {};

declare global {
  interface Window {
    app?: {
      get_backend_status: () => Promise<{
        running: boolean;
        port: number | null;
      }>;
    };
  }
}
