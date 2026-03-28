import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { runInitSteps } from './runInitSteps';
import type { AppState } from '../types';
import type { InitStep } from './types';

function createSetState(initialState: AppState) {
  let state = initialState;

  const setState = vi.fn((updater: SetStateAction<AppState>) => {
    state = typeof updater === 'function' ? updater(state) : updater;
  });

  return {
    setState,
    getState: () => state,
  };
}

describe('runInitSteps', () => {
  it('updates currentStep and starts progress for each init step', async () => {
    const stepRuns: string[] = [];
    const initialState: AppState = {
      isLoading: true,
      isInitialized: false,
      progress: 0,
      currentStep: 'checking_internet',
      error: null,
      backendPort: null,
      backendBaseUrl: null,
    };
    const { setState, getState } = createSetState(initialState);
    const progress = {
      start: vi.fn(),
      stop: vi.fn(),
    };
    const steps: readonly InitStep[] = [
      {
        id: 'checking_internet',
        label: 'Check internet',
        progressKey: 'network',
        run: vi.fn(async () => {
          stepRuns.push('checking_internet');
        }),
      },
      {
        id: 'starting_backend',
        label: 'Start backend',
        progressKey: 'backend',
        run: vi.fn(async (updateState) => {
          stepRuns.push('starting_backend');
          updateState((state) => ({ ...state, backendPort: 8765 }));
        }),
      },
    ];

    await runInitSteps(steps, setState as Dispatch<SetStateAction<AppState>>, progress);

    expect(progress.start).toHaveBeenNthCalledWith(1, 'network');
    expect(progress.start).toHaveBeenNthCalledWith(2, 'backend');
    expect(progress.stop).not.toHaveBeenCalled();
    expect(stepRuns).toEqual(['checking_internet', 'starting_backend']);
    expect(getState().currentStep).toBe('starting_backend');
    expect(getState().backendPort).toBe(8765);
  });
});
