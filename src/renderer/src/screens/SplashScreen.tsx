import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

const loadingSteps: readonly string[] = [
  'Checking internet connection...',
  'Starting Python backend...',
  'Initializing database...',
  'Ready!',
];

// Progress ranges per step (min %, max %)
const STEP_RANGES: readonly [number, number][] = [
  [0, 20],
  [20, 50],
  [50, 80],
  [80, 100],
];

type SplashScreenProps = {
  onComplete?: () => void;
};

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const STEP_DURATION = 1000; // ms per step
    const PROGRESS_TICK = 120; // ms between progress updates

    let stepTimer: ReturnType<typeof setInterval>;
    let progressTimer: ReturnType<typeof setInterval>;

    // Step progression
    stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;

        if (next >= loadingSteps.length) {
          clearInterval(stepTimer);
          clearInterval(progressTimer);
          setProgress(100);
          setTimeout(() => onComplete?.(), 500);
          return prev;
        }

        return next;
      });
    }, STEP_DURATION);

    // Randomized progress updater
    progressTimer = setInterval(() => {
      setProgress((prev) => {
        const [_, max] = STEP_RANGES[currentStep];

        if (prev >= max) return prev;

        const increment = Math.random() * 3 + 1; // 1–4%
        return Math.min(prev + increment, max);
      });
    }, PROGRESS_TICK);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    };
  }, [currentStep, onComplete]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-80 text-center">
        {/* App Name */}
        <h1 className="mb-2 text-3xl font-bold">JobHive</h1>
        <p className="mb-8 text-muted-foreground">Local-first job scraping</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress value={progress} className="h-2 transition-all duration-200" />
        </div>

        {/* Status Text */}
        <div className="relative h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              className="absolute inset-0 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.25,
                ease: 'easeOut',
              }}
            >
              {loadingSteps[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
