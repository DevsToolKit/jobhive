import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ScrapeDraft } from '@/components/scrapeModal/types';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import SearchSpotlight from '@/components/searchModal/SearchSpotlight';
import ScrapeWorkbench from '@/components/scrapeModal/ScrapeWorkbench';

type ModalId = 'search' | 'new-scrape';

export function MainLayout({
  handleModalOpen,
  handleModalClose,
  openModal,
  scrapeDraft,
  onDraftConsumed,
  onRequestNewScrape,
}: {
  handleModalOpen: (modalId: string) => void;
  handleModalClose: () => void;
  openModal: ModalId | null;
  scrapeDraft: ScrapeDraft | null;
  onDraftConsumed: () => void;
  onRequestNewScrape: (draft?: ScrapeDraft) => void;
}) {
  const handleQuickCreate = () => {
    onRequestNewScrape();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        handleModalOpen('search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleModalOpen]);

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '15.5rem',
          '--sidebar-width-icon': '4.75rem',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onModalOpen={handleModalOpen} onQuickCreate={handleQuickCreate} />
      <SidebarInset className="bg-card dark:bg-card/90 overflow-hidden flex flex-col">
        <SiteHeader
          onOpenSearch={() => handleModalOpen('search')}
          onRequestNewScrape={handleQuickCreate}
        />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="@container/main flex flex-1 flex-col min-h-full">
            <Outlet />
          </div>
        </div>
      </SidebarInset>

      <SearchSpotlight
        open={openModal === 'search'}
        onClose={handleModalClose}
        onRequestScrape={onRequestNewScrape}
      />
      <ScrapeWorkbench
        open={openModal === 'new-scrape'}
        onClose={handleModalClose}
        draft={scrapeDraft}
        onDraftConsumed={onDraftConsumed}
      />
    </SidebarProvider>
  );
}
