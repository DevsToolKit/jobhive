import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './theme/theme.context.tsx';
import { AppProvider } from './context/app/AppContext.tsx';
import { DashboardProvider } from './screens/dashboard/DashboardContext.tsx';

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <ThemeProvider>
      <DashboardProvider>
        <App />
      </DashboardProvider>
    </ThemeProvider>
  </AppProvider>
);
