import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';

// Placeholder screens
const HistoryScreen = () => <div className="p-6">History Screen (Coming Soon)</div>;
const PresetsScreen = () => <div className="p-6">Presets Screen (Coming Soon)</div>;
const SettingsScreen = () => <div className="p-6">Settings Screen (Coming Soon)</div>;
const ResultsScreen = () => <div className="p-6">Results Screen (Coming Soon)</div>;

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/presets" element={<PresetsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
