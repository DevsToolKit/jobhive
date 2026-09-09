import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
    <SidebarGroup className="p-0">
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Create Button */}
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              tooltip="New Scrape"
              onClick={handleQuickCreate}
              className="h-9 w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/95 active:text-primary-foreground duration-150 ease-out shadow-xs font-medium cursor-pointer rounded-lg px-3 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
            >
              <Plus className="size-4 shrink-0" />
              <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">New Scrape</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Navigation Items */}
        <SidebarMenu className="gap-1 mt-1">
          {items.map((item) => {
            const isActive = item.url ? location.pathname === item.url : false;

            // Modal items
            if (item.action === 'modal') {
              return (
                <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:justify-center">
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={(e) => handleClick(item, e)}
                    isActive={isActive}
                    className="h-9 px-3 rounded-lg text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium transition-colors cursor-pointer gap-2.5"
                  >
                    {item.icon && <item.icon className="size-4 shrink-0" />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </span>
                    )}
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
                    {item.icon && <item.icon className="size-4 shrink-0" />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground group-data-[collapsible=icon]:hidden">
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
