import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { useAppContext } from '@/context/app/AppContext';
import { MainLayout } from '@/layout/MainLayout';
import { SplashScreen } from '@/screens/SplashScreen';
import { InitErrorScreen } from '@/screens/InitErrorScreen';

import Dashboard from '@/screens/Dashboard';

const HistoryScreen = () => <div className="p-6">History Screen</div>;
const PresetsScreen = () => <div className="p-6">Presets Screen</div>;
const SettingsScreen = () => <div className="p-6">Settings Screen</div>;
const ResultsScreen = () => <div className="p-6">Results Screen</div>;

function App() {
  const app = useAppContext();
  const [showSplash, setShowSplash] = useState(true);

  // 1️⃣ Initialization failed → error page
  if (app.error) {
    return <InitErrorScreen />;
  }

  // 2️⃣ Still initializing → splash
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

  // 3️⃣ App ready → normal routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
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
