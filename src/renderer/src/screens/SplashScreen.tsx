import { useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/state/AppContext';

const STEP_LABELS = {
  checking_internet: 'Checking internet connection...',
  starting_backend: 'Starting Python backend...',
  initializing_db: 'Initializing database...',
  ready: 'Ready!',
} as const;

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const app = useAppContext();
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (app.isInitialized && !hasCompleted.current) {
      hasCompleted.current = true;
      const t = setTimeout(() => onComplete?.(), 300);
      return () => clearTimeout(t);
    }
  }, [app.isInitialized, onComplete]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-80 text-center">
        <h1 className="mb-2 text-3xl font-bold">JobHive</h1>
        <p className="mb-8 text-muted-foreground">Local-first job scraping</p>

        <Progress value={app.progress} className="mb-4 h-2" />

        <div className="relative h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={app.currentStep}
              className="absolute inset-0 text-sm text-muted-foreground"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {STEP_LABELS[app.currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
