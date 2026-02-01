import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import SearchModal from '@/components/searchModal/SearchModal';
import ScrapeModal from '@/components/scrapeModal/ScrapeModal';

type ModalId = 'search' | 'about' | 'new-scrape';

export function MainLayout({
  handleModalOpen,
  handleModalClose,
  openModal,
  setOpenModal,
}: {
  handleModalOpen: (modalId: string) => void;
  handleModalClose: () => void;
  openModal: ModalId | null;
  setOpenModal: React.Dispatch<React.SetStateAction<ModalId | null>>;
}) {
  const handleQuickCreate = () => {
    setOpenModal('new-scrape');
  };

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
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 pb-4 md:gap-6 md:pb-6 pt-2!">
              {/* This is where child routes will render */}
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Modals - Uncomment when you create them */}
      <SearchModal open={openModal === 'search'} onClose={handleModalClose} />
      {/* <AboutModal open={openModal === 'about'} onClose={handleModalClose} /> */}
      <ScrapeModal open={openModal === 'new-scrape'} onClose={handleModalClose} />
    </SidebarProvider>
  );
}
