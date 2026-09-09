import { lazy, Suspense, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import type { ScrapeDraft } from '@/components/scrapeModal/types';
import { useAppContext } from '@/context/app/AppContext';
import { MainLayout } from '@/layout/MainLayout';
import { SplashScreen } from '@/screens/SplashScreen';
import { InitErrorScreen } from '@/screens/InitErrorScreen';
import Dashboard from '@/screens/dashboard/Dashboard';

const AboutScreen = lazy(() => import('@/screens/about/AboutScreen'));
const PresetsScreen = lazy(() => import('@/screens/presets/PresetsScreen'));
const ResultsScreen = lazy(() => import('@/screens/results/ResultsScreen'));
const SettingsScreen = lazy(() => import('@/screens/settings/SettingsPanel'));
const HistoryScreen = lazy(() => import('./screens/jobHistory/HistoryScreen'));

function RouteLoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground animate-pulse">
      Loading...
    </div>
  );
}

export type ModalId = 'search' | 'new-scrape';

function App() {
  const app = useAppContext();

  const [showSplash, setShowSplash] = useState(true);
  const [openModal, setOpenModal] = useState<ModalId | null>(null);
  const [scrapeDraft, setScrapeDraft] = useState<ScrapeDraft | null>(null);

  const handleModalOpen = (modalId: string) => {
    setOpenModal(modalId as ModalId);
  };

  const handleModalClose = () => {
    setOpenModal(null);
  };

  const handleRequestNewScrape = (draft?: ScrapeDraft) => {
    setScrapeDraft(draft ?? null);
    setOpenModal('new-scrape');
  };

  if (app.error) {
    return <InitErrorScreen />;
  }

  if (app.isLoading || showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          if (app.isInitialized) {
            setShowSplash(false);
          }
        }}
      />
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              handleModalOpen={handleModalOpen}
              handleModalClose={handleModalClose}
              openModal={openModal}
              scrapeDraft={scrapeDraft}
              onDraftConsumed={() => setScrapeDraft(null)}
              onRequestNewScrape={handleRequestNewScrape}
            />
          }
        >
          <Route index element={<Dashboard onNewScrape={() => handleRequestNewScrape()} />} />
          <Route
            path="history"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <HistoryScreen />
              </Suspense>
            }
          />
          <Route
            path="presets"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <PresetsScreen
                  onUsePreset={(draft) => handleRequestNewScrape(draft)}
                  onCreatePreset={() => handleRequestNewScrape({ save_as_preset: true })}
                />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <SettingsScreen />
              </Suspense>
            }
          />
          <Route
            path="about"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <AboutScreen />
              </Suspense>
            }
          />
          <Route
            path="results/:sessionId"
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <ResultsScreen />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
