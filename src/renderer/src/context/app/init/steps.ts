import { checkInternetStep } from './steps/checkInternet';
import { startBackendStep } from './steps/startBackend';
import { initDbStep } from './steps/initDb';

export const INIT_STEPS = [checkInternetStep, startBackendStep, initDbStep] as const;
