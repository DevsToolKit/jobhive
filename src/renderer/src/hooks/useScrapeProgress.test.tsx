import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrapeProgress } from './useScrapeProgress';
import { useBackend } from './useBaseUrl';

vi.mock('./useBaseUrl', () => ({
  useBackend: vi.fn(),
}));

type Listener = (event: MessageEvent) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onopen: ((event: Event) => void) | null = null;
  listeners = new Map<string, Listener[]>();
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener) {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  emit(type: string, data?: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  close() {
    this.closed = true;
  }
}

describe('useScrapeProgress', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource);
    vi.mocked(useBackend).mockReturnValue({
      baseUrl: 'http://localhost:8765',
      port: 8765,
      isReady: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects to the progress stream and updates state from incoming events', () => {
    const { result } = renderHook(() => useScrapeProgress('session-1'));

    expect(MockEventSource.instances).toHaveLength(1);
    const source = MockEventSource.instances[0];
    expect(source.url).toBe('http://localhost:8765/api/scrape/progress/session-1');

    act(() => {
      source.onopen?.(new Event('open'));
      source.emit('progress', { status: 'running', progress: 40, jobs_found: 12 });
    });

    expect(result.current.connected).toBe(true);
    expect(result.current.progress).toEqual({
      status: 'running',
      progress: 40,
      jobs_found: 12,
    });

    act(() => {
      source.emit('status', { status: 'completed', message: 'Done' });
    });

    expect(result.current.progress).toEqual({
      status: 'completed',
      message: 'Done',
    });
  });

  it('closes the stream on backend errors and on unmount', () => {
    const { result, unmount } = renderHook(() => useScrapeProgress('session-2'));
    const source = MockEventSource.instances[0];

    act(() => {
      source.onopen?.(new Event('open'));
      source.emit('error', { status: 'error' });
    });

    expect(result.current.connected).toBe(false);
    expect(source.closed).toBe(true);

    unmount();
    expect(source.closed).toBe(true);
  });

  it('does not connect when there is no session or the backend is not ready', () => {
    vi.mocked(useBackend).mockReturnValue({
      baseUrl: 'http://localhost:8765',
      port: 8765,
      isReady: false,
    });

    renderHook(() => useScrapeProgress(null));
    renderHook(() => useScrapeProgress('session-3'));

    expect(MockEventSource.instances).toHaveLength(0);
  });
});
