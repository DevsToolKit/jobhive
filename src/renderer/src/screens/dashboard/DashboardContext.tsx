import { createContext, useContext, ReactNode } from 'react';
import { useDashboardData } from './useDashboardData';
import { Session } from '@/types/session';
import { Job } from '@/types/job';

type DashboardContextType = {
  session: Session | null;
  jobs: Job[];
  isLoading: boolean;
  refreshDashboard: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const dashboardData = useDashboardData();

  return <DashboardContext.Provider value={dashboardData}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
