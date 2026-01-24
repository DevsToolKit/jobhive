import { IconCirclePlusFilled, type Icon } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types/navigation';

interface NavMainProps {
  items: NavItem[];
  onModalOpen?: (modalId: string) => void;
  onQuickCreate?: () => void;
}

export function NavMain({ items, onModalOpen, onQuickCreate }: NavMainProps) {
  const location = useLocation();

  const handleClick = (item: NavItem, e: React.MouseEvent) => {
    if (item.action === 'modal' && item.modalId) {
      e.preventDefault();
      onModalOpen?.(item.modalId);
    }
  };

  const handleQuickCreate = (e: React.MouseEvent) => {
    e.preventDefault();
    onQuickCreate?.();
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Create Button */}
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              onClick={handleQuickCreate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>New Scrape</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Navigation Items */}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url ? location.pathname === item.url : false;

            // Modal items
            if (item.action === 'modal') {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={(e) => handleClick(item, e)}
                    isActive={isActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // Navigation items
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link to={item.url || '#'}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                        {item.badge}
                      </span>
                    )}
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
