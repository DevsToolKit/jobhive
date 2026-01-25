import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './theme/theme.context.tsx';
import { AppProvider } from './context/app/AppContext.tsx';
import { BackendProvider } from './context/backend/BackendContext.tsx';

createRoot(document.getElementById('root')!).render(
  <BackendProvider>
    <AppProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppProvider>
  </BackendProvider>
);
