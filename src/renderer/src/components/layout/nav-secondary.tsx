import * as React from 'react';
import { type Icon } from '@tabler/icons-react';
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
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url ? location.pathname === item.url : false;

            // Modal items
            if (item.action === 'modal') {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} onClick={(e) => handleClick(item, e)}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // Navigation items
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link to={item.url || '#'}>
                    <item.icon />
                    <span>{item.title}</span>
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
