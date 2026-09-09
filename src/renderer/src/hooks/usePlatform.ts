import { useEffect, useState } from 'react';

export interface PlatformInfo {
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  modifierKey: '⌘' | 'Ctrl';
  modifierName: 'Cmd' | 'Ctrl';
  platform: 'darwin' | 'win32' | 'linux' | 'unknown';
}

function detectPlatform(): PlatformInfo {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const navPlatform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '';
    const userAgent = navigator.userAgent || '';

    const isMac = /Mac|iPod|iPhone|iPad/i.test(navPlatform) || /Macintosh|Mac OS/i.test(userAgent);
    const isWindows = /Win/i.test(navPlatform) || /Windows/i.test(userAgent);
    const isLinux = !isMac && !isWindows && (/Linux/i.test(navPlatform) || /Linux/i.test(userAgent));

    return {
      isMac,
      isWindows,
      isLinux,
      modifierKey: isMac ? '⌘' : 'Ctrl',
      modifierName: isMac ? 'Cmd' : 'Ctrl',
      platform: isMac ? 'darwin' : isWindows ? 'win32' : isLinux ? 'linux' : 'unknown',
    };
  }

  return {
    isMac: false,
    isWindows: true,
    isLinux: false,
    modifierKey: 'Ctrl',
    modifierName: 'Ctrl',
    platform: 'unknown',
  };
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(detectPlatform);

  useEffect(() => {
    // If running in Electron, we can also query exact app info
    if (typeof window !== 'undefined' && window.app?.getAppInfo) {
      window.app
        .getAppInfo()
        .then((info) => {
          const isMac = info.platform === 'darwin';
          const isWindows = info.platform === 'win32';
          const isLinux = info.platform === 'linux';
          setPlatformInfo({
            isMac,
            isWindows,
            isLinux,
            modifierKey: isMac ? '⌘' : 'Ctrl',
            modifierName: isMac ? 'Cmd' : 'Ctrl',
            platform: info.platform as 'darwin' | 'win32' | 'linux' | 'unknown',
          });
        })
        .catch(() => {
          // fallback remains detectPlatform
        });
    }
  }, []);

  return platformInfo;
}
