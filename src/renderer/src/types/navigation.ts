import type { IconType } from 'react-icons';

export type NavigationAction = 'navigate' | 'modal';

export interface NavItem {
  title: string;
  url?: string;
  icon: IconType;
  action: NavigationAction;
  modalId?: string;
  badge?: number;
}
