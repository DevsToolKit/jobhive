import type { Icon } from '@tabler/icons-react';

export type NavigationAction = 'navigate' | 'modal';

export interface NavItem {
  title: string;
  url?: string;
  icon: Icon;
  action: NavigationAction;
  modalId?: string;
  badge?: number;
}
