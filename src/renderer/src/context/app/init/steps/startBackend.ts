import type { InitStep } from '../types';

function stringifyDetails(details: unknown) {
  if (!details) {
    return null;
  }

  if (typeof details === 'string') {
    return details;
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export const startBackendStep: InitStep = {
  id: 'starting_backend',
  label: 'Starting backend',
  progressKey: 'starting_backend',

  async run(setState) {
    const res = await window.app.start_backend();

    if (!res.ok || !res.running || !res.port) {
      throw {
        id: res.errorId ?? 'BACKEND_START_FAILED',
        message: res.message ?? 'Failed to start backend service.',
        details: stringifyDetails(res.details),
        logsPath: res.logsPath,
        diagnostics: res.diagnostics ?? null,
      };
    }

    const baseUrl = `http://127.0.0.1:${res.port}`;
    setState((prev) => ({
      ...prev,
      backendPort: res.port,
      backendBaseUrl: baseUrl,
    }));
  },
};
