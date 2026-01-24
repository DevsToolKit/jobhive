import * as React from 'react';
import { IconInnerShadowTop } from '@tabler/icons-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { navMain, navSecondary } from '@/config/navigation';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import ProductInfo from './nav-productinfo';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onModalOpen?: (modalId: string) => void;
  onQuickCreate?: () => void;
}

export function AppSidebar({ onModalOpen, onQuickCreate, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <a href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">JobHive</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} onModalOpen={onModalOpen} onQuickCreate={onQuickCreate} />
        <NavSecondary items={navSecondary} onModalOpen={onModalOpen} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter className="group-data-[state=collapsed]:hidden">
        <ProductInfo />
      </SidebarFooter>
    </Sidebar>
  );
}
