import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBackend } from './useBaseUrl';

const mockUseAppContext = vi.fn();

vi.mock('@/context/app/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

describe('useBackend', () => {
  it('returns the backend details from app context', () => {
    mockUseAppContext.mockReturnValue({
      backendBaseUrl: 'http://localhost:8765',
      backendPort: 8765,
      isInitialized: true,
    });

    const { result } = renderHook(() => useBackend());

    expect(result.current).toEqual({
      baseUrl: 'http://localhost:8765',
      port: 8765,
      isReady: true,
    });
  });

  it('marks the backend as not ready when initialization is incomplete', () => {
    mockUseAppContext.mockReturnValue({
      backendBaseUrl: null,
      backendPort: null,
      isInitialized: false,
    });

    const { result } = renderHook(() => useBackend());

    expect(result.current.isReady).toBe(false);
  });
});
