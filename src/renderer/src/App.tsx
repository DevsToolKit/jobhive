import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import type { ScrapeDraft } from '@/components/scrapeModal/types';
import { useAppContext } from '@/context/app/AppContext';
import { MainLayout } from '@/layout/MainLayout';
import AboutScreen from '@/screens/about/AboutScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { InitErrorScreen } from '@/screens/InitErrorScreen';
import PresetsScreen from '@/screens/presets/PresetsScreen';
import ResultsScreen from '@/screens/results/ResultsScreen';
import SettingsScreen from '@/screens/settings/SettingsPanel';

import Dashboard from '@/screens/dashboard/Dashboard';
import HistoryScreen from './screens/jobHistory/HistoryScreen';

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
          <Route path="history" element={<HistoryScreen />} />
          <Route
            path="presets"
            element={
              <PresetsScreen
                onUsePreset={(draft) => handleRequestNewScrape(draft)}
                onCreatePreset={() => handleRequestNewScrape({ save_as_preset: true })}
              />
            }
          />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="about" element={<AboutScreen />} />
          <Route path="results/:sessionId" element={<ResultsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
