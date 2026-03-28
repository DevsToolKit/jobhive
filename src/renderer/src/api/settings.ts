import type { AppSettings, AppSettingsUpdate } from '@/types/settings';

export async function fetchAppSettings(baseUrl: string): Promise<AppSettings> {
  const response = await fetch(`${baseUrl}/api/settings`);

  if (!response.ok) {
    throw new Error('Failed to load app settings');
  }

  return response.json();
}

export async function updateAppSettings(
  baseUrl: string,
  payload: AppSettingsUpdate
): Promise<AppSettings> {
  const response = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update app settings');
  }

  return response.json();
}
