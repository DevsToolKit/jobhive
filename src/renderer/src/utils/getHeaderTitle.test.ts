import { describe, expect, it } from 'vitest';

import { getHeaderTitle } from './getHeaderTitle';

describe('getHeaderTitle', () => {
  it('returns an exact navigation title when the route matches', () => {
    expect(getHeaderTitle('/settings')).toBe('Settings');
  });

  it('returns the nested route title for results pages', () => {
    expect(getHeaderTitle('/results/123')).toBe('Results');
  });

  it('falls back to Workspace for unknown routes', () => {
    expect(getHeaderTitle('/does-not-exist')).toBe('Workspace');
  });
});
