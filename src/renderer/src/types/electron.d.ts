export {};

declare global {
  interface Window {
    electron?: {
      getAppVersion?: () => Promise<string>;
      openExternal?: (url: string) => void;
    };
  }
}
