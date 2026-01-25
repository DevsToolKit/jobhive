// context/app/init/runInitSteps.ts
import type { InitStep } from './types';
import type { AppState } from '../types';

export async function runInitSteps(
  steps: readonly InitStep[],
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  progress: {
    start: (key: any) => void;
    stop: () => void;
  }
) {
  for (const step of steps) {
    setState((s) => ({
      ...s,
      currentStep: step.id,
      error: null,
    }));

    progress.start(step.progressKey);

    await step.run(setState); // Pass setState
  }
}
