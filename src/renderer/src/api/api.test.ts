import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deletePreset, fetchPreset, fetchPresets, markPresetUsed } from './presets';
import { fetchAppSettings, updateAppSettings } from './settings';

describe('API helpers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('fetches app settings from the backend', async () => {
    const payload = {
      theme: 'dark',
      default_location: 'Pune',
      default_results_wanted: 20,
      default_country_indeed: 'india',
      default_sites: ['linkedin'],
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });

    await expect(fetchAppSettings('http://localhost:8765')).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8765/api/settings');
  });

  it('sends settings updates as JSON and returns the response payload', async () => {
    const payload = { theme: 'light' as const };

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ...payload, default_sites: [] }),
    });

    await updateAppSettings('http://localhost:8765', payload);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8765/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  });

  it('throws when settings requests fail', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(fetchAppSettings('http://localhost:8765')).rejects.toThrow(
      'Failed to load app settings'
    );
    await expect(updateAppSettings('http://localhost:8765', { theme: 'dark' })).rejects.toThrow(
      'Failed to update app settings'
    );
  });

  it('fetches preset lists and individual presets', async () => {
    const summaries = [
      {
        id: '1',
        name: 'Remote',
        search_term: 'Python',
        location: null,
        use_count: 0,
        last_used: null,
      },
    ];
    const preset = { ...summaries[0], config: {}, created_at: '2026-03-28T00:00:00Z' };

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(summaries),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(preset),
      });

    await expect(fetchPresets('http://localhost:8765')).resolves.toEqual(summaries);
    await expect(fetchPreset('http://localhost:8765', '1')).resolves.toEqual(preset);
  });

  it('uses the correct methods for preset mutations', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ deleted: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      });

    await deletePreset('http://localhost:8765', 'preset-1');
    await markPresetUsed('http://localhost:8765', 'preset-1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8765/api/presets/preset-1', {
      method: 'DELETE',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8765/api/presets/preset-1/use',
      {
        method: 'POST',
      }
    );
  });

  it('throws when preset requests fail', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(fetchPresets('http://localhost:8765')).rejects.toThrow('Failed to load presets');
    await expect(fetchPreset('http://localhost:8765', '1')).rejects.toThrow(
      'Failed to load preset'
    );
    await expect(deletePreset('http://localhost:8765', '1')).rejects.toThrow(
      'Failed to delete preset'
    );
    await expect(markPresetUsed('http://localhost:8765', '1')).rejects.toThrow(
      'Failed to mark preset usage'
    );
  });
});
