import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './HistoryStats';
import { formatSessionDate, formatSessionTime } from './HistoryTable';

describe('History helper functions', () => {
  it('formats relative time correctly for current time', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('formats dates consistently', () => {
    const date = new Date('2026-09-09T14:30:00Z').toISOString();
    const formattedDate = formatSessionDate(date);
    expect(formattedDate).toBeTruthy();
    expect(typeof formattedDate).toBe('string');
  });

  it('formats time without crashing', () => {
    const date = new Date('2026-09-09T14:30:00Z').toISOString();
    const formattedTime = formatSessionTime(date);
    expect(formattedTime).toBeTruthy();
  });
});
