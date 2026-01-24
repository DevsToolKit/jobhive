import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from '@/state/AppContext';
import { MainLayout } from '@/layout/MainLayout';
import { SplashScreen } from '@/screens/SplashScreen';

// Placeholder screens
const HistoryScreen = () => <div className="p-6">History Screen (Coming Soon)</div>;
const PresetsScreen = () => <div className="p-6">Presets Screen (Coming Soon)</div>;
const SettingsScreen = () => <div className="p-6">Settings Screen (Coming Soon)</div>;
const ResultsScreen = () => <div className="p-6">Results Screen (Coming Soon)</div>;

function App() {
  const appState = useAppContext();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen during initialization
  if (appState.isLoading || showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          if (appState.isInitialized) {
            setShowSplash(false);
          }
        }}
      />
    );
  }

  // Show error if initialization failed
  if (appState.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Initialization Failed</h1>
          <p className="mb-4 text-muted-foreground">{appState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with layout (sidebar + header) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HistoryScreen />} />
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
