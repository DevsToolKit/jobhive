import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { APP_CONFIG } from '@/config/app';
import { navMain, navSecondary } from '@/config/navigation';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import ProductInfo from './nav-productinfo';
import appLogo from '@/assets/logo.png';
import { usePlatform } from '@/hooks/usePlatform';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onModalOpen?: (modalId: string) => void;
  onQuickCreate?: () => void;
}

export function AppSidebar({ onModalOpen, onQuickCreate, ...props }: AppSidebarProps) {
  const { isMac } = usePlatform();

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Dedicated Mac window drag space for traffic lights */}
      {isMac && <div className="h-10 app-drag shrink-0 w-full" aria-hidden="true" />}

      <SidebarHeader className={`px-3 ${!isMac ? 'pt-3 pb-2' : 'pt-1 pb-2'}`}>
        <div className="flex items-center gap-2.5 px-0.5 py-1 app-no-drag group-data-[collapsible=icon]:justify-center">
          <img
            src={appLogo}
            alt={APP_CONFIG.name}
            className="size-6 shrink-0 rounded-md object-contain shadow-xs group-data-[collapsible=icon]:size-7"
          />
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {APP_CONFIG.name}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <NavMain items={navMain} onModalOpen={onModalOpen} onQuickCreate={onQuickCreate} />
        <NavSecondary items={navSecondary} onModalOpen={onModalOpen} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3 pt-1 group-data-[collapsible=icon]:hidden">
        <ProductInfo />
      </SidebarFooter>
    </Sidebar>
  );
}
