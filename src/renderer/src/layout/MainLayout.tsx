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
          '--sidebar-width': 'calc(var(--spacing) * 62)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onModalOpen={handleModalOpen} onQuickCreate={handleQuickCreate} />
      <SidebarInset className="bg-card dark:bg-card/90 overflow-hidden">
        <SiteHeader
          onOpenSearch={() => handleModalOpen('search')}
          onRequestNewScrape={handleQuickCreate}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="px-3 pb-6 pt-3">
              <Outlet />
              {/* <div className="min-h-[calc(100vh-var(--header-height)-1.5rem)] rounded-[28px] border border-border/70 bg-card shadow-[0_22px_55px_-40px_rgba(15,23,42,0.28)] dark:bg-card/90 dark:shadow-none">
                <div className="flex flex-col gap-4 md:gap-6"></div>
              </div> */}
            </div>
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
