import {
  IconHome,
  IconHistory,
  IconBookmark,
  IconSettings,
  IconSearch,
  IconInfoCircle,
} from '@tabler/icons-react';
import type { NavItem } from '@/types/navigation';

export const navMain: NavItem[] = [
  {
    title: 'Workspace',
    url: '/',
    icon: IconHome,
    action: 'navigate',
  },
  {
    title: 'History',
    url: '/history',
    icon: IconHistory,
    action: 'navigate',
  },
  {
    title: 'Presets',
    url: '/presets',
    icon: IconBookmark,
    action: 'navigate',
  },
];

export const navSecondary: NavItem[] = [
  {
    title: 'Search',
    icon: IconSearch,
    action: 'modal',
    modalId: 'search',
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: IconSettings,
    action: 'navigate',
  },
  {
    title: 'About',
    icon: IconInfoCircle,
    action: 'modal',
    modalId: 'about',
  },
];
