import { SectionCards } from '@/components/layout/section-cards';
import { ChartAreaInteractive } from '@/components/layout/chart-area-interactive';
import { DataTable } from '@/components/layout/data-table';

export function WorkspaceScreen() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  );
}
