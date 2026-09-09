import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types/navigation';

interface NavSecondaryProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  items: NavItem[];
  onModalOpen?: (modalId: string) => void;
}

export function NavSecondary({ items, onModalOpen, ...props }: NavSecondaryProps) {
  const location = useLocation();

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.action === 'modal' && item.modalId) {
      e.preventDefault();
      onModalOpen?.(item.modalId);
    }
  };

  return (
    <SidebarGroup className="p-0" {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const isActive = item.url ? location.pathname === item.url : false;

            // Modal items
            if (item.action === 'modal') {
              return (
                <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:justify-center">
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={(e) => handleClick(item, e)}
                    className="h-9 px-3 rounded-lg text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium transition-colors cursor-pointer gap-2.5"
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // Navigation items
            return (
              <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="h-9 px-3 rounded-lg text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium transition-colors cursor-pointer gap-2.5"
                >
                  <Link to={item.url || '#'}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
