import type { Preset, PresetSummary } from '@/types/preset';

export async function fetchPresets(baseUrl: string): Promise<PresetSummary[]> {
  const res = await fetch(`${baseUrl}/api/presets`);

  if (!res.ok) {
    throw new Error('Failed to load presets');
  }

  return res.json();
}

export async function fetchPreset(baseUrl: string, presetId: string): Promise<Preset> {
  const res = await fetch(`${baseUrl}/api/presets/${presetId}`);

  if (!res.ok) {
    throw new Error('Failed to load preset');
  }

  return res.json();
}

export async function deletePreset(baseUrl: string, presetId: string) {
  const res = await fetch(`${baseUrl}/api/presets/${presetId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete preset');
  }

  return res.json();
}

export async function markPresetUsed(baseUrl: string, presetId: string) {
  const res = await fetch(`${baseUrl}/api/presets/${presetId}/use`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to mark preset usage');
  }

  return res.json();
}
