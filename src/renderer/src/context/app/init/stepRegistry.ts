import type { InitStepId } from './types';
import { INIT_STEPS } from './steps';

const stepMap = new Map<InitStepId, string>();

for (const step of INIT_STEPS) {
  stepMap.set(step.id, step.label);
}

stepMap.set('ready', 'Ready!');

export function getStepLabel(stepId: InitStepId): string {
  return stepMap.get(stepId) ?? 'Starting...';
}
