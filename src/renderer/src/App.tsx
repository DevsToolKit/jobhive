import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAppContext } from '@/context/app/AppContext';
import { MainLayout } from '@/layout/MainLayout';
import { SplashScreen } from '@/screens/SplashScreen';
import { InitErrorScreen } from '@/screens/InitErrorScreen';

import Dashboard from '@/screens/dashboard/Dashboard';
import HistoryScreen from './screens/jobHistory/HistoryScreen';

const PresetsScreen = () => <div className="p-6">Presets Screen</div>;
const SettingsScreen = () => <div className="p-6">Settings Screen</div>;
const ResultsScreen = () => <div className="p-6">Results Screen</div>;

export type ModalId = 'search' | 'about' | 'new-scrape';

function App() {
  const app = useAppContext();

  const [showSplash, setShowSplash] = useState(true);
  const [openModal, setOpenModal] = useState<ModalId | null>(null);

  const handleModalOpen = (modalId: string) => {
    setOpenModal(modalId as ModalId);
  };

  const handleModalClose = () => {
    setOpenModal(null);
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
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              handleModalOpen={handleModalOpen}
              handleModalClose={handleModalClose}
              openModal={openModal}
              setOpenModal={setOpenModal}
            />
          }
        >
          <Route index element={<Dashboard setOpenModal={setOpenModal} />} />
          <Route path="history" element={<HistoryScreen />} />
          <Route path="presets" element={<PresetsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="results/:sessionId" element={<ResultsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
